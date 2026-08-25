import type { ExtractedDocument, SourceKind, TextLine } from '../types';

/**
 * Turning positioned lines into a document a parser can read.
 *
 * The order is the source's own. A PDF stores its text runs in the order the
 * page was built, which for any competently made CV *is* the reading order —
 * the same property this app's release gate asserts about its own output, and
 * the same property any parser depends on.
 *
 * An earlier version sorted lines by vertical position and tried to detect
 * columns. It was worse. On a sidebar design it destroyed an order that was
 * already correct, and the column test could not reliably tell a rail of its
 * own sections from the strip of dates most designed CVs set beside each job —
 * measured against six real templates, the two cases did not separate. So
 * geometry is kept for what it genuinely answers: which runs share a line, how
 * big the text is, and whether to warn. It is not used to second-guess the
 * document.
 */

/** A second cluster of line starts holding this much reads as two columns. */
const MIN_COLUMN_SHARE = 0.25;

const cleanLine = (line: TextLine): TextLine => ({
  ...line,
  text: line.text.replace(/\s+/g, ' ').trim(),
});

/**
 * Whether the page looks like it was laid out in two columns.
 *
 * Advisory only — nothing is reordered on the strength of it. It exists so the
 * review screen can say "check this carefully", because a two-column source is
 * where an import is most likely to have gone wrong.
 */
export const isTwoColumn = (lines: TextLine[]): boolean => {
  const page = lines.filter((line) => line.page === 1);
  if (page.length < 12) return false;

  const starts = page.map((line) => line.x);
  const left = Math.min(...starts);
  const right = Math.max(...starts);
  if (right - left <= 0) return false;

  // A genuine second column puts a substantial share of lines well to the right
  // of the body's left margin, rather than a handful of indented ones.
  const middle = left + (right - left) / 2;
  const share = page.filter((line) => line.x > middle).length / page.length;

  return share >= MIN_COLUMN_SHARE && share <= 1 - MIN_COLUMN_SHARE;
};

export const toDocument = (
  kind: SourceKind,
  rawLines: TextLine[],
  pageCount: number,
): ExtractedDocument => {
  const lines = rawLines.map(cleanLine).filter((line) => line.text.length > 0);

  return {
    kind,
    lines,
    text: lines.map((line) => line.text).join('\n'),
    pageCount,
    empty: lines.length === 0,
  };
};
