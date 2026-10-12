import 'server-only';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

import {
  APP_NAME,
  AUTH_RATE_LIMIT,
  AUTH_ROUTES,
  PASSWORD_MAX,
  PASSWORD_MIN,
  SESSION_COOKIE_CACHE_S,
  SESSION_MAX_AGE_S,
  SESSION_REFRESH_S,
} from '@/constants';

import { db } from '../db';
import { authSchema } from '../db/schema';
import {
  appUrl,
  assertAuthConfigured,
  isEmailAuthEnabled,
  isGoogleConfigured,
  serverEnv,
} from '../env';
import { sendEmail } from '../email/send';
import { resetPasswordEmail, verifyEmail } from '../email/templates';

/**
 * The auth server.
 *
 * Built on first use rather than at import, for the same reason the database
 * handle is: `next build` compiles this module, and a build should not need a
 * production secret to know whether the editor type-checks.
 *
 * Everything the reader can do without an account stays outside this file.
 * The only thing an account buys is a PDF, and that gate is one session check
 * in `/api/pdf` — see ADR-048.
 */

const createAuth = () => {
  assertAuthConfigured();

  const env = serverEnv();
  const baseURL = appUrl();

  return betterAuth({
    appName: APP_NAME,
    baseURL,
    secret: env.BETTER_AUTH_SECRET,

    database: drizzleAdapter(db(), {
      provider: 'pg',
      schema: authSchema,
      /*
       * Neon's HTTP driver has no transactions, so the adapter runs its
       * operations one after another. Left explicit because the default
       * changing under us would be a silent correctness change.
       */
      transaction: false,
    }),

    emailAndPassword: {
      /*
       * Switched off in the server, not only hidden in the form: with it off the
       * email endpoints refuse, so nobody can create an unconfirmable account
       * by calling them directly.
       */
      enabled: isEmailAuthEnabled(),
      minPasswordLength: PASSWORD_MIN,
      maxPasswordLength: PASSWORD_MAX,
      /*
       * No session until the address is confirmed. Without this, anyone can
       * hold an account under somebody else's email — and the reset link, the
       * one route back into an account, goes to an inbox they do not own.
       */
      requireEmailVerification: true,
      /* A new password ends every session opened with the old one. */
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(user.email, resetPasswordEmail(url));
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      /* The reader clicked the link; asking them to sign in again is theatre. */
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(user.email, verifyEmail(url));
      },
    },

    /*
     * Google only where credentials exist. A provider configured with an empty
     * string is worse than an absent one: the button renders, and the reader
     * finds out at Google's error page.
     */
    socialProviders: isGoogleConfigured()
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
          },
        }
      : {},

    session: {
      expiresIn: SESSION_MAX_AGE_S,
      updateAge: SESSION_REFRESH_S,
      /*
       * A signed copy of the session in the cookie, good for five minutes.
       * Without it every page load costs a database round trip to answer a
       * question the cookie already knows the answer to.
       */
      cookieCache: { enabled: true, maxAge: SESSION_COOKIE_CACHE_S },
    },

    account: {
      accountLinking: {
        /*
         * Signing up with a password and later using Google — same verified
         * address — lands on one account rather than two. Google is trusted to
         * have verified the address it reports; nothing else is.
         */
        enabled: true,
        trustedProviders: ['google'],
      },
    },

    rateLimit: {
      enabled: true,
      /*
       * In the database, not in memory. Each serverless invocation has its own
       * memory, so an in-process counter starts at zero often enough to be no
       * limit at all.
       */
      storage: 'database',
      window: AUTH_RATE_LIMIT.window,
      max: AUTH_RATE_LIMIT.max,
      customRules: {
        '/sign-in/email': AUTH_RATE_LIMIT.signIn,
        '/sign-up/email': AUTH_RATE_LIMIT.signUp,
        '/request-password-reset': AUTH_RATE_LIMIT.forgotPassword,
        '/send-verification-email': AUTH_RATE_LIMIT.forgotPassword,
      },
    },

    trustedOrigins: [baseURL],

    /*
     * Must stay last: it reads the response Better Auth built and copies the
     * cookies onto Next's own store, which is the only way a server action can
     * set one.
     */
    plugins: [nextCookies()],
  });
};

export type Auth = ReturnType<typeof createAuth>;

let cached: Auth | null = null;

export const auth = (): Auth => (cached ??= createAuth());

/** Where Better Auth's endpoints are mounted. */
export const AUTH_BASE_PATH = AUTH_ROUTES.api;
