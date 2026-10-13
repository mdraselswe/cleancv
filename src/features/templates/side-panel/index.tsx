import { SECTION_KEYS, type SectionKey, type SectionSlot } from '@/constants';
import { getSectionHeading, getVisibleSections, isSectionVisible } from '@/features/resume';
import { isBlank } from '@/lib/text';

import { ContactRow } from '../shared/ContactRow';
import { PhotoFrame } from '../shared/PhotoFrame';
import { ResumeDocument } from '../shared/ResumeDocument';
import { SectionBody } from '../shared/SectionBody';
import { SignatureBlock } from '../shared/blocks/ClosingBlocks';
import type { TemplateMeta, TemplateProps } from '../types';
import { resolveSectionColumn, shouldShowPhoto } from '../utils/theme';

import './side-panel.css';

/**
 * Sections that carry the narrative, and so hold the wide column.
 *
 * Everything else goes to the panel. Listed this way round because the
 * narrative set is short and stable, while the supporting set is long and
 * grows every time a section is added — a new section belongs on the right by
 * default, which is the safer place for it.
 */
const MAIN_SECTIONS: SectionKey[] = ['summary', 'experience', 'skills', 'volunteering'];

export const meta: TemplateMeta = {
  id: 'side-panel',
  name: 'Right Panel',
  description:
    'Narrative on the left, education, projects and achievements in a narrower panel on the right. Each column is read through in full, so the text comes out in the order a person would read it.',
  category: 'balanced',
  /*
   * Two genuine columns, so a parser using positional heuristics can interleave
   * them. It costs less here than in a rail design: each column holds whole
   * sections rather than fragments, so the worst case is sections out of order
   * rather than a job title fused to a skill.
   */
  atsBaseline: 84,
  supports: {
    photo: false,
    signature: true,
    accentColor: true,
    sidebar: true,
    skillBars: false,
    icons: true,
    entryMarkers: false,
    columns: 2,
  },
  supportedSections: SECTION_KEYS,
  mainSections: MAIN_SECTIONS,
  // Measured off the reference: 9 mm margins and the blue it uses for links.
  defaultTheme: { accent: '#1f7ae0', font: 'sans', density: 'compact', fontScale: 1, marginMm: 9 },
  // 7.6pt in the stylesheet; 1.2 prints it at 9.1pt.
  baseScale: 1.2,
};

/**
 * Right Panel (`side-panel`).
 *
 * The two columns are laid out with CSS Grid, and the markup runs left column
 * first then right — which is also how a person reads it. Nothing is reordered
 * for appearance. See ADR-004.
 */
export const Template = ({ resume, print }: TemplateProps) => {
  const visible = getVisibleSections(resume);
  // The design's split unless the reader has moved a section across. ADR-043.
  const isMain = (slot: SectionSlot) => resolveSectionColumn(resume, meta, slot) === 'main';
  const main = visible.filter(isMain);
  const side = visible.filter((slot) => !isMain(slot));
  const showPhoto = shouldShowPhoto(resume.meta.theme, meta, resume.basics.photo);

  const renderSection = (key: SectionSlot) => (
    <section key={key} className="rz-section" data-section={key}>
      <h2 className="spl-heading rz-heading">{getSectionHeading(resume, key)}</h2>
      <SectionBody
        resume={resume}
        sectionKey={key}
        metaIcons
        showIcons={meta.supports.icons}
        entryMarkers={meta.supports.entryMarkers}
        inlineSkillItems={false}
      />
    </section>
  );

  return (
    <ResumeDocument resume={resume} meta={meta} print={print} templateClass="spl">
      <header className="spl-identity">
        {showPhoto ? (
          <PhotoFrame
            src={resume.basics.photo}
            frame={resume.basics.photoFrame}
            className="spl-identity__photo"
          />
        ) : null}

        {!isBlank(resume.basics.fullName) ? (
          <h1 className="spl-name">{resume.basics.fullName}</h1>
        ) : null}
        {!isBlank(resume.basics.headline) ? (
          <p className="spl-headline">{resume.basics.headline}</p>
        ) : null}

        <ContactRow contact={resume.contact} className="spl-contact" fullUrls />
      </header>

      <div className="spl-columns">
        <div className="spl-main">{main.map(renderSection)}</div>
        <div className="spl-side">{side.map(renderSection)}</div>
      </div>

      {isSectionVisible(resume, 'signature') ? <SignatureBlock resume={resume} /> : null}
    </ResumeDocument>
  );
};
