import { SECTION_KEYS } from '@/constants';
import { getSectionHeading, getVisibleSections, isSectionVisible } from '@/features/resume';
import { isBlank } from '@/lib/text';

import { ContactRow } from '../shared/ContactRow';
import { PhotoFrame } from '../shared/PhotoFrame';
import { ResumeDocument } from '../shared/ResumeDocument';
import { SectionBody } from '../shared/SectionBody';
import { SignatureBlock } from '../shared/blocks/ClosingBlocks';
import type { TemplateMeta, TemplateProps } from '../types';
import { shouldShowPhoto } from '../utils/theme';

import './formal-centered.css';

export const meta: TemplateMeta = {
  id: 'formal-centered',
  name: 'Formal Centered',
  description:
    'Centred serif headings over a full-width rule, contact on one line, and each role led by the employer. Symmetrical and conservative — the safest-looking of the designed templates.',
  category: 'ats',
  /*
   * As high as the plain design: everything here is one column, in reading
   * order, with real text separators and no link labels standing in for
   * addresses. The centring is visual only.
   */
  atsBaseline: 94,
  supports: {
    photo: true,
    signature: true,
    accentColor: true,
    sidebar: false,
    skillBars: false,
    icons: false,
    entryMarkers: false,
    columns: 1,
  },
  supportedSections: SECTION_KEYS,
  /*
   * PT Sans against Volkhov is the pairing the reference layout uses, and the
   * proportions below are measured for it. The font stays a picker value rather
   * than something the stylesheet nails down, so changing it still works — this
   * is only where the design starts.
   */
  defaultTheme: {
    accent: '#5b7183',
    font: 'humanist',
    density: 'normal',
    marginMm: 13,
    // Circular, centred over the name: the reference's one ornament.
    photoRadius: 50,
  },
};

/**
 * Formal Centered.
 *
 * The employer leads each entry and the place leads each margin, both as
 * markup rather than as CSS ordering: this design genuinely reads employer
 * first, so the extracted text has to say so too. See ADR-004.
 */
export const Template = ({ resume, print }: TemplateProps) => {
  const sections = getVisibleSections(resume);
  const showPhoto = shouldShowPhoto(resume.meta.theme, meta, resume.basics.photo);

  return (
    <ResumeDocument resume={resume} meta={meta} print={print} templateClass="fmc">
      <header className="fmc-identity">
        {showPhoto ? (
          <PhotoFrame
            src={resume.basics.photo}
            frame={resume.basics.photoFrame}
            className="fmc-identity__photo"
          />
        ) : null}

        {!isBlank(resume.basics.fullName) ? (
          <h1 className="fmc-name">{resume.basics.fullName}</h1>
        ) : null}
        {!isBlank(resume.basics.headline) ? (
          <p className="fmc-headline">{resume.basics.headline}</p>
        ) : null}

        {/*
          Addresses print trimmed of their protocol — the reference line reads
          "linkedin.com/in/…", and `https://` five times over is most of a
          centred line's width spent on nothing a reader needs.
        */}
        <ContactRow
          contact={resume.contact}
          className="fmc-contact"
          withIcons={false}
          locationLast
          separator=" • "
        />
      </header>

      {sections.map((key) => (
        <section key={key} className="rz-section" data-section={key}>
          {/* The rule under each heading is the heading's own pseudo-element:
              no extra node, and nothing added to the text layer. */}
          <h2 className="fmc-heading rz-heading">{getSectionHeading(resume, key)}</h2>
          <SectionBody
            resume={resume}
            sectionKey={key}
            showIcons={meta.supports.icons}
            entryMarkers={meta.supports.entryMarkers}
            organizationFirst
            placeBeforeDates
            inlineSkillItems
          />
        </section>
      ))}

      {isSectionVisible(resume, 'signature') ? <SignatureBlock resume={resume} /> : null}
    </ResumeDocument>
  );
};
