import 'server-only';

import { z } from 'zod';

/**
 * The server's environment, parsed once and never read raw again.
 *
 * `process.env` is a bag of `string | undefined` that reports a typo as a
 * runtime `undefined` somewhere far from the mistake. Parsing it here turns a
 * missing `DATABASE_URL` into one sentence naming the variable, at the moment
 * something first needs it.
 *
 * Nothing here is public. This module is `server-only`, so importing it from a
 * client component is a build error rather than a secret in the bundle.
 */

const envSchema = z.object({
  DATABASE_URL: z.url().optional(),
  /** Signs session cookies and the verification tokens. */
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  /** The app's own origin. Derived from the platform when it is not set. */
  BETTER_AUTH_URL: z.url().optional(),

  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  /** `CleanCV <hello@example.com>`, or a bare address. */
  EMAIL_FROM: z.string().min(3).optional(),
  /**
   * `true` turns on email-and-password accounts. Off by default: they need a
   * mail provider that can reach any address, which means a verified sending
   * domain, and Google sign-in needs none of that.
   */
  EMAIL_AUTH_ENABLED: z.enum(['true', 'false']).optional(),

  /** Google AI Studio key for the optional AI polish. Server-side only. */
  GEMINI_API_KEY: z.string().min(1).optional(),
  /** Overrides the default model without a code change. */
  GEMINI_MODEL: z.string().min(1).optional(),
  /**
   * Comma-separated emails allowed to use AI polish. Empty means nobody: the
   * feature is for a handful of named accounts, not a public promise.
   */
  AI_ALLOWED_EMAILS: z.string().optional(),
  /**
   * Comma-separated emails whose accounts have no cloud-sync limit. Left unset,
   * it is the AI list: the same few named accounts the owner trusts.
   */
  CLOUD_UNLIMITED_EMAILS: z.string().optional(),

  /** The only account allowed to open the private usage dashboard. */
  ADMIN_EMAIL: z.email().optional(),

  /** Set by Vercel. The deployment's own hostname, without a scheme. */
  VERCEL_URL: z.string().optional(),
  /** Set by Vercel to the stable production hostname, without a scheme. */
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

/**
 * `process.env` with the blanks taken out.
 *
 * `.optional()` means *absent*, not empty — so `DATABASE_URL=""` in a
 * half-filled `.env.local` is a string that fails `z.url()` rather than a
 * variable that is not set, and the whole app answers 500. That file is the
 * normal state of a fresh checkout: it is copied from `.env.example` and filled
 * in one line at a time. An empty value means "not set", and is read that way.
 */
const withoutBlanks = (source: NodeJS.ProcessEnv): Record<string, string> =>
  Object.fromEntries(
    Object.entries(source).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== '',
    ),
  );

const parseEnv = (): ServerEnv => {
  const result = envSchema.safeParse(withoutBlanks(process.env));

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Environment is not valid — ${detail}`);
  }

  return result.data;
};

export const serverEnv = (): ServerEnv => (cached ??= parseEnv());

/**
 * Whether accounts can work at all.
 *
 * Auth needs a database and a secret. Without them the app still runs — the
 * editor, the designs, the score and the JSON backup never needed an account —
 * and the sign-in pages say so instead of throwing a stack trace at a reader
 * who only cloned the repo.
 *
 * In production that leniency would be a hole rather than a kindness, so
 * `assertAuthConfigured` refuses to serve a deployment that is missing them.
 */
export const isAuthConfigured = (): boolean => {
  const env = serverEnv();

  return Boolean(env.DATABASE_URL && env.BETTER_AUTH_SECRET);
};

export const assertAuthConfigured = (): void => {
  if (isAuthConfigured()) return;

  throw new Error(
    'Auth is not configured. Set DATABASE_URL and BETTER_AUTH_SECRET (see .env.example).',
  );
};

/**
 * Email-and-password accounts, offered only where mail can actually be sent.
 *
 * Three things have to be true: the operator asked for them, a provider key
 * exists, and a sender address exists. A sign-up form on a deployment whose
 * mail provider only delivers to its owner takes the reader's details, sends
 * nothing, and says "check your inbox" — worse than not offering it.
 */
export const isEmailAuthEnabled = (): boolean => {
  const env = serverEnv();

  return env.EMAIL_AUTH_ENABLED === 'true' && Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
};

/** The accounts that may use AI polish, lower-cased. */
export const aiAllowedEmails = (): string[] =>
  (serverEnv().AI_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

/** AI polish exists on this deployment only with a key and at least one named account. */
export const isAiConfigured = (): boolean =>
  Boolean(serverEnv().GEMINI_API_KEY) && aiAllowedEmails().length > 0;

export const isAiAllowed = (email: string): boolean =>
  isAiConfigured() && aiAllowedEmails().includes(email.trim().toLowerCase());

/** The accounts exempt from the cloud-sync limit, lower-cased. */
export const cloudUnlimitedEmails = (): string[] => {
  const env = serverEnv();

  return (env.CLOUD_UNLIMITED_EMAILS ?? env.AI_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
};

export const isCloudUnlimited = (email: string): boolean =>
  cloudUnlimitedEmails().includes(email.trim().toLowerCase());

/** Google sign-in is offered only where credentials for it exist. */
export const isGoogleConfigured = (): boolean => {
  const env = serverEnv();

  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
};

/**
 * The origin links in emails point at.
 *
 * `BETTER_AUTH_URL` wins where it is set. Otherwise the production hostname
 * Vercel exposes, then the per-deployment one — a preview build's own URL is
 * right for a preview, and wrong to bake into a production email.
 */
export const appUrl = (): string => {
  const env = serverEnv();

  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL.replace(/\/$/, '');
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;

  return 'http://localhost:3000';
};

export const isProduction = (): boolean => serverEnv().NODE_ENV === 'production';
