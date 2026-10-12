import type { ReactNode } from 'react';

import type { PickableIcon } from '@/constants';
import { isBlank } from '@/lib/text';

import { CategoryIcon } from '../CategoryIcon';
import { CalendarIcon, PinIcon } from '../Icons';
import { RichText } from '../RichText';

/**
 * The one entry shape every section and every template uses.
 *
 * The DOM order is fixed — title, organisation, meta, note, body — because that
 * order is what a parser extracts. Templates change the *visual* arrangement
 * with CSS (the classic design absolutely positions `.rz-entry__meta` into a
 * left rail) and never by reordering markup. See ADR-004.
 */
export interface EntryShellProps {
  title?: string;
  /** Company, institution, publisher, issuing body. */
  organization?: string;
  /**
   * When the entry happened. Rendered into the rail by CSS, on its own line
   * above `place` — the reference layout sets the dates in bold and the
   * location beneath them in grey, and one joined string cannot do that.
   */
  dates?: string;
  /** Where it happened, plus anything else qualifying the dates. */
  place?: string;
  /** One line of context under the organisation. */
  note?: string;
  /** Right-aligned counterpart to the title, e.g. a result or a credential id. */
  trailing?: ReactNode;
  /**
   * Sets the organisation on the title's own line, as "Role, Employer".
   *
   * Opt-in per template rather than a CSS trick: the separator has to be a real
   * text node or the extracted line reads "Software QA EngineerShikho".
   */
  inlineOrganization?: boolean;
  /**
   * Puts the organisation above the title.
   *
   * A markup change, not a CSS one. Some designs genuinely lead with the
   * employer — the eye is meant to land on it first — and that is a different
   * reading order, not the same order shown differently. Reordering it in CSS
   * would leave the extracted text disagreeing with the page. See ADR-004.
   */
  organizationFirst?: boolean;
  /** Sets the place above the dates, for designs that lead the margin with it. */
  placeBeforeDates?: boolean;
  /**
   * Marks the dates and the place with a glyph.
   *
   * Inline SVG, so the extracted line is unchanged — an icon font here would
   * put a Private Use Area codepoint immediately before every date.
   */
  metaIcons?: boolean;
  /**
   * Marker drawn in front of the entry, so three roles under one heading read as
   * three things rather than one block of text. One glyph per section, chosen by
   * `SECTION_ENTRY_ICON`; omitted when the design draws no icons or the user has
   * turned this section's off. See ADR-022.
   */
  icon?: PickableIcon;
  children?: ReactNode;
}

export const EntryShell = ({
  title,
  organization,
  dates,
  place,
  note,
  trailing,
  inlineOrganization,
  organizationFirst,
  placeBeforeDates,
  metaIcons,
  icon,
  children,
}: EntryShellProps) => (
  <article className={icon ? 'rz-entry rz-entry--marked' : 'rz-entry'}>
    {organizationFirst && !isBlank(organization) ? (
      <p className="rz-entry__org">
        {icon ? <CategoryIcon label="" icon={icon} fallback={icon} /> : null}
        {organization}
      </p>
    ) : null}

    {!isBlank(title) || trailing ? (
      <div className="rz-entry__head">
        {!isBlank(title) ? (
          <h3 className="rz-entry__title">
            {icon && !organizationFirst ? (
              <CategoryIcon label="" icon={icon} fallback={icon} />
            ) : null}
            {title}
          </h3>
        ) : null}
        {inlineOrganization && !isBlank(organization) ? (
          <>
            {!isBlank(title) ? <span className="rz-entry__sep">, </span> : null}
            <span className="rz-entry__org">{organization}</span>
          </>
        ) : null}
        {/* A real space: adjacent inline runs otherwise extract fused together. */}
        {trailing ? (
          <>
            {' '}
            <span className="rz-entry__trailing">{trailing}</span>
          </>
        ) : null}
      </div>
    ) : null}

    {!inlineOrganization && !organizationFirst && !isBlank(organization) ? (
      <p className="rz-entry__org">{organization}</p>
    ) : null}
    {/*
      Both halves live in one paragraph so the extracted text keeps "dates,
      place" together on a single line, whatever a template does with them
      visually.
    */}
    {!isBlank(dates) || !isBlank(place) ? (
      <p className="rz-entry__meta">
        {(placeBeforeDates ? ['place', 'dates'] : ['dates', 'place']).map((part, index) => {
          const value = part === 'dates' ? dates : place;
          if (isBlank(value)) return null;

          return (
            <span key={part} className={`rz-entry__${part}`}>
              {index > 0 ? ' ' : null}
              {metaIcons ? part === 'dates' ? <CalendarIcon /> : <PinIcon /> : null}
              {value}
            </span>
          );
        })}
      </p>
    ) : null}
    {!isBlank(note) ? (
      <p className="rz-entry__note rz-muted">
        <RichText value={note ?? ''} />
      </p>
    ) : null}

    {children ? <div className="rz-entry__body">{children}</div> : null}
  </article>
);
