import { eq } from 'drizzle-orm';
import { z } from 'zod';

import {
  AI_POLISH,
  buildGenerateSummaryPrompt,
  buildGenerateSummaryUser,
  buildRewriteBulletsPrompt,
  buildRewriteBulletsUser,
  buildSystemPrompt,
  buildUserPrompt,
  cleanSuggestion,
  introducesNewNumbers,
  parseBulletList,
} from '@/lib/aiPolish';
import { getSessionUser } from '@/server/auth/session';
import { db } from '@/server/db';
import { rateLimit } from '@/server/db/schema';
import { isAiAllowed, serverEnv } from '@/server/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const DEFAULT_MODEL = 'gemini-2.5-flash';
const API = 'https://generativelanguage.googleapis.com/v1beta';

/** `models/gemini-x` and `gemini-x` both mean the same model; the URL wants the second. */
const normaliseModel = (name: string): string => name.trim().replace(/^models\//, '');

/**
 * Models known to take plain text, in the order they are worth trying. Names are
 * retired and renamed faster than a deployment is edited, so these are matched
 * against what the key can actually see rather than assumed.
 */
const PREFERRED = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-flash-latest',
  'gemini-1.5-flash',
  // Lighter models have their own quota and are rarely the ones under load.
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-flash-lite-latest',
];

/** Answers that mean "not this model, not right now" rather than "not you". */
const TRY_NEXT = new Set([404, 429, 500, 503]);

/** `gemini-2.5-flash`, `gemini-3-flash`: a plain numbered Flash and nothing exotic. */
const PLAIN_FLASH = /^gemini-\d+(?:\.\d+)?-flash$/i;

/** Remembered for the life of the instance once one of them has answered. */
let working: string | null = null;
let candidates: string[] | null = null;

/**
 * The models this key can call, best first.
 *
 * Asked of the API on the first failure instead of guessed: the same key sees
 * different models in different projects, and some listed models (multimodal,
 * experimental, preview) have no free quota at all and answer 429 to everything.
 */
