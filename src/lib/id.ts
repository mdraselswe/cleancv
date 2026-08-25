/** Stable ids for list entries. */

const FALLBACK_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Prefers `crypto.randomUUID` and degrades gracefully: this runs during SSR,
 * in the browser, and inside vitest's node environment.
 */
export const createId = (prefix = 'e'): string => {
  const globalCrypto = globalThis.crypto;

  if (globalCrypto?.randomUUID) {
    return `${prefix}_${globalCrypto.randomUUID().slice(0, 8)}`;
  }

  let suffix = '';
  for (let i = 0; i < 8; i += 1) {
    suffix += FALLBACK_ALPHABET[Math.floor(Math.random() * FALLBACK_ALPHABET.length)];
  }

  return `${prefix}_${suffix}`;
};
