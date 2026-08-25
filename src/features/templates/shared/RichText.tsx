import { Fragment } from 'react';

import { stripEmphasis } from '@/lib/text';

/**
 * Emphasis inside body text, written as `**bold**`.
 *
 * The reference document bolds the metric in every bullet — "achieving a **40%
 * improvement**" — and that is most of what makes a dense CV scannable. Storing
 * it as markers in the plain string rather than as structured rich text keeps
 * the data model flat, keeps JSON export readable, and keeps the extracted text
 * identical apart from the markers themselves.
 *
 * There is a real cost, and it is worth stating plainly: Chrome emits a
 * separate PDF text run for each bold span, so a parser that concatenates runs
 * without inserting whitespace reads "using**Next.js**and" as "usingNext.jsand".
 * The reference document has exactly this defect. Splitting on whole words —
 * never mid-word — keeps the damage to a missing space rather than a mangled
 * term, and the release gate asserts the bullet text still extracts intact.
 */

/** `**` pairs, non-greedy, never spanning a line. */
const BOLD_PATTERN = /\*\*([^*\n]+)\*\*/g;

export interface RichTextProps {
  value: string;
}

export const RichText = ({ value }: RichTextProps) => {
  if (!value.includes('**')) return <>{value}</>;

  const parts: Array<{ text: string; bold: boolean }> = [];
  let cursor = 0;

  for (const match of value.matchAll(BOLD_PATTERN)) {
    const at = match.index ?? 0;
    if (at > cursor) parts.push({ text: value.slice(cursor, at), bold: false });
    parts.push({ text: match[1], bold: true });
    cursor = at + match[0].length;
  }

  if (cursor < value.length) parts.push({ text: value.slice(cursor), bold: false });

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.bold ? <strong className="rz-strong">{part.text}</strong> : part.text}
        </Fragment>
      ))}
    </>
  );
};

export { stripEmphasis };
