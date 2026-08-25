import { isBlank } from '@/lib/text';

import { RichText } from './RichText';

/** Small render primitives every template shares. */

export interface BulletsProps {
  items: readonly string[];
  className?: string;
}

/**
 * A real U+2022 in its own span — not `list-style`, not `::marker`. Generated
 * content is not reliably present in an extracted PDF text layer, and a bullet
 * that extracts as a replacement character breaks every line it precedes.
 */
export const Bullets = ({ items, className }: BulletsProps) => {
  const visible = items.filter((item) => !isBlank(item));
  if (visible.length === 0) return null;

  return (
    <ul className={`rz-bullet-list ${className ?? ''}`.trim()}>
      {visible.map((item, index) => (
        <li key={index} className="rz-bullet">
          <span className="rz-bullet__dot" aria-hidden="true">
            •
          </span>
          <span className="rz-bullet__text">
            <RichText value={item} />
          </span>
        </li>
      ))}
    </ul>
  );
};

export interface TagLineProps {
  label?: string;
  items: readonly string[];
  className?: string;
}

/** A trailing `Tech: A, B, C` line. Comma-separated so parsers read it as a list. */
export const TagLine = ({ label, items, className }: TagLineProps) => {
  const visible = items.filter((item) => !isBlank(item));
  if (visible.length === 0) return null;

  return (
    <p className={className}>
      {label ? <span className="rz-muted">{label}: </span> : null}
      {visible.join(', ')}
    </p>
  );
};
