import {
  SECTION_HEADING_ALIASES,
  SECTION_KEYS,
  SECTION_META,
  type SectionKey,
} from '@/constants';

import type { TextLine } from './types';

/**
 * Finding the section headings in an extracted document.
 *
 * The vocabulary lives in `@/constants` because the ATS engine needs the same
 * list: what counts as a recognisable heading when reading someone else's CV
 * is exactly what counts as a safe rename when writing one.
 */



const normalise = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Every recognised spelling, longest first so "work experience" beats "experience". */
const VOCABULARY: Array<{ key: SectionKey; phrase: string }> = SECTION_KEYS.flatMap((key) => [
  { key, phrase: normalise(SECTION_META[key].canonicalHeading) },
  ...(SECTION_HEADING_ALIASES[key] ?? []).map((phrase) => ({ key, phrase })),
]).sort((a, b) => b.phrase.length - a.phrase.length);

/**
 * Whether a line reads as a heading rather than as content.
 *
 * Wording alone is not enough — "I have experience in React" would match — so a
 * line also has to look like a heading: short, and not a sentence.
 */
export const headingKeyOf = (line: TextLine, bodySize: number): SectionKey | null => {
  const text = line.text.trim();
  if (text.length > 45 || text.split(/\s+/).length > 5) return null;
  if (/[.;,]$/.test(text)) return null;

  const normalised = normalise(text);
  const match = VOCABULARY.find((entry) => entry.phrase === normalised);
  if (!match) return null;

  // A styled heading is bigger, bolder or upper-case. Something has to set it
  // apart, or a skills list entry called "Languages" becomes a section break.
  const looksStyled = line.size > bodySize * 1.05 || text === text.toUpperCase();

  return looksStyled ? match.key : null;
};

/** The most common glyph height, i.e. the size of ordinary body text. */
export const bodyTextSize = (lines: TextLine[]): number => {
  const counts = new Map<number, number>();

  for (const line of lines) {
    const size = Math.round(line.size);
    counts.set(size, (counts.get(size) ?? 0) + 1);
  }

  let best = 11;
  let seen = 0;

  for (const [size, count] of counts) {
    if (count > seen) {
      seen = count;
      best = size;
    }
  }

  return best;
};

export interface DocumentSection {
  key: SectionKey;
  heading: string;
  lines: TextLine[];
}

export interface SplitDocument {
  /** Everything above the first heading: name, headline and contact details. */
  header: TextLine[];
  sections: DocumentSection[];
}

export const splitIntoSections = (lines: TextLine[]): SplitDocument => {
  const bodySize = bodyTextSize(lines);
  const header: TextLine[] = [];
  const sections: DocumentSection[] = [];

  for (const line of lines) {
    const key = headingKeyOf(line, bodySize);

    if (key) {
      sections.push({ key, heading: line.text.trim(), lines: [] });
      continue;
    }

    if (sections.length === 0) header.push(line);
    else sections.at(-1)?.lines.push(line);
  }

  return { header, sections };
};
