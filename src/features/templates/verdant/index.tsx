import { SECTION_KEYS, type SectionKey, type SectionSlot } from '@/constants';
import {
  getSectionHeading,
  getSectionHeadingIcon,
  getVisibleSections,
  isSectionVisible,
} from '@/features/resume';
import { isBlank } from '@/lib/text';

import { CategoryIcon } from '../shared/CategoryIcon';
import { ContactRow } from '../shared/ContactRow';
import { PhotoFrame } from '../shared/PhotoFrame';
import { ResumeDocument } from '../shared/ResumeDocument';
import { SectionBody } from '../shared/SectionBody';
import { SignatureBlock } from '../shared/blocks/ClosingBlocks';
import type { TemplateMeta, TemplateProps } from '../types';
import { resolveSectionColumn, shouldShowPhoto } from '../utils/theme';

import './verdant.css';

/**
 * Sections that carry the narrative, and so hold the wide column.
 *
 * Everything else goes to the panel, the same way round as Right Panel: the
 * narrative set is short and stable, the supporting set is long and grows every
 * time a section is added, and the panel is the safer default for a new one.
 *
 * Achievements are in it because they are narrative — they name the employers
 * they happened at. In the panel, which is painted first, the extracted text
 * mentioned Grameen a page before the Shikho bullets that precede it, which is
 * exactly the interleaving a two-column design has to avoid. See ADR-004.
 */
const MAIN_SECTIONS: SectionKey[] = ['summary', 'experience', 'education', 'achievements'];

export const meta: TemplateMeta = {
  id: 'verdant',
  name: 'Portrait Panel',
  description:
    'Portrait and supporting detail in a left panel, narrative on the right, and every heading behind a soft green badge. Warm and current without giving up a plain reading order.',
  category: 'balanced',
  /*
   * Two real columns, so a parser working from positions can interleave them.
   * It costs about what Right Panel costs: each column holds whole sections
   * rather than fragments, so the worst case is sections out of order rather
   * than a job title fused to a phone number. The portrait costs the rest.
   */
  atsBaseline: 78,
  supports: {
    photo: true,
    signature: true,
    accentColor: true,
    sidebar: true,
    skillBars: false,
    icons: true,
    /*
     * Off: an entry here opens with its employer in bold over a ruled gap, so
     * a glyph in front of it would be a second answer to a question already
     * answered. See ADR-022 and ADR-037.
     */
    entryMarkers: false,
    columns: 2,
  },
  supportedSections: SECTION_KEYS,
  mainSections: MAIN_SECTIONS,
  defaultTheme: {
    accent: '#63c28d',
    font: 'sans',
    density: 'normal',
    fontScale: 1,
    marginMm: 12,
    photoRadius: 50,
  },
  // 8.8pt in the stylesheet; 1.05 puts it just over the readable line.
  baseScale: 1.05,
};

/**
 * Portrait Panel (`verdant`).
 *
 * The identity is first in the markup even though it sits at the top of the
 * *right* column, because the name is the first thing a parser looks for and a
 * panel-first order would bury it under the certifications. Grid places it;
 * nothing is reordered for appearance. See ADR-004.
 */
