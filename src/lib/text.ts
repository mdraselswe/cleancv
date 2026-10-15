/** Text measurement and tokenising, shared by the ATS rules and the editor counters. */

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}+#.'-]*/gu;

export const words = (value: string): string[] => value.match(WORD_PATTERN) ?? [];

export const wordCount = (value: string): number => words(value).length;

export const isBlank = (value: string | undefined | null): boolean =>
  !value || value.trim().length === 0;

export const firstWord = (value: string): string => words(value)[0]?.toLowerCase() ?? '';

/** Lowercased word set, used for keyword overlap. */
export const tokenSet = (value: string): Set<string> =>
  new Set(words(value).map((word) => word.toLowerCase()));

/**
 * Case-insensitive phrase search that respects word boundaries, so "worked on"
 * matches but "network on-call" does not trip the "work on" phrase.
 */
export const containsPhrase = (haystack: string, phrase: string): boolean => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
};

export const findPhrases = (haystack: string, phrases: readonly string[]): string[] =>
  phrases.filter((phrase) => containsPhrase(haystack, phrase));

export const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;

export const titleCase = (value: string): string =>
  value.replace(/\b\p{Ll}/gu, (char) => char.toUpperCase());

/** Joins the parts of a meta line, dropping blanks so no stray separators appear. */
export const joinNonEmpty = (parts: Array<string | undefined | null>, separator = ' • '): string =>
  parts.filter((part): part is string => !isBlank(part)).join(separator);

/**
 * Filesystem-safe stem for a downloaded file.
 *
 * Letters and digits of any script are kept - a name written in Bangla is still
 * a name - and everything a filesystem objects to is dropped.
 */
export const toFileStem = (value: string, fallback = 'resume'): string => {
  const stem = value
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

  return stem || fallback;
};

/**
 * Drops `**bold**` and `_italic_` markers, leaving the words. The grammar lives
 * in `lib/emphasis.ts`; this is re-exported because callers reach for it here.
 */
export { stripEmphasis } from './emphasis';
