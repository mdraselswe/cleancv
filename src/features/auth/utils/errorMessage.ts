import { AUTH_ROUTES } from '@/constants';

/**
 * Better Auth's error codes, in sentences a reader can act on.
 *
 * The library's own strings are accurate and unhelpful — "Invalid token" is
 * true of a link that expired, a link already used, and a link someone
 * mistyped, and none of those readers learns what to do next from it.
 *
 * Anything unmapped falls through to the server's own message rather than to a
 * generic apology: an unrecognised code is usually a real fault, and hiding it
 * behind "something went wrong" costs the one clue in the report.
 */

export interface AuthError {
  code?: string;
  message?: string;
  status?: number;
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'That email and password do not match an account.',
  USER_NOT_FOUND: 'That email and password do not match an account.',
  CREDENTIAL_ACCOUNT_NOT_FOUND:
    'This account was created with Google. Continue with Google to sign in.',
  EMAIL_NOT_VERIFIED: 'Confirm your email address first — check your inbox for the link.',
  USER_ALREADY_EXISTS: 'An account already exists for that email.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account already exists for that email.',
  PASSWORD_TOO_SHORT: 'That password is too short.',
  PASSWORD_TOO_LONG: 'That password is too long.',
  INVALID_TOKEN: `That link is no longer valid. Ask for a new one from ${AUTH_ROUTES.forgotPassword}.`,
  TOKEN_EXPIRED: 'That link has expired. Ask for a new one.',
  EMAIL_ALREADY_VERIFIED: 'That email is already confirmed. You can sign in.',
  SESSION_EXPIRED: 'You were signed out. Sign in again to continue.',
};

/** Rate limiting answers with a status, not a code. */
const TOO_MANY_REQUESTS = 429;

export const authErrorMessage = (error: AuthError | null | undefined): string => {
  if (!error) return '';

  if (error.status === TOO_MANY_REQUESTS) {
    return 'Too many attempts. Wait a minute and try again.';
  }

  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];

  return error.message || 'Something went wrong. Try again.';
};

/** Whether the reader is blocked on confirming their address, and can be offered a fresh link. */
export const isUnverifiedEmail = (error: AuthError | null | undefined): boolean =>
  error?.code === 'EMAIL_NOT_VERIFIED';
