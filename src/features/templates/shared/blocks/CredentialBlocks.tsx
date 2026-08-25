import { LANGUAGE_LEVEL_LABEL } from '@/constants';
import type { Resume } from '@/features/resume';
import { formatDateRange, formatMonth, formatMonthShort } from '@/lib/date';
import { isBlank, joinNonEmpty } from '@/lib/text';
import { ensureProtocol } from '@/lib/url';

import { Bullets } from '../Bits';
import { CategoryIcon } from '../CategoryIcon';
import { RichText } from '../RichText';
import { EntryShell } from './EntryShell';
import type { BlockProps } from './HistoryBlocks';

/** Sections that are lists of short, mostly one-line credentials. */

export interface CertificationsBlockProps extends BlockProps {
  /** Prints the credential link as the word "Link" rather than as the address. */
  compactLinks?: boolean;
  inlineOrganization?: boolean;
}

export const CertificationsBlock = ({
  resume,
  entryIcon,
  compactLinks,
  inlineOrganization,
}: CertificationsBlockProps) => (
  /*
   * Wrapped, unlike the other entry lists, because Classic Double Column runs
   * credentials two-up. Laying that out on the section itself made the section
   * a grid, and a grid does not collapse margins: the heading's own bottom
   * margin, the grid's row gap and the entry's top margin all stacked, so the
   * gap under this one heading was three spacings where every other section
   * showed one. The group takes the grid; the section stays a block. ADR-026.
   */
  <div className="rz-entry-list">
    {resume.certifications.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.name}
        organization={entry.issuer}
        dates={entry.issued ? `Issued ${formatMonthShort(entry.issued)}` : ''}
        place={entry.expires ? `Expires ${formatMonthShort(entry.expires)}` : ''}
        note={entry.credentialId ? `Credential ID: ${entry.credentialId}` : ''}
        inlineOrganization={inlineOrganization}
      >
        {/* A credential nobody can check is worth less than one they can. */}
        {isBlank(entry.url) ? null : (
          <div className="rz-entry__links">
            <p>
              {compactLinks ? (
                <a href={ensureProtocol(entry.url)}>Link</a>
              ) : (
                <>
                  Credential: <a href={ensureProtocol(entry.url)}>{ensureProtocol(entry.url)}</a>
                </>
              )}
            </p>
          </div>
        )}
      </EntryShell>
    ))}
  </div>
);

export interface AchievementsBlockProps extends BlockProps {
  showIcons?: boolean;
}

export const AchievementsBlock = ({ resume, showIcons }: AchievementsBlockProps) => (
  <div className="rz-grid-2">
    {resume.achievements.map((entry) => (
      <div key={entry.id} className="rz-entry rz-avoid-break">
        {entry.title ? (
          <h3 className="rz-entry__title">
            {showIcons ? (
              <CategoryIcon label={entry.title} icon={entry.icon} fallback="trophy" />
            ) : null}
            {entry.title}
          </h3>
        ) : null}
        {entry.description ? (
          <p className="rz-entry__body">
            <RichText value={entry.description} />
          </p>
        ) : null}
      </div>
    ))}
  </div>
);

export const AwardsBlock = ({ resume, entryIcon }: BlockProps) => (
  <>
    {resume.awards.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.title}
        organization={entry.issuer}
        dates={formatMonth(entry.date)}
        note={entry.description}
      />
    ))}
  </>
);

export const TrainingBlock = ({ resume, entryIcon }: BlockProps) => (
  <>
    {resume.training.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.name}
        organization={entry.provider}
        dates={formatMonth(entry.date)}
        place={entry.location}
        note={entry.description}
      />
    ))}
  </>
);

export const PublicationsBlock = ({ resume, entryIcon }: BlockProps) => (
  <>
    {resume.publications.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.title}
        organization={joinNonEmpty([entry.publisher, entry.authors], ' — ')}
        dates={formatMonth(entry.date)}
        note={joinNonEmpty([entry.description, entry.url], ' ')}
      />
    ))}
  </>
);

export const ConferencesBlock = ({ resume, entryIcon }: BlockProps) => (
  <>
    {resume.conferences.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.title}
        organization={joinNonEmpty([entry.event, entry.role], ' — ')}
        dates={formatMonth(entry.date)}
        place={entry.location}
        note={entry.description}
      />
    ))}
  </>
);

export const PatentsBlock = ({ resume, entryIcon }: BlockProps) => (
  <>
    {resume.patents.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.title}
        organization={joinNonEmpty([entry.office, entry.status], ' — ')}
        dates={formatMonth(entry.date)}
        place={entry.number}
        note={entry.description}
      />
    ))}
  </>
);

export const MembershipsBlock = ({ resume, entryIcon }: BlockProps) => (
  <>
    {resume.memberships.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.organization}
        organization={entry.role}
        dates={formatDateRange(entry.dates)}
      />
    ))}
  </>
);

export const VolunteeringBlock = ({ resume, entryIcon }: BlockProps) => (
  <>
    {resume.volunteering.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.role}
        organization={entry.organization}
        dates={formatDateRange(entry.dates)}
        place={entry.location}
      >
        <Bullets items={entry.bullets} />
      </EntryShell>
    ))}
  </>
);

export const ExtracurricularBlock = ({ resume, entryIcon }: BlockProps) => (
  <>
    {resume.extracurricular.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.activity}
        organization={joinNonEmpty([entry.organization, entry.role], ' — ')}
        dates={formatDateRange(entry.dates)}
        note={entry.description}
      />
    ))}
  </>
);

export const LanguagesBlock = ({ resume }: { resume: Resume }) => (
  <p className="rz-inline-list">
    {resume.languages
      .map((entry) =>
        joinNonEmpty(
          [entry.name, entry.level ? LANGUAGE_LEVEL_LABEL[entry.level] : '', entry.note],
          ' — ',
        ),
      )
      .filter(Boolean)
      .join('; ')}
  </p>
);
