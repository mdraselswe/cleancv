/**
 * Field-level pattern matching.
 *
 * Everything here is deliberately conservative: a wrong guess costs the user
 * more than a missing one, because a blank field is obvious and a plausible
 * wrong value is not. When a pattern is unsure it returns nothing and lets the
 * reviewer type it.
 */

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

export const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;

/** Loose on purpose: international CVs write phone numbers every possible way. */
export const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/;

export const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s,;]+|[\w-]+\.(?:com|io|dev|net|org|me)\/[^\s,;]+/i;

const PRESENT = /\b(present|current|now|ongoing|to date|till date)\b/i;

/** `Jan 2020`, `01/2020`, `2020-01`, `2020`. Returns `YYYY-MM` or `YYYY`. */
const parseOneDate = (raw: string): string | null => {
  const value = raw.trim().toLowerCase();

  const named = /^([a-z]{3,9})\.?\s+(\d{4})$/.exec(value);
  if (named && MONTHS[named[1]]) {
    return `${named[2]}-${String(MONTHS[named[1]]).padStart(2, '0')}`;
  }

  const numeric = /^(\d{1,2})[/.-](\d{4})$/.exec(value);
  if (numeric && Number(numeric[1]) >= 1 && Number(numeric[1]) <= 12) {
    return `${numeric[2]}-${numeric[1].padStart(2, '0')}`;
  }

  const iso = /^(\d{4})[-/](\d{1,2})$/.exec(value);
  if (iso && Number(iso[2]) >= 1 && Number(iso[2]) <= 12) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}`;
  }

  const yearOnly = /^(19|20)\d{2}$/.exec(value);
  if (yearOnly) return value;

  return null;
};

export interface DateRangeMatch {
  start: string;
  end: string;
  current: boolean;
  /** The matched text, so the caller can strip it out of the surrounding line. */
  matched: string;
}

const RANGE_PATTERN = new RegExp(
  String.raw`([A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}[/.-]\d{4}|\d{4}[-/]\d{1,2}|(?:19|20)\d{2})` +
    String.raw`\s*(?:[-–—]|to|until|till)\s*` +
    String.raw`([A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}[/.-]\d{4}|\d{4}[-/]\d{1,2}|(?:19|20)\d{2}|present|current|now|ongoing|to date|till date)`,
  'i',
);

/** A `2020 – Present` style range anywhere in a line. */
export const findDateRange = (text: string): DateRangeMatch | null => {
  const match = RANGE_PATTERN.exec(text);
  if (!match) return null;

  const start = parseOneDate(match[1]);
  if (!start) return null;

  const current = PRESENT.test(match[2]);
  const end = current ? '' : (parseOneDate(match[2]) ?? '');

  // A year on its own is not a month; the editor's month picker would reject it.
  const asMonth = (value: string) => (/^\d{4}$/.test(value) ? '' : value);

  return { start: asMonth(start), end: asMonth(end), current, matched: match[0] };
};

/** Lines that begin with a bullet glyph, a dash, or a lone asterisk. */
export const isBulletLine = (text: string): boolean => /^[•▪◦‣·*–—-]\s+/.test(text);

export const stripBullet = (text: string): string =>
  text.replace(/^[•▪◦‣·*–—-]\s+/, '').trim();

/**
 * A person's name, or null.
 *
 * Two to four capitalised words with no digits and no email. Anything looser
 * starts claiming that "Senior Software Engineer" is a name.
 */
export const looksLikeName = (text: string): boolean => {
  const value = text.trim();
  if (value.length < 4 || value.length > 60) return false;
  if (/\d|@/.test(value)) return false;

  const words = value.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;

  const capitalised = words.filter((word) => /^[A-ZÀ-ɏ]/.test(word)).length;

  return capitalised >= words.length - 1;
};

/**
 * Un-shouts a name that was only upper-case because the template styled it so.
 *
 * PDF extraction returns rendered glyphs, so a design applying
 * `text-transform: uppercase` hands back `MUHAMMAD RASEL` — and importing that
 * verbatim leaves the new CV shouting. Applied to names only: a headline like
 * "Next.js" would not survive the same treatment.
 */
export const softenShoutedName = (value: string): string => {
  if (!/[A-Z]/.test(value) || /[a-z]/.test(value)) return value;

  return value.replace(/[\p{Lu}][\p{Lu}'’-]*/gu, (word) =>
    // Initials stay as they are; `O'BRIEN` and `AL-MAMUN` capitalise per part.
    word.length === 1
      ? word
      : word
          .toLowerCase()
          .replace(/(^|['’-])(\p{Ll})/gu, (_, separator: string, letter: string) =>
            `${separator}${letter.toUpperCase()}`,
          ),
  );
};

/** `React, Node.js, GraphQL` → the three items. Handles bullets and slashes too. */
export const splitList = (text: string): string[] =>
  text
    .split(/[,;|•·]|\s{2,}|\s+\/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 60);

/** `Frontend: React, Next.js` → `['Frontend', 'React, Next.js']`, or null. */
export const splitLabelled = (text: string): [string, string] | null => {
  const match = /^([^:]{2,40}):\s*(.+)$/.exec(text.trim());

  return match ? [match[1].trim(), match[2].trim()] : null;
};
