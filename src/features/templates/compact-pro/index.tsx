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

import './compact-pro.css';

export const meta: TemplateMeta = {
  id: 'compact-pro',
  name: 'Compact Professional',
  description:
    'Name left, contact right, and a rule after every heading. Dense single column that fits a long history — dates sit right-aligned beside each role.',
  category: 'balanced',
  /*
   * Below the plain design for one reason worth stating: project and credential
   * links print as "Repository" rather than as the address, matching the layout
   * this rebuilds. The address then lives only in the href, which no parser
   * reads. Everything else here extracts as cleanly as the ATS template.
   */
  atsBaseline: 88,
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
  // Measured off the reference: 15 mm margins and its heading blue.
  defaultTheme: {
    accent: '#1d6bc4',
    font: 'sans',
    density: 'compact',
    marginMm: 15,
    photoRadius: 50,
  },
};

/**
 * Compact Professional.
 *
 * The header is the only two-column part: the name holds the left, the contact
 * block is right-aligned opposite it. Everything below runs full width, with
 * each entry's dates absolutely positioned into the right margin so the markup
 * stays in reading order. See ADR-004.
 */
export const Template = ({ resume, print }: TemplateProps) => {
  const sections = getVisibleSections(resume);
  const showPhoto = shouldShowPhoto(resume.meta.theme, meta, resume.basics.photo);

  return (
    <ResumeDocument resume={resume} meta={meta} print={print} templateClass="cpr">
      <header className="cpr-identity">
        {showPhoto ? (
          <PhotoFrame
            src={resume.basics.photo}
            frame={resume.basics.photoFrame}
            className="cpr-identity__photo"
          />
        ) : null}

        <div className="cpr-identity__name">
          {!isBlank(resume.basics.fullName) ? (
            <h1 className="cpr-name">{resume.basics.fullName}</h1>
          ) : null}
          {!isBlank(resume.basics.headline) ? (
            <p className="cpr-headline">{resume.basics.headline}</p>
          ) : null}
        </div>

        <ContactRow contact={resume.contact} className="cpr-contact" />
      </header>

      {sections.map((key) => (
        <section key={key} className="rz-section" data-section={key}>
          {/* The rule is drawn by the heading's own pseudo-element: no text, no
              extra element, and nothing for a parser to trip over. */}
          <h2 className="cpr-heading rz-heading">{getSectionHeading(resume, key)}</h2>
          <SectionBody
            resume={resume}
            sectionKey={key}
            showIcons={meta.supports.icons}
            entryMarkers={meta.supports.entryMarkers}
            inlineOrganization
            inlineSkillItems
            compactLinks
          />
        </section>
      ))}

      {isSectionVisible(resume, 'signature') ? <SignatureBlock resume={resume} /> : null}
    </ResumeDocument>
  );
};
