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
