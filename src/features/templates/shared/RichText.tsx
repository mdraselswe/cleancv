import { Fragment } from 'react';

import { parseEmphasis, stripEmphasis } from '@/lib/emphasis';

/**
 * Inline formatting inside body text: `**bold**`, `_italic_`, `~~underline~~`
 * and `[label](https://…)`.
 *
 * The reference document bolds the metric in every bullet — "achieving a **40%
 * improvement**" — and that is most of what makes a dense CV scannable. Storing
 * it as markers in the plain string rather than as structured rich text keeps
 * the data model flat, keeps JSON export readable, and keeps the extracted text
 * identical apart from the markers themselves. The grammar is `lib/emphasis`,
 * shared with the editor and the score.
 *
 * There is a real cost, and it is worth stating plainly: Chrome emits a
 * separate PDF text run for each styled span, so a parser that concatenates runs
 * without inserting whitespace reads "using**Next.js**and" as "usingNext.jsand".
 * The reference document has exactly this defect. Splitting on whole words —
 * never mid-word — keeps the damage to a missing space rather than a mangled
 * term, and the release gate asserts the bullet text still extracts intact.
 *
 * A link prints as its label. The address after it is part of the markup but
 * hidden by default; the ATS design un-hides it (`.atp .rz-link__url`), because
 * a plain-text parser sees only what is drawn and an address it cannot read is
 * an address it cannot follow.
 */

export interface RichTextProps {
  value: string;
}

export const RichText = ({ value }: RichTextProps) => {
  if (!/[*_[~]/.test(value)) return <>{value}</>;

  return (
    <>
      {parseEmphasis(value).map((span, index) => {
        let node = <>{span.text}</>;

        if (span.italic) node = <em className="rz-em">{node}</em>;
        if (span.underline) node = <u className="rz-u">{node}</u>;
        if (span.bold) node = <strong className="rz-strong">{node}</strong>;

        if (span.href) {
          const showsAddress = span.text.trim() !== span.href.replace(/^mailto:/i, '');

          node = (
            <a href={span.href} className="rz-link" target="_blank" rel="noopener noreferrer">
              {node}
              {showsAddress ? (
                <span className="rz-link__url">{` (${span.href.replace(/^mailto:/i, '')})`}</span>
              ) : null}
            </a>
          );
        }

        return <Fragment key={index}>{node}</Fragment>;
      })}
    </>
  );
};

export { stripEmphasis };
