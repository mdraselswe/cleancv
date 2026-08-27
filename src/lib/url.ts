/** Link normalising. Templates print the readable form and link the full one. */

/** Schemes that execute instead of navigating; see the note in schema/primitives. */
const DANGEROUS_SCHEME = /^\s*(javascript|data|vbscript|file|blob):/i;

/**
 * Normalises a user-entered link to something safe to put in an href.
 * An executable scheme is not "fixed up" — it is dropped.
 */
export const ensureProtocol = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || DANGEROUS_SCHEME.test(trimmed)) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
};

/**
 * `https://www.linkedin.com/in/someone/` -> `linkedin.com/in/someone`.
 * A resume prints the destination, not the protocol boilerplate.
 */
export const displayUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  return trimmed
    .replace(/^(https?:)?\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
};

export const telHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const mailtoHref = (email: string): string => `mailto:${email.trim()}`;

/** `/\` -- what a browser normalises into a protocol-relative `//`. */
const BACKSLASH_PATH = '/\\';

/**
 * The value of a `?next=` parameter, reduced to something safe to navigate to.
 *
 * Only an app-relative path survives. A sign-in page that redirects wherever a
 * query string tells it is an open redirect: the link reads as the real site,
 * the reader signs in, and the page they land on is someone else's. Two forms
 * cost the check — `//evil.example` is protocol-relative and `/\evil.example`
 * is what a browser normalises into it.
 */
export const safeRedirect = (value: string | null | undefined, fallback: string): string => {
  if (!value) return fallback;

  const trimmed = value.trim();

  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//') || trimmed.startsWith(BACKSLASH_PATH)) return fallback;
  if (DANGEROUS_SCHEME.test(trimmed)) return fallback;

  return trimmed;
};