const listCandidates = async (key: string): Promise<string[]> => {
  if (candidates) return candidates;

  try {
    const response = await fetch(`${API}/models?pageSize=200`, {
      headers: { 'x-goog-api-key': key },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return [];

    const body = (await response.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };
    const available = (body.models ?? [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => normaliseModel(model.name ?? ''));

    const preferred = PREFERRED.filter((name) => available.includes(name));
    const others = available
      .filter((name) => PLAIN_FLASH.test(name) && !preferred.includes(name))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    candidates = [...preferred, ...others];
  } catch {
    candidates = [];
  }

  return candidates;
};

const instruction = z.string().trim().max(AI_POLISH.maxInstructionChars).optional();
const jobDescription = z.string().trim().max(AI_POLISH.maxJobDescriptionChars).optional();
const context = z.string().trim().max(AI_POLISH.maxContextChars).optional();

/**
 * Three things can be asked of the model:
 *
 * - `bullet` / `summary` - tidy the one text the reader wrote (the original
 *   "Polish with AI"), optionally steered by an instruction.
 * - `summary-generate` - write a summary for a named role from a digest of the
 *   CV, so the same CV gives a different summary for "Frontend" and "Full Stack".
 * - `bullets` - rewrite every bullet of one job or project at once, following
 *   the reader's instruction.
 */
const bodySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.enum(['bullet', 'summary']),
    text: z.string().trim().min(3).max(AI_POLISH.maxTextChars),
    context,
    jobDescription,
    instruction,
  }),
  z.object({
    kind: z.literal('summary-generate'),
    role: z.string().trim().min(2).max(120),
    facts: z.string().trim().min(20).max(AI_POLISH.maxFactsChars),
    jobDescription,
    instruction,
  }),
  z.object({
    kind: z.literal('bullets'),
    bullets: z
      .array(z.string().trim().min(3).max(AI_POLISH.maxTextChars))
      .min(1)
      .max(AI_POLISH.maxBullets),
    context,
    jobDescription,
    instruction,
  }),
]);

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
    return fail(403, 'এই অ্যাকাউন্টে AI দিয়ে লেখা ঠিক করার সুবিধা নেই।', 'ai_not_allowed');
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, 'এই লেখাটি গুছিয়ে দেওয়া যায়নি।');

  if (!(await spendAllowance(user.id))) {
    return fail(429, 'এই ঘণ্টায় AI দিয়ে লেখা ঠিক করার সীমা শেষ। পরে আবার চেষ্টা করুন।', 'ai_rate_limited');
  }

  const env = serverEnv();
  const input = parsed.data;
  const key = env.GEMINI_API_KEY as string;
  const hasJob = Boolean(input.jobDescription);
  const system =
    input.kind === 'summary-generate'
      ? buildGenerateSummaryPrompt(hasJob)
      : input.kind === 'bullets'
        ? buildRewriteBulletsPrompt(hasJob)
        : buildSystemPrompt(input.kind, hasJob);
  const prompt =
    input.kind === 'summary-generate'
      ? buildGenerateSummaryUser(input)
      : input.kind === 'bullets'
        ? buildRewriteBulletsUser(input)
        : buildUserPrompt(input);
  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: input.kind === 'summary-generate' ? 0.5 : 0.3,
      maxOutputTokens: input.kind === 'bullets' ? 2048 : 1024,
    },
  });

  const generate = (model: string) =>
    fetch(`${API}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: requestBody,
      signal: AbortSignal.timeout(9_000),
    });

  const configured = normaliseModel(env.GEMINI_MODEL ?? DEFAULT_MODEL);
  let model = working ?? configured;
  let response: Response;

  try {
    response = await generate(model);

    /*
     * A wrong name answers 404, a model with no free quota 429, and a busy one
     * 503 — each per model. Move to the models this key can really see, a few
     * at most, before telling anyone it cannot be done.
     */
    if (TRY_NEXT.has(response.status)) {
      working = null;

      const tried = new Set([model]);
      const options = (await listCandidates(key)).filter((name) => !tried.has(name)).slice(0, 4);

      for (const option of options) {
        // Overload is usually a few hundred milliseconds old; a breath is enough.
        if (response.status === 503) await new Promise((resolve) => setTimeout(resolve, 600));

        model = option;
        response = await generate(option);

        if (response.ok || !TRY_NEXT.has(response.status)) break;
      }
    }

    if (response.ok) working = model;
  } catch {
    return fail(502, 'AI সার্ভিস সাড়া দেয়নি। একটু পরে আবার চেষ্টা করুন।');
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
        ? 'ফ্রি AI কোটা আপাতত শেষ। পরে আবার চেষ্টা করুন।'
        : response.status === 503
          ? 'Google-এর AI এখন ব্যস্ত। এক মিনিট পরে আবার চেষ্টা করুন।'
          : 'AI সার্ভিস এটি নতুন করে লিখতে পারেনি।',
      response.status === 429 ? 'ai_quota' : undefined,
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  } | null;

  const raw =
    payload?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';

  /*
   * A whole entry. Each bullet is checked against its own original: a number
   * that was not in that bullet sends that one bullet back unchanged, rather
   * than throwing away four good rewrites for the sake of one bad one.
   */
  if (input.kind === 'bullets') {
    const rewritten = parseBulletList(raw, input.bullets.length);

    if (!rewritten) return fail(502, 'AI সার্ভিস ব্যবহারযোগ্য কিছু ফেরত দেয়নি।');

    let kept = 0;
    const suggestions = rewritten.map((suggestion, index) => {
      const original = input.bullets[index];

      if (!suggestion || introducesNewNumbers(original, suggestion)) {
        kept += 1;

        return original;
      }

      return suggestion;
    });

    return Response.json({ suggestions, kept });
  }

  const suggestion = cleanSuggestion(raw);

  if (!suggestion) return fail(502, 'AI সার্ভিস ব্যবহারযোগ্য কিছু ফেরত দেয়নি।');

  // A summary written from the CV may use the CV's numbers, and only those.
  const source = input.kind === 'summary-generate' ? input.facts : input.text;

  if (introducesNewNumbers(source, suggestion)) {
    return fail(
      422,
      'AI-র নতুন লেখায় এমন একটি সংখ্যা এসেছিল যা আপনার লেখায় ছিল না, তাই এটি বাদ দেওয়া হয়েছে। আবার চেষ্টা করুন।',
      'ai_invented',
    );
  }

  return Response.json({ suggestion });
}
