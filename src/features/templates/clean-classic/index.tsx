import { SECTION_KEYS } from '@/constants';
import { getVisibleSections, isSectionVisible } from '@/features/resume';
import { isBlank } from '@/lib/text';

import { ContactRow } from '../shared/ContactRow';
import { ResumeDocument } from '../shared/ResumeDocument';
import { SectionBody } from '../shared/SectionBody';
import { SignatureBlock } from '../shared/blocks/ClosingBlocks';
import type { TemplateMeta, TemplateProps } from '../types';
import { resolveSectionHeading } from '../utils/headings';

import './clean-classic.css';

export const meta: TemplateMeta = {
  id: 'clean-classic',
  name: 'ক্লিন ক্লাসিক',
  description:
    'মাঝখানে নাম, নিচে পদ আর যোগাযোগ। প্রতিটি শিরোনামের নিচে হালকা রেখা, তারিখ ডানে, দক্ষতা দুই কলামে। সাদামাটা আর পরিষ্কার।',
  category: 'ats',
  // One column, text only, no icons; the grid is layout over the same reading order.
  atsBaseline: 92,
  supports: {
    photo: false,
    signature: true,
    accentColor: true,
    sidebar: false,
    skillBars: false,
    icons: false,
    entryMarkers: false,
    columns: 1,
  },
  supportedSections: SECTION_KEYS,
  // "Experience" where the app says "Work Experience"; both are on the recognised list.
  headingWording: { experience: 'Experience' },
  /*
   * The stylesheet is measured off a reference that sets its body at 8.1pt, which
   * is small for a page someone has to read. 1.358 prints it at 11pt - the size a
   * Calibri CV is set at, and one no ATS flags - and keeps every proportion of the
   * reference. 100% on the slider means that 11pt.
   */
  baseScale: 1.358,
  // Margins and the soft teal are measured off the reference. The faces are not:
  // the body is Carlito (Calibri's metrics) and the headings Arimo (Arial's), the
  // pair a recruiter's Word documents are made of.
  defaultTheme: {
    fontScale: 1,
    accent: '#4aa3b8',
    font: 'carlito',
    density: 'normal',
    marginMm: 14.5,
    photoRadius: 50,
  },
};

/**
 * Clean Classic.
 *
 * Centred name and headline, one contact line, then sections that each carry a
 * hairline under their heading. Entries are a two-column grid - title and
 * organisation left, dates and place right-aligned - drawn over the usual title,
 * organisation, meta, body markup, so the text reads in order.
 *
 * One departure from the reference: it sets the summary straight under the
 * contact line with no heading. Here the summary keeps its heading, because a
 * parser finds the section by that word and the regression gate asserts it; a
 * heading hidden from the eye but kept in the text layer was tried and the PDF
 * drops the clipped glyphs.
 */
export const Template = ({ resume, print }: TemplateProps) => {
  const sections = getVisibleSections(resume);

  return (
    <ResumeDocument resume={resume} meta={meta} print={print} templateClass="cln">
      <header className="cln-identity">
        {!isBlank(resume.basics.fullName) ? (
          <h1 className="cln-name">{resume.basics.fullName}</h1>
        ) : null}
        {!isBlank(resume.basics.headline) ? (
          <p className="cln-headline">{resume.basics.headline}</p>
        ) : null}
        <ContactRow
          contact={resume.contact}
          className="cln-contact"
          withIcons={false}
          locationFirst
          separator="·"
        />
      </header>

      {sections.map((key) => (
        <section key={key} className="rz-section" data-section={key}>
          <h2 className="cln-heading rz-heading">{resolveSectionHeading(resume, meta, key)}</h2>
          <SectionBody
            resume={resume}
            sectionKey={key}
            showIcons={meta.supports.icons}
            entryMarkers={meta.supports.entryMarkers}
            educationOrganizationFirst
            skillSeparator=" • "
          />
        </section>
      ))}

      {isSectionVisible(resume, 'signature') ? <SignatureBlock resume={resume} /> : null}
    </ResumeDocument>
  );
};
