import { isCustomSlot, type SectionSlot } from '@/constants';
import {
  getCustomSection,
  getSectionEntryIcon,
  sectionShowsIcons,
  type Resume,
} from '@/features/resume';

import { Bullets } from './Bits';
import { RichText } from './RichText';

import {
  DeclarationBlock,
  InterestsBlock,
  PersonalInfoBlock,
  ReferencesBlock,
} from './blocks/ClosingBlocks';
import {
  AchievementsBlock,
  AwardsBlock,
  CertificationsBlock,
  ConferencesBlock,
  ExtracurricularBlock,
  LanguagesBlock,
  MembershipsBlock,
  PatentsBlock,
  PublicationsBlock,
  TrainingBlock,
  VolunteeringBlock,
} from './blocks/CredentialBlocks';
import {
  EducationBlock,
  ExperienceBlock,
  ProjectsBlock,
  SkillsBlock,
} from './blocks/HistoryBlocks';

export interface SectionBodyProps {
  resume: Resume;
  sectionKey: SectionSlot;
  /** Passed through to the skills block; creative templates only. */
  showSkillBars?: boolean;
  /**
   * The design draws glyphs. Combined with the section's own setting, which can
   * only take them away — see `sectionShowsIcons` and ADR-022.
   */
  showIcons?: boolean;
  /** The design marks each entry with its section's glyph. See ADR-022. */
  entryMarkers?: boolean;
  /** Sets the organisation on the title's own line, as "Role, Employer". */
  inlineOrganization?: boolean;
  /** Prints a project link as its label alone rather than as the address. */
  compactLinks?: boolean;
  /** Sets a skill group's list on the group name's own line. */
  inlineSkillItems?: boolean;
  /** Leads an entry with the employer rather than the role. */
  organizationFirst?: boolean;
  /** Leads an entry's margin with the place rather than the dates. */
  placeBeforeDates?: boolean;
  /** Marks an entry's dates and place with a glyph. */
  metaIcons?: boolean;
  /** Between a skill group's items, as a real text node. Defaults to a comma. */
  skillSeparator?: string;
  /** Leads each education entry with the institution, and nothing else. */
  educationOrganizationFirst?: boolean;
}

/**
 * Renders the *content* of a section. Headings and layout chrome stay with the
 * template, so all six designs share one implementation of every section — and,
 * more importantly, one DOM order. See ADR-004.
 */
export const SectionBody = ({
  resume,
  sectionKey,
  showSkillBars,
  showIcons,
  entryMarkers,
  inlineOrganization,
  compactLinks,
  inlineSkillItems,
  organizationFirst,
  placeBeforeDates,
  metaIcons,
  skillSeparator,
  educationOrganizationFirst,
}: SectionBodyProps) => {
  /*
   * Two switches, both of which have to be on: the design has to draw glyphs at
   * all, and the reader has to have left this section's on. Resolved here, once,
   * so no block decides for itself and the two never drift apart.
   */
  const icons = Boolean(showIcons) && sectionShowsIcons(resume, sectionKey);
  const entryIcon = icons && entryMarkers ? getSectionEntryIcon(sectionKey) : undefined;

  if (isCustomSlot(sectionKey)) {
    const section = getCustomSection(resume, sectionKey);
    if (!section) return null;

    return section.layout === 'paragraph' ? (
      <p className="rz-summary">
        <RichText value={section.text} />
      </p>
    ) : (
      <Bullets items={section.bullets} />
    );
  }

  switch (sectionKey) {
    case 'summary':
      return (
        <p className="rz-summary">
          <RichText value={resume.summary.text} />
        </p>
      );
    case 'experience':
      return (
        <ExperienceBlock
          resume={resume}
          entryIcon={entryIcon}
          inlineOrganization={inlineOrganization}
          organizationFirst={organizationFirst}
          placeBeforeDates={placeBeforeDates}
          metaIcons={metaIcons}
        />
      );
    case 'education':
      return (
        <EducationBlock
          resume={resume}
          entryIcon={entryIcon}
          inlineOrganization={inlineOrganization}
          organizationFirst={organizationFirst || educationOrganizationFirst}
          placeBeforeDates={placeBeforeDates}
          metaIcons={metaIcons}
        />
      );
    case 'skills':
      return (
        <SkillsBlock
          resume={resume}
          showBars={showSkillBars}
          showIcons={icons}
          inlineItems={inlineSkillItems}
          itemSeparator={skillSeparator}
        />
      );
    case 'projects':
      return (
        <ProjectsBlock
          resume={resume}
          entryIcon={entryIcon}
          inlineOrganization={inlineOrganization}
          organizationFirst={organizationFirst}
          placeBeforeDates={placeBeforeDates}
          compactLinks={compactLinks}
        />
      );
    case 'certifications':
      return (
        <CertificationsBlock
          resume={resume}
          entryIcon={entryIcon}
          inlineOrganization={inlineOrganization}
          compactLinks={compactLinks}
        />
      );
    case 'achievements':
      return <AchievementsBlock resume={resume} showIcons={icons} />;
    case 'awards':
      return <AwardsBlock resume={resume} entryIcon={entryIcon} />;
    case 'training':
      return <TrainingBlock resume={resume} entryIcon={entryIcon} />;
    case 'publications':
      return <PublicationsBlock resume={resume} entryIcon={entryIcon} />;
    case 'conferences':
      return <ConferencesBlock resume={resume} entryIcon={entryIcon} />;
    case 'patents':
      return <PatentsBlock resume={resume} entryIcon={entryIcon} />;
    case 'memberships':
      return <MembershipsBlock resume={resume} entryIcon={entryIcon} />;
    case 'volunteering':
      return <VolunteeringBlock resume={resume} entryIcon={entryIcon} />;
    case 'extracurricular':
      return <ExtracurricularBlock resume={resume} entryIcon={entryIcon} />;
    case 'languages':
      return <LanguagesBlock resume={resume} />;
    case 'interests':
      return <InterestsBlock resume={resume} />;
    case 'personal':
      return <PersonalInfoBlock resume={resume} />;
    case 'references':
      return <ReferencesBlock resume={resume} entryIcon={entryIcon} />;
    case 'declaration':
      return <DeclarationBlock resume={resume} />;
    // `contact` and `signature` are headless: templates place them structurally.
    case 'contact':
    case 'signature':
      return null;
    default:
      return null;
  }
};
