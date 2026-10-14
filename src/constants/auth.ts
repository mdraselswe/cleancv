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

/**
 * What the PDF route says when nobody is signed in.
 *
 * A machine-readable code beside the sentence: the export hook opens the
 * sign-in dialog on the code, and shows the sentence if anything else fails.
 */
export const SIGN_IN_REQUIRED = {
  code: 'sign_in_required',
  message: 'PDF ডাউনলোড করতে সাইন-ইন করুন। বাকি সবকিছু সাইন-ইন ছাড়াই খোলা।',
} as const;

/**
 * Why the gate exists, in the words the dialog and the sign-in pages use, so
 * the two cannot drift into telling the reader different stories.
 */
export const GATE_REASON =
  'ডাউনলোডের জন্য একটি ফ্রি অ্যাকাউন্ট লাগে। লেখা, ডিজাইন আর ATS স্কোরের জন্য লাগে না।';
