import { eq } from 'drizzle-orm';
import { z } from 'zod';

import {
  AI_POLISH,
  buildSystemPrompt,
  buildUserPrompt,
  cleanSuggestion,
  introducesNewNumbers,
} from '@/lib/aiPolish';
import { getSessionUser } from '@/server/auth/session';
import { db } from '@/server/db';
import { rateLimit } from '@/server/db/schema';
import { isAiAllowed, serverEnv } from '@/server/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const DEFAULT_MODEL = 'gemini-2.5-flash';
const API = 'https://generativelanguage.googleapis.com/v1beta';

/** `models/gemini-x` and `gemini-x` both mean the same model; the URL wants the second. */
const normaliseModel = (name: string): string => name.trim().replace(/^models\//, '');

/** Names a person would not choose for rewriting text: previews, image and speech models. */
const UNWANTED = /preview|exp|latest|tts|image|live|audio|embedding|thinking|lite|learn/i;

/**
 * A model this key can actually call, asked of the API instead of guessed.
 *
 * Model names are retired and renamed faster than a deployment is edited, and a
 * wrong one answers 404 for every request. On a 404 the list is read once and
 * the first stable Gemini Flash that supports `generateContent` is used, then
 * remembered for the life of the instance.
 */
let discovered: string | null = null;

const discoverModel = async (key: string): Promise<string | null> => {
  if (discovered) return discovered;

  try {
    const response = await fetch(`${API}/models?pageSize=200`, {
      headers: { 'x-goog-api-key': key },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;

    const body = (await response.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };
    const names = (body.models ?? [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => normaliseModel(model.name ?? ''))
      .filter((name) => /^gemini-.*flash/i.test(name) && !UNWANTED.test(name))
      // Newest generation first: gemini-2.5-flash before gemini-2.0-flash.
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    discovered = names[0] ?? null;
  } catch {
    discovered = null;
  }

  return discovered;
};

const bodySchema = z.object({
  kind: z.enum(['bullet', 'summary']),
  text: z.string().trim().min(3).max(AI_POLISH.maxTextChars),
  context: z.string().trim().max(AI_POLISH.maxContextChars).optional(),
  jobDescription: z.string().trim().max(AI_POLISH.maxJobDescriptionChars).optional(),
});

const fail = (status: number, error: string, code?: string) =>
  Response.json({ error, ...(code ? { code } : {}) }, { status });

/** One account's allowance, in the same table the PDF and auth limits use. */
const spendAllowance = async (userId: string): Promise<boolean> => {
  const key = `ai:${userId}`;
  const now = Date.now();
  const { windowMs, max } = AI_POLISH.rateLimit;

  try {
    const database = db();
    const existing = await database.query.rateLimit.findFirst({ where: eq(rateLimit.key, key) });
    const inside = existing && now - existing.lastRequest < windowMs;

    if (inside && existing.count >= max) return false;

    await database
      .insert(rateLimit)
      .values({ id: key, key, count: 1, lastRequest: now })
      .onConflictDoUpdate({
        target: rateLimit.key,
        set: {
          count: inside ? existing.count + 1 : 1,
          lastRequest: inside ? existing.lastRequest : now,
        },
      });
  } catch (error) {
    // The allowance protects a free quota; an outage in it should not take the
    // feature away from the few accounts allowed to use it.
    console.error('[ai] allowance lookup failed', error);
  }

  return true;
};

/**
 * Rewrites one bullet or summary with Gemini.
 *
 * Allow-listed accounts only, and the check is here: a hidden button is a
 * suggestion. The key never leaves the server, the request is capped, and the
 * answer is refused if it contains a number the original did not — the one
 * kind of invention that is cheap to detect and expensive to send to an
 * employer.
 */
export async function POST(request: Request) {
  const user = await getSessionUser(request.headers, { fresh: true });

  if (!user || !isAiAllowed(user.email)) {
    return fail(403, 'AI polish is not available for this account.', 'ai_not_allowed');
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, 'That text could not be polished.');

  if (!(await spendAllowance(user.id))) {
    return fail(429, 'You have used this hour’s AI polishes. Try again later.', 'ai_rate_limited');
  }

  const env = serverEnv();
  const input = parsed.data;
  const key = env.GEMINI_API_KEY as string;
  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: buildSystemPrompt(input.kind, Boolean(input.jobDescription)) }],
    },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  });

  const generate = (model: string) =>
    fetch(`${API}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: requestBody,
      signal: AbortSignal.timeout(25_000),
    });

  let model = discovered ?? normaliseModel(env.GEMINI_MODEL ?? DEFAULT_MODEL);
  let response: Response;

  try {
    response = await generate(model);

    // A model name that no longer exists answers 404 to everything.
    if (response.status === 404) {
      const alternative = await discoverModel(key);

      if (alternative && alternative !== model) {
        model = alternative;
        response = await generate(model);
      }
    }
  } catch {
    return fail(502, 'The AI service did not answer. Try again in a moment.');
  }

  if (!response.ok) {
    // The reason Google gives names the model or the key, never the text; it is
    // what an operator needs and the only place it is written down.
    const detail = await response
      .json()
      .then((body: { error?: { message?: string } }) => body.error?.message ?? '')
      .catch(() => '');

    console.error('[ai] gemini status', response.status, 'model', model, detail.slice(0, 300));

    return fail(
      response.status === 429 ? 429 : 502,
      response.status === 429
        ? 'The free AI quota is used up for now. Try again later.'
        : 'The AI service could not rewrite that.',
      response.status === 429 ? 'ai_quota' : undefined,
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  } | null;

  const raw =
    payload?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  const suggestion = cleanSuggestion(raw);

  if (!suggestion) return fail(502, 'The AI service returned nothing usable.');

  if (introducesNewNumbers(input.text, suggestion)) {
    return fail(
      422,
      'The rewrite added a number that is not in your text, so it was discarded. Try again.',
      'ai_invented',
    );
  }

  return Response.json({ suggestion });
}
