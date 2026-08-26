import { SECTION_KEYS, type SectionKey } from '@/constants';
import { getSectionHeading, getVisibleSections, isSectionVisible } from '@/features/resume';
import { isBlank } from '@/lib/text';

import { ContactRow } from '../shared/ContactRow';
import { PhotoFrame } from '../shared/PhotoFrame';
import { ResumeDocument } from '../shared/ResumeDocument';
import { SectionBody } from '../shared/SectionBody';
import { SignatureBlock } from '../shared/blocks/ClosingBlocks';
import type { TemplateMeta, TemplateProps } from '../types';
import { resolveSectionColumn, shouldShowPhoto } from '../utils/theme';

import './modern-sidebar.css';

/**
 * Sections that live in the coloured rail.
 *
 * They are rendered *first* in the DOM, not shuffled into place with CSS — so
 * the extracted text reads identity, contact, skills, languages, then the
 * narrative. That is a sane reading order in its own right, which is what makes
 * a genuine sidebar possible without wrecking the parse. See ADR-004.
 */
const RAIL_SECTIONS: SectionKey[] = ['skills', 'languages', 'certifications', 'interests'];

/* The contract states the split the other way round: the wide column's list. */
const MAIN_SECTIONS = SECTION_KEYS.filter((key) => !RAIL_SECTIONS.includes(key));

export const meta: TemplateMeta = {
  id: 'modern-sidebar',
  name: 'Modern Sidebar',
  description:
    'Coloured rail for contact and skills, narrative on the right. Reads top-down in the PDF despite the two-column look.',
  category: 'balanced',
  atsBaseline: 80,
  supports: {
    photo: true,
    signature: true,
    accentColor: true,
    sidebar: true,
    skillBars: false,
    icons: true,
    entryMarkers: true,
    columns: 2,
  },
  supportedSections: SECTION_KEYS,
  mainSections: MAIN_SECTIONS,
  defaultTheme: {
    accent: '#0f766e',
    font: 'sans',
    density: 'normal',
    marginMm: 8,
    photoRadius: 50,
  },
  /*
   * A third of the paper, edge to edge. The rail's own column then stops one
   * margin short of it, so its text is inset from the band by the same amount
   * the narrative is inset from the paper. See ADR-036.
   */
  pageBleed: { width: '69mm' },
};

export const Template = ({ resume, print }: TemplateProps) => {
  const visible = getVisibleSections(resume);
  // The design's split unless the reader has moved a section across. ADR-043.
  const isRail = (slot: (typeof visible)[number]) =>
    resolveSectionColumn(resume, meta, slot) === 'side';
  const rail = visible.filter(isRail);
  const main = visible.filter((slot) => !isRail(slot));
  const showPhoto = shouldShowPhoto(resume.meta.theme, meta, resume.basics.photo);

  return (
    <ResumeDocument resume={resume} meta={meta} print={print} templateClass="msb">
      <div className="msb-grid">
        <aside className="msb-rail">
          {showPhoto ? (
            <PhotoFrame
              src={resume.basics.photo}
              frame={resume.basics.photoFrame}
              className="msb-rail__photo"
            />
          ) : null}

          {!isBlank(resume.basics.fullName) ? (
            <h1 className="msb-name">{resume.basics.fullName}</h1>
          ) : null}
          {!isBlank(resume.basics.headline) ? (
            <p className="msb-headline">{resume.basics.headline}</p>
          ) : null}

          <ContactRow contact={resume.contact} className="msb-contact" />

          {rail.map((key) => (
            <section key={key} className="rz-section">
              <h2 className="msb-rail-heading rz-heading">{getSectionHeading(resume, key)}</h2>
              <SectionBody
                resume={resume}
                sectionKey={key}
                showIcons={meta.supports.icons}
                entryMarkers={meta.supports.entryMarkers}
              />
            </section>
          ))}
        </aside>

        <main className="msb-main">
          {main.map((key) => (
            <section key={key} className="rz-section">
              <h2 className="msb-heading rz-heading">{getSectionHeading(resume, key)}</h2>
              {/* A calendar and a pin: the dates and the place are one paragraph
                  with a single space between them, which reads as one run on
                  the page. The glyphs separate them without touching the text
                  the parser gets. */}
              <SectionBody
                resume={resume}
                sectionKey={key}
                metaIcons
                showIcons={meta.supports.icons}
                entryMarkers={meta.supports.entryMarkers}
              />
            </section>
          ))}

          {isSectionVisible(resume, 'signature') ? <SignatureBlock resume={resume} /> : null}
        </main>
      </div>
    </ResumeDocument>
  );
};
