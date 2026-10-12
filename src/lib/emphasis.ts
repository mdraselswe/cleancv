/**
 * Inline formatting inside body text, as plain-string markers.
 *
 *   **bold**   _italic_   ~~underline~~   [label](https://example.com)
 *
 * Underline is `~~` because `__` cannot be told apart from italic nested inside
 * bold (`**_x_**` beside `__x__`), and `++` would swallow a CV's "C++, Java, C++".
 *
 * The text stays a flat string — the schema, the JSON export and every rule
 * that reasons about words are unchanged (ADR-010) — and this is the one place
 * that knows the grammar. The editor reads and writes through it, the
 * templates render through it, and the score strips through it, so the three
 * can never disagree about what a marker means.
 *
 * Deliberately forgiving: a marker with no partner on its line is ordinary
 * text, and nothing here throws on any input. A link only exists for an
 * `http(s)` or `mailto:` address, so a stored string can never render a
 * `javascript:` URL.
 */

export interface EmphasisSpan {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  /** Present on a run that is part of a link. */
  href?: string;
}

const WORD = /[\p{L}\p{N}]/u;
const SPACE = /\s/;

const isWordChar = (char: string | undefined): boolean => char !== undefined && WORD.test(char);
const isSpace = (char: string | undefined): boolean => char === undefined || SPACE.test(char);

/** `[label](url)` at a position; the label may carry the other markers. */
const LINK = /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/y;

/** Whether an address is one this grammar will ever turn into a link. */
export const isSafeHref = (value: string): boolean => /^(https?:\/\/|mailto:)\S+$/i.test(value);

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
    // A doubled underscore is plain text, not an italic marker.
    if (value[j + 1] === '_' || value[j - 1] === '_') return -1;

    const valid = j > from + 1 && !isSpace(value[j - 1]) && !isWordChar(value[j + 1]);

    return valid ? j : -1;
  }

  return -1;
};

/** True where a doubled marker at `at` opens a run that closes later on the same line. */
const opensPair = (value: string, at: number, marker: string): boolean => {
  const close = value.indexOf(marker, at + 2);
  if (close === -1 || close === at + 2) return false;

  const body = value.slice(at + 2, close);

  if (body.includes('\n')) return false;
  if (marker === '**') return !body.includes('*');

  // Underline: the same word-edge rules as italic, so `a~~b~~c` is left alone.
  return !isSpace(body[0]) && !isSpace(body[body.length - 1]) && !isWordChar(value[close + 2]);
};

interface Inherited {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  href?: string;
}

const NONE: Inherited = { bold: false, italic: false, underline: false };

const parseWith = (value: string, base: Inherited): EmphasisSpan[] => {
  const spans: EmphasisSpan[] = [];
  let bold = false;
  let italic = false;
  let underline = false;
  let buffer = '';

  const style = (): EmphasisSpan => ({
    text: '',
    bold: base.bold || bold,
    italic: base.italic || italic,
    underline: base.underline || underline,
    ...(base.href ? { href: base.href } : {}),
  });

  const flush = () => {
    if (buffer) spans.push({ ...style(), text: buffer });
    buffer = '';
  };

  for (let i = 0; i < value.length; ) {
    if (value[i] === '[' && !base.href) {
      LINK.lastIndex = i;
      const match = LINK.exec(value);

      if (match) {
        flush();
        spans.push(
          ...parseWith(match[1], {
            bold: base.bold || bold,
            italic: base.italic || italic,
            underline: base.underline || underline,
            href: match[2],
          }),
        );
        i += match[0].length;
        continue;
      }
    }

    if (value.startsWith('**', i)) {
      if (bold) {
        flush();
        bold = false;
        i += 2;
        continue;
      }

      if (opensPair(value, i, '**')) {
        flush();
        bold = true;
        i += 2;
        continue;
      }
    }

    if (value.startsWith('~~', i)) {
      if (underline) {
        flush();
        underline = false;
        i += 2;
        continue;
      }

      if (!isWordChar(value[i - 1]) && opensPair(value, i, '~~')) {
        flush();
        underline = true;
        i += 2;
        continue;
      }

      // An unpaired `~~` stays text.
      buffer += '~~';
      i += 2;
      continue;
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

export const parseEmphasis = (value: string): EmphasisSpan[] => parseWith(value, NONE);

/**
 * The text with every marker removed, a link reduced to its label.
 *
 * Emphasis is presentation: everything that reasons about the *content* of a
 * resume — word counts, keyword matching, weak-phrase checks — must not see it.
 */
export const stripEmphasis = (value: string): string => {
  if (!/[*_[]/.test(value)) return value;

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

const sameStyle = (a: EmphasisSpan, b: EmphasisSpan): boolean =>
  a.bold === b.bold && a.italic === b.italic && a.underline === b.underline && a.href === b.href;

const styled = (span: EmphasisSpan): string => {
  let text = span.text;

  if (span.italic) text = wrap(text, '_');
  if (span.underline) text = wrap(text, '~~');
  if (span.bold) text = wrap(text, '**');

  return text;
};

/** Inverse of `parseEmphasis`: adjacent spans of one style are merged first. */
export const serializeEmphasis = (spans: readonly EmphasisSpan[]): string => {
  const merged: EmphasisSpan[] = [];

  for (const span of spans) {
    if (span.text === '') continue;

    const last = merged[merged.length - 1];

    if (last && sameStyle(last, span)) last.text += span.text;
    else merged.push({ ...span });
  }

  // A link is serialised as one run of its neighbours that share the address,
  // with the styling inside the label — `[**Docs**](https://…)`.
  let out = '';

  for (let i = 0; i < merged.length; ) {
    const { href } = merged[i];

    if (!href) {
      out += styled(merged[i]);
      i += 1;
      continue;
    }

    let label = '';
    while (i < merged.length && merged[i].href === href) {
      label += styled({ ...merged[i], href: undefined });
      i += 1;
    }

    const parts = /^(\s*)([\s\S]*?)(\s*)$/.exec(label);

    out += parts && parts[2] ? `${parts[1]}[${parts[2]}](${href})${parts[3]}` : label;
  }

  return out;
};
