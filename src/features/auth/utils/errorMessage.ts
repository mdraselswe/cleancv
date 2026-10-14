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
  INVALID_EMAIL_OR_PASSWORD: 'এই ইমেইল ও পাসওয়ার্ডে কোনো অ্যাকাউন্ট মেলেনি।',
  USER_NOT_FOUND: 'এই ইমেইল ও পাসওয়ার্ডে কোনো অ্যাকাউন্ট মেলেনি।',
  CREDENTIAL_ACCOUNT_NOT_FOUND:
    'এই অ্যাকাউন্টটি Google দিয়ে খোলা হয়েছে। সাইন-ইন করতে Google দিয়ে চালিয়ে যান।',
  EMAIL_NOT_VERIFIED: 'আগে আপনার ইমেইল ঠিকানা নিশ্চিত করুন — ইনবক্সে লিংকটি দেখুন।',
  USER_ALREADY_EXISTS: 'এই ইমেইলে আগে থেকেই একটি অ্যাকাউন্ট আছে।',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'এই ইমেইলে আগে থেকেই একটি অ্যাকাউন্ট আছে।',
  PASSWORD_TOO_SHORT: 'পাসওয়ার্ডটি খুব ছোট।',
  PASSWORD_TOO_LONG: 'পাসওয়ার্ডটি খুব লম্বা।',
  INVALID_TOKEN: `ওই লিংকটি আর বৈধ নেই। ${AUTH_ROUTES.forgotPassword} থেকে নতুন একটি চান।`,
  TOKEN_EXPIRED: 'ওই লিংকের মেয়াদ শেষ হয়েছে। নতুন একটি চান।',
  EMAIL_ALREADY_VERIFIED: 'ওই ইমেইল আগেই নিশ্চিত করা হয়েছে। আপনি সাইন-ইন করতে পারেন।',
  SESSION_EXPIRED: 'আপনি সাইন-আউট হয়ে গেছেন। চালিয়ে যেতে আবার সাইন-ইন করুন।',
};

/** Rate limiting answers with a status, not a code. */
const TOO_MANY_REQUESTS = 429;

export const authErrorMessage = (error: AuthError | null | undefined): string => {
  if (!error) return '';

  if (error.status === TOO_MANY_REQUESTS) {
    return 'অনেকবার চেষ্টা হয়েছে। এক মিনিট অপেক্ষা করে আবার চেষ্টা করুন।';
  }

  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];

  return error.message || 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
};

/** Whether the reader is blocked on confirming their address, and can be offered a fresh link. */
export const isUnverifiedEmail = (error: AuthError | null | undefined): boolean =>
  error?.code === 'EMAIL_NOT_VERIFIED';
