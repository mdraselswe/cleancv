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

import './vibrant.css';

export const meta: TemplateMeta = {
  id: 'vibrant',
  name: 'Vibrant',
  description:
    'Gradient banner, timeline experience and skill meters. Built to be looked at — pair it with the ATS export when applying online.',
  category: 'creative',
  atsBaseline: 60,
  supports: {
    photo: true,
    signature: true,
    accentColor: true,
    sidebar: false,
    skillBars: true,
    icons: true,
    /*
     * Off, because the timeline rail already answers the question a marker
     * answers. Both at once put the glyph on top of the rail and its dot — and
     * a design that has said where one entry ends does not need to say it
     * twice. See ADR-022.
     */
    entryMarkers: false,
    columns: 1,
  },
  supportedSections: SECTION_KEYS,
  defaultTheme: {
    // Stated for every design: a switch applies it over the current theme, so a
    // design that says nothing would inherit the previous design's text size.
    fontScale: 1,
    accent: '#6d28d9',
    font: 'grotesk',
    density: 'normal',
    marginMm: 8,
    photoRadius: 50,
  },
};

/**
 * The display design.
 *
 * Everything decorative here — the banner, the timeline rail, the skill meters —
 * is background and pseudo-element work carrying no text, so even at a 60
 * parseability ceiling the extracted content stays in order and intact. The
 * ceiling reflects the coloured banner and dense visual furniture, which some
 * older parsers handle poorly, not a broken reading order.
 */
export const Template = ({ resume, print }: TemplateProps) => {
  const sections = getVisibleSections(resume);
  const showPhoto = shouldShowPhoto(resume.meta.theme, meta, resume.basics.photo);

  return (
    <ResumeDocument resume={resume} meta={meta} print={print} templateClass="vbr">
      <header className="vbr-banner">
        {showPhoto ? (
          <PhotoFrame
            src={resume.basics.photo}
            frame={resume.basics.photoFrame}
            className="vbr-banner__photo"
          />
        ) : null}

        <div className="vbr-banner__text">
          {!isBlank(resume.basics.fullName) ? (
            <h1 className="vbr-name">{resume.basics.fullName}</h1>
          ) : null}
          {!isBlank(resume.basics.headline) ? (
            <p className="vbr-headline">{resume.basics.headline}</p>
          ) : null}
          <ContactRow contact={resume.contact} className="vbr-contact" />
        </div>
      </header>

      <div className="vbr-body">
        {sections.map((key) => (
          <section key={key} className="rz-section">
            <h2 className="vbr-heading rz-heading">
              <span className="vbr-heading__dot" aria-hidden="true" />
              {getSectionHeading(resume, key)}
            </h2>
            {/* The dates and the place are one paragraph separated by a single
                space, which reads as one run on the page. Glyphs separate them
                without touching the text a parser gets. */}
            <SectionBody
              resume={resume}
              sectionKey={key}
              showSkillBars
              metaIcons
              showIcons={meta.supports.icons}
              entryMarkers={meta.supports.entryMarkers}
            />
          </section>
        ))}

        {isSectionVisible(resume, 'signature') ? <SignatureBlock resume={resume} /> : null}
      </div>
    </ResumeDocument>
  );
};
