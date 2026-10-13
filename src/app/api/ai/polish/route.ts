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
  const model = env.GEMINI_MODEL ?? DEFAULT_MODEL;

  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY as string,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: buildSystemPrompt(input.kind, Boolean(input.jobDescription)) }],
          },
          contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );
  } catch {
    return fail(502, 'The AI service did not answer. Try again in a moment.');
  }

  if (!response.ok) {
    console.error('[ai] gemini status', response.status);

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
