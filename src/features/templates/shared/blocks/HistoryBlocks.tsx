import {
  EMPLOYMENT_TYPE_LABEL,
  PROFICIENCY_FILL,
  PROFICIENCY_LABEL,
  type PickableIcon,
} from '@/constants';
import type { Resume } from '@/features/resume';
import { formatDateRange } from '@/lib/date';
import { isBlank, joinNonEmpty } from '@/lib/text';
import { ensureProtocol } from '@/lib/url';

import { Bullets, TagLine } from '../Bits';
import { CategoryIcon } from '../CategoryIcon';
import { EntryShell } from './EntryShell';

export interface BlockProps {
  resume: Resume;
  /**
   * Marker drawn in front of each entry of this section. Resolved once by
   * `SectionBody` from the template's icon support and the section's own
   * setting, so a block never decides for itself. See ADR-022.
   */
  entryIcon?: PickableIcon;
}

export interface HistoryBlockProps extends BlockProps {
  /** Sets the employer on the role's own line, as "Role, Employer". */
  inlineOrganization?: boolean;
  /** Leads the entry with the employer rather than the role. */
  organizationFirst?: boolean;
  /** Leads the margin with the place rather than the dates. */
  placeBeforeDates?: boolean;
  /** Marks the dates and the place with a glyph. */
  metaIcons?: boolean;
}

export const ExperienceBlock = ({
  resume,
  entryIcon,
  inlineOrganization,
  organizationFirst,
  placeBeforeDates,
  metaIcons,
}: HistoryBlockProps) => (
  <>
    {resume.experience.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.role}
        organization={entry.company}
        dates={formatDateRange(entry.dates)}
        place={joinNonEmpty([
          entry.location,
          entry.employmentType ? EMPLOYMENT_TYPE_LABEL[entry.employmentType] : '',
        ])}
        note={entry.companyNote}
        inlineOrganization={inlineOrganization}
        organizationFirst={organizationFirst}
        placeBeforeDates={placeBeforeDates}
        metaIcons={metaIcons}
      >
        <Bullets items={entry.bullets} />
        <TagLine label="Tech" items={entry.tech} className="rz-entry__tags" />
      </EntryShell>
    ))}
  </>
);

export const EducationBlock = ({
  resume,
  entryIcon,
  inlineOrganization,
  organizationFirst,
  placeBeforeDates,
  metaIcons,
}: HistoryBlockProps) => (
  <>
    {resume.education.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={joinNonEmpty([entry.degree, entry.major], ' — ')}
        organization={joinNonEmpty([entry.institute, entry.board], ', ')}
        dates={formatDateRange(entry.dates)}
        place={entry.location}
        trailing={joinNonEmpty([entry.result, entry.resultScale], ' / ')}
        note={entry.thesis ? `Thesis: ${entry.thesis}` : ''}
        inlineOrganization={inlineOrganization}
        organizationFirst={organizationFirst}
        placeBeforeDates={placeBeforeDates}
        metaIcons={metaIcons}
      >
        <TagLine label="Coursework" items={entry.coursework} className="rz-entry__tags" />
        <Bullets items={entry.bullets} />
      </EntryShell>
    ))}
  </>
);

export interface SkillsBlockProps extends BlockProps {
  /** Renders a proficiency meter after each group. Creative templates only. */
  showBars?: boolean;
  /** Puts a glyph beside each group name. Designs with an icon gutter only. */
  showIcons?: boolean;
  /** Sets the list on the group name's own line, as "Frontend: React, Next". */
  inlineItems?: boolean;
}

