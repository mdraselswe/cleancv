/** Auth routes, limits, and the copy that explains why a door is shut. */

/** Where the sign-in flow lives. Read by pages, links, redirects and middleware. */
export const AUTH_ROUTES = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  /** Better Auth mounts its whole API under one catch-all. */
  api: '/api/auth',
} as const;

/**
 * The query parameter carrying where to return to after signing in.
 *
 * Only ever an app-relative path — see `safeRedirect`. A full URL here is how
 * a sign-in page becomes an open redirect.
 */
export const REDIRECT_PARAM = 'next';

/** The reset link's token, and the verification link's. Named by Better Auth. */
export const TOKEN_PARAM = 'token';

/**
 * Better Auth's own minimum is 8. Raised here because a resume holds someone's
 * address, phone number and employment history, and the same password is
 * usually the one on their email.
 */
export const PASSWORD_MIN = 10;

/** Better Auth's ceiling. Above it the hash call is refused, not truncated. */
export const PASSWORD_MAX = 128;

export const NAME_MAX = 80;

/** How long a session lives without being used again. */
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30;

/** How often a live session's expiry is pushed forward. */
export const SESSION_REFRESH_S = 60 * 60 * 24;

/**
 * How long the browser may answer "who is signed in?" from its own cookie
 * before asking the server again. Keeps every page load off the database
 * without letting a revoked session linger for long.
 */
export const SESSION_COOKIE_CACHE_S = 60 * 5;

/** Requests per window, per IP, on the auth endpoints. */
export const AUTH_RATE_LIMIT = {
  window: 60,
  max: 30,
  /** Password attempts are the ones worth guessing at, so they get less room. */
  signIn: { window: 60, max: 8 },
  signUp: { window: 60 * 10, max: 5 },
  forgotPassword: { window: 60 * 10, max: 4 },
} as const;

/** The benefit described on the sign-in page. */
export const GATE_REASON = 'Sign in to keep your CVs synced across browsers and devices.';
