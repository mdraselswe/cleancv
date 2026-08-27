import { REDIRECT_PARAM, ROUTES } from '@/constants';
import { safeRedirect } from '@/lib/url';

/** The shape Next hands a page for `?a=1&b=2`. */
export type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Where to send the reader after they sign in.
 *
 * Read in one place because every auth page needs it and each of them would
 * otherwise reach into the query string itself — and the one that forgot
 * `safeRedirect` would be an open redirect on the page most worth attacking.
 */
export const readRedirect = (params: SearchParams, fallback: string = ROUTES.editor): string => {
  const raw = params[REDIRECT_PARAM];

  return safeRedirect(typeof raw === 'string' ? raw : null, fallback);
};

/** A single query value, or an empty string. Repeated keys arrive as an array. */
export const readParam = (params: SearchParams, key: string): string => {
  const raw = params[key];

  return typeof raw === 'string' ? raw : '';
};