export const Template = ({ resume, print }: TemplateProps) => {
  const visible = getVisibleSections(resume);
  // The design's split unless the reader has moved a section across. ADR-043.
  const isMain = (slot: SectionSlot) => resolveSectionColumn(resume, meta, slot) === 'main';
  const main = visible.filter(isMain);
  const panel = visible.filter((slot) => !isMain(slot));
  const showPhoto = shouldShowPhoto(resume.meta.theme, meta, resume.basics.photo);

  /*
   * The badge is the design's own heading mark, not one of the glyphs the
   * reader picks per section — it is on for every heading, the way Vibrant's
   * dot is. Its shape comes from the section when there is one for it and from
   * the heading's own words when there is not.
   */
  const renderHeading = (slot: SectionSlot) => {
    const heading = getSectionHeading(resume, slot);

    return (
      <h2 className="vrd-heading rz-heading">
        <span className="vrd-heading__badge" aria-hidden="true">
          <CategoryIcon label={heading} icon={getSectionHeadingIcon(slot)} fallback="star" />
        </span>
        {heading}
      </h2>
    );
  };

  const renderSection = (slot: SectionSlot, wide: boolean) => (
    <section key={slot} className="rz-section" data-section={slot}>
      {renderHeading(slot)}
      <SectionBody
        resume={resume}
        sectionKey={slot}
        showIcons={meta.supports.icons}
        entryMarkers={meta.supports.entryMarkers}
        /* The employer leads and the place leads the margin, but only where
           there is a margin to lead: the panel is one narrow column. */
        organizationFirst={wide}
        placeBeforeDates={wide}
      />
    </section>
  );

  return (
    <ResumeDocument resume={resume} meta={meta} print={print} templateClass="vrd">
      <div className="vrd-grid">
        <header className="vrd-identity">
          {!isBlank(resume.basics.fullName) ? (
            <h1 className="vrd-name">{resume.basics.fullName}</h1>
          ) : null}
          {!isBlank(resume.basics.headline) ? (
            <p className="vrd-headline">{resume.basics.headline}</p>
          ) : null}
        </header>

        <aside className="vrd-panel">
          {showPhoto ? (
            /* The ring is drawn on this wrapper: `.rz-photo` clips to the frame
               so that zoom has something to cut against, and anything drawn on
               it would be clipped with the image. See ADR-025. */
            <div className="vrd-portrait">
              {/*
                The mark around the portrait, traced off the reference rather
                than approximated: two open arcs that do not meet — a long one
                over the top and a shorter one under the foot — a crescent
                filling the gap between the photo and the arc on the right, and
                a disc where the lower arc passes the left. Paths, because none
                of it is a circle; empty of text, like every other piece of
                furniture in this design. See ADR-041.
              */}
              <svg className="vrd-portrait__mark" viewBox="0 0 100 100" aria-hidden="true">
                {/*
                  A ring of radius 44 about the frame's own centre, drawn as two
                  arcs with a gap either side, a crescent filling the space
                  between the frame and the ring at the top right, and a disc
                  where the lower arc passes the left.

                  `pathLength="100"` makes the dash pattern read as percentages
                  of the circle, so each arc is a span in degrees over 3.6 and
                  the two are mathematically even — the same shape traced off
                  the reference wobbled, because the reference was drawn by hand
                  and a traced curve carries the hand with it. See ADR-044.
                */}
                <circle
                  className="vrd-portrait__arc"
                  cx="50"
                  cy="50"
                  r="44"
                  pathLength="100"
                  strokeDasharray="43.06 56.94"
                  strokeDashoffset="-54.17"
                />
                <circle
                  className="vrd-portrait__arc"
                  cx="50"
                  cy="50"
                  r="44"
                  pathLength="100"
                  strokeDasharray="44.44 55.56"
                  strokeDashoffset="-4.17"
                />
                {/*
                  A shorter, lighter arc inside the ring, in the deeper green.
                  Concentric with it and clear of the frame on both sides, so it
                  layers rather than crosses: a crescent between the two touched
                  the frame's edge and read as a blade laid over the picture.
                */}
                <circle
                  className="vrd-portrait__accent"
                  cx="50"
                  cy="50"
                  r="38.5"
                  pathLength="100"
                  strokeDasharray="15.28 84.72"
                  strokeDashoffset="-83.33"
                />
                <circle className="vrd-portrait__dot" cx="13.9" cy="75.2" r="7" />
              </svg>
              <PhotoFrame
                src={resume.basics.photo}
                frame={resume.basics.photoFrame}
                className="vrd-portrait__photo"
              />
            </div>
          ) : null}

          {isSectionVisible(resume, 'contact') ? (
            <section className="rz-section" data-section="contact">
              {renderHeading('contact')}
              <ContactRow contact={resume.contact} className="vrd-contact" />
            </section>
          ) : null}

          {panel.map((slot) => renderSection(slot, false))}
        </aside>

        <main className="vrd-main">
          {main.map((slot) => renderSection(slot, true))}

          {isSectionVisible(resume, 'signature') ? <SignatureBlock resume={resume} /> : null}
        </main>
      </div>
    </ResumeDocument>
  );
};