export const SkillsBlock = ({ resume, showBars, showIcons, inlineItems }: SkillsBlockProps) => (
  <div className="rz-skills">
    {resume.skills.map((group) => (
      <div key={group.id} className="rz-skills__group rz-avoid-break">
        {group.category ? (
          <p className="rz-skills__label">
            {showIcons ? (
              <CategoryIcon label={group.category} icon={group.icon} fallback="diamond" />
            ) : null}
            {group.category}
            {/* Without a meter the level has to be words, or it is not stated at all. */}
            {group.level && !showBars ? (
              <span className="rz-skills__level"> — {PROFICIENCY_LABEL[group.level]}</span>
            ) : null}
            {/* Real text, not generated content: a CSS colon never extracts. */}
            {inlineItems ? <span className="rz-skills__sep">: </span> : null}
          </p>
        ) : null}

        {/*
          Comma-separated in one text run: a parser reads this as a list, where a
          grid of chips would extract as an unpunctuated word salad.
        */}
        <p className="rz-skills__items">{group.items.join(', ')}</p>

        {showBars && group.level ? <SkillMeter level={group.level} /> : null}
      </div>
    ))}
  </div>
);

/**
 * Decorative only — it carries no text, so it costs nothing at extraction time,
 * and the level it depicts is also printed as words on templates without meters.
 */
const SkillMeter = ({ level }: { level: keyof typeof PROFICIENCY_FILL }) => (
  <span
    className="rz-skills__meter"
    role="img"
    aria-label={`${PROFICIENCY_LABEL[level]} proficiency`}
  >
    <span
      className="rz-skills__meter-fill"
      style={{ width: `${PROFICIENCY_FILL[level] * 100}%` }}
    />
  </span>
);

export interface ProjectsBlockProps extends HistoryBlockProps {
  /** Prints "Repository" rather than the address. See the note on ProjectLinks. */
  compactLinks?: boolean;
}

export const ProjectsBlock = ({
  resume,
  entryIcon,
  compactLinks,
  inlineOrganization,
  organizationFirst,
  placeBeforeDates,
  metaIcons,
}: ProjectsBlockProps) => (
  <>
    {resume.projects.map((entry) => (
      <EntryShell
        icon={entryIcon}
        key={entry.id}
        title={entry.name}
        organization={entry.subtitle}
        dates={formatDateRange(entry.dates)}
        place={entry.role}
        inlineOrganization={inlineOrganization}
        organizationFirst={organizationFirst}
        placeBeforeDates={placeBeforeDates}
        metaIcons={metaIcons}
      >
        {/*
          The stack leads, then the links, then the bullets: a reader decides
          what a project is built with before reading what was done, and the
          two lines that describe the project stay together instead of one
          above the bullets and one below.
        */}
        <TagLine
          label="Tech Stack"
          items={entry.tech}
          className="rz-entry__tags rz-entry__tags--lead"
        />
        <ProjectLinks live={entry.liveUrl} source={entry.sourceUrl} compact={compactLinks} />
        <Bullets items={entry.bullets} />
      </EntryShell>
    ))}
  </>
);

/**
 * Link labels are spelled out rather than shown as icons — "Live: example.com"
 * survives text extraction, a chain glyph does not. Hrefs go through
 * `ensureProtocol`, which normalises anything that is not http(s)/mailto/tel.
 *
 * `compact` prints the label alone, as the design it was built for does. That
 * is a deliberate trade: the address then lives only in the href, which no
 * parser reads, so a template choosing it says so in its own description.
 */
const ProjectLinks = ({
  live,
  source,
  compact,
}: {
  live: string;
  source: string;
  compact?: boolean;
}) => {
  const links = [
    { label: compact ? 'Live' : 'Live Link', url: live },
    { label: compact ? 'Repository' : 'Source Code Link', url: source },
  ].filter((link) => !isBlank(link.url));

  if (links.length === 0) return null;

  return (
    <div className="rz-entry__links">
      {links.map((link) => (
        <p key={link.label}>
          {compact ? (
            <a href={ensureProtocol(link.url)}>{link.label}</a>
          ) : (
            <>
              <span className="rz-entry__link-label">{link.label}:</span>{' '}
              <a href={ensureProtocol(link.url)}>{ensureProtocol(link.url)}</a>
            </>
          )}
        </p>
      ))}
    </div>
  );
};
