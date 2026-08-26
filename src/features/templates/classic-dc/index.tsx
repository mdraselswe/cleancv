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

import './classic-dc.css';

export const meta: TemplateMeta = {
  id: 'classic-dc',
  name: 'Classic Timeline',
  description:
    'Dates and locations in a left rail, content on the right. Two-column look, single-column reading order.',
  category: 'ats',
  atsBaseline: 95,
  supports: {
    photo: true,
    signature: true,
    accentColor: true,
    sidebar: false,
    skillBars: false,
    icons: true,
    entryMarkers: false,
    columns: 2,
  },
  supportedSections: SECTION_KEYS,
  // Measured off the reference document: 11 mm margins, and the blue it uses
  // for the headline, company names and section glyphs.
  defaultTheme: {
    accent: '#2563eb',
    font: 'sans',
    density: 'normal',
    marginMm: 11,
    photoRadius: 50,
  },
};

export const Template = ({ resume, print }: TemplateProps) => {
  const sections = getVisibleSections(resume);
  const showPhoto = shouldShowPhoto(resume.meta.theme, meta, resume.basics.photo);

  return (
    <ResumeDocument resume={resume} meta={meta} print={print} templateClass="cdc">
      <header className="cdc-identity">
        {showPhoto ? (
          <PhotoFrame
            src={resume.basics.photo}
            frame={resume.basics.photoFrame}
            className="cdc-identity__photo"
          />
        ) : null}

        <div>
          {!isBlank(resume.basics.fullName) ? (
            <h1 className="cdc-name">{resume.basics.fullName}</h1>
          ) : null}
          {!isBlank(resume.basics.headline) ? (
            <p className="cdc-headline">{resume.basics.headline}</p>
          ) : null}
          {/* The reference prints whole addresses, not trimmed ones. */}
          <ContactRow contact={resume.contact} fullUrls />
        </div>
      </header>

      {/*
        `data-section` lets the stylesheet give the timeline rail to the dated
        histories only. Projects and credentials run full width in the
        reference, and a rail with nothing in it reads as a mistake.
      */}
      {sections.map((key) => (
        <section key={key} className="rz-section" data-section={key}>
          <h2 className="cdc-heading rz-heading">{getSectionHeading(resume, key)}</h2>
          <SectionBody
            resume={resume}
            sectionKey={key}
            showIcons={meta.supports.icons}
            entryMarkers={meta.supports.entryMarkers}
          />
        </section>
      ))}

      {isSectionVisible(resume, 'signature') ? <SignatureBlock resume={resume} /> : null}
    </ResumeDocument>
  );
};
