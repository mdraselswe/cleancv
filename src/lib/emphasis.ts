/**
 * Inline emphasis inside body text, as plain-string markers.
 *
 *   **bold**     _italic_     **_both_**
 *
 * The text stays a flat string — the schema, the JSON export and every rule
 * that reasons about words are unchanged (ADR-010) — and this is the one place
 * that knows the grammar. The editor reads and writes through it, the
 * templates render through it, and the score strips through it, so the three
 * can never disagree about what a marker means.
 *
 * Deliberately forgiving: a marker with no partner on its line is ordinary
 * text, and nothing here throws on any input.
 */

export interface EmphasisSpan {
  text: string;
  bold: boolean;
  italic: boolean;
}

const WORD = /[\p{L}\p{N}]/u;
const SPACE = /\s/;

const isWordChar = (char: string | undefined): boolean => char !== undefined && WORD.test(char);
const isSpace = (char: string | undefined): boolean => char === undefined || SPACE.test(char);

/**
 * The index of the `_` that would close an italic opened at `from`, or -1.
 *
 * Intra-word underscores (`snake_case`, `my_file_name`) never open or close:
 * an opener must not follow a letter, a closer must not precede one, and
 * neither may touch whitespace. That is what keeps a URL or an identifier from
 * turning italic by accident.
 */
const findItalicClose = (value: string, from: number): number => {
  for (let j = from + 1; j < value.length; j += 1) {
    if (value[j] === '\n') return -1;
    if (value[j] !== '_') continue;

    const valid = j > from + 1 && !isSpace(value[j - 1]) && !isWordChar(value[j + 1]);

    return valid ? j : -1;
  }

  return -1;
};

/** True where a `**` at `at` opens a bold run that closes later on the same line. */
const opensBold = (value: string, at: number): boolean => {
  const close = value.indexOf('**', at + 2);
  if (close === -1 || close === at + 2) return false;

  const body = value.slice(at + 2, close);

  return !body.includes('\n') && !body.includes('*');
};

export const parseEmphasis = (value: string): EmphasisSpan[] => {
  const spans: EmphasisSpan[] = [];
  let bold = false;
  let italic = false;
  let buffer = '';

  const flush = () => {
    if (buffer) spans.push({ text: buffer, bold, italic });
    buffer = '';
  };

  for (let i = 0; i < value.length; ) {
    if (value.startsWith('**', i)) {
      if (bold) {
        flush();
        bold = false;
        i += 2;
        continue;
      }

      if (opensBold(value, i)) {
        flush();
        bold = true;
        i += 2;
        continue;
      }
    }

    if (value[i] === '_') {
      if (italic) {
        // The opener already proved this is the matching close.
        flush();
        italic = false;
        i += 1;
        continue;
      }

      const opens =
        !isWordChar(value[i - 1]) &&
        !isSpace(value[i + 1]) &&
        value[i + 1] !== '_' &&
        findItalicClose(value, i) !== -1;

      if (opens) {
        flush();
        italic = true;
        i += 1;
        continue;
      }
    }

    buffer += value[i];
    i += 1;
  }

  flush();

  return spans;
};

/**
 * The text with every marker removed.
 *
 * Emphasis is presentation: everything that reasons about the *content* of a
 * resume — word counts, keyword matching, weak-phrase checks — must not see it.
 */
export const stripEmphasis = (value: string): string => {
  if (!value.includes('**') && !value.includes('_')) return value;

  return parseEmphasis(value)
    .map((span) => span.text)
    .join('');
};

/** Wraps `text` in `marker`, keeping edge whitespace outside it so the pair stays valid. */
const wrap = (text: string, marker: string): string => {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!match || match[2] === '') return text;

  return `${match[1]}${marker}${match[2]}${marker}${match[3]}`;
};

/** Inverse of `parseEmphasis`: adjacent spans of one style are merged first. */
export const serializeEmphasis = (spans: readonly EmphasisSpan[]): string => {
  const merged: EmphasisSpan[] = [];

  for (const span of spans) {
    if (span.text === '') continue;

    const last = merged[merged.length - 1];

    if (last && last.bold === span.bold && last.italic === span.italic) last.text += span.text;
    else merged.push({ ...span });
  }

  return merged
    .map((span) => {
      let text = span.text;

      if (span.italic) text = wrap(text, '_');
      if (span.bold) text = wrap(text, '**');

      return text;
    })
    .join('');
};
