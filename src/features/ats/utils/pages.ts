import {
  DENSITY_SCALE,
  LINES_PER_PAGE,
  PAGE_MARGIN_MM,
  PAGE_SIZE_MM,
  customIdOf,
  isCustomSlot,
  type SectionSlot,
} from '@/constants';
import { getVisibleSections, type Resume } from '@/features/resume';
import { isBlank } from '@/lib/text';

/**
 * A content-only page estimate.
 *
 * The preview measures the real thing, and its number always wins. This exists
 * because the preview is not mounted on the mobile Score tab: without it the
 * length rule would report "About 1 page" for a four-page CV until the user
 * happened to open Preview, which is exactly the reader who most needs the
 * warning. Accuracy to the nearest page is enough for a rule whose threshold is
 * a whole page.
 */

/** Characters that fit on one line of body text at the default scale. */
const CHARS_PER_LINE = 95;

/** Blank space around a heading, in line units. */
const SECTION_CHROME_LINES = 2.2;

/** Name, headline and the contact row. */
const HEADER_LINES = 4;

const textLines = (value: string, charsPerLine = CHARS_PER_LINE): number =>
  isBlank(value) ? 0 : Math.ceil(value.trim().length / charsPerLine);

const bulletLines = (bullets: readonly string[]): number =>
  bullets.reduce((total, bullet) => total + textLines(bullet), 0);

/** Rough vertical cost of one section's body, in line units. */
const sectionLines = (resume: Resume, slot: SectionSlot): number => {
  switch (slot) {
    case 'summary':
      return textLines(resume.summary.text);
    case 'experience':
      return resume.experience.reduce(
        (total, entry) =>
          total + 2 + bulletLines(entry.bullets) + (entry.tech.length > 0 ? 1 : 0),
        0,
      );
    case 'education':
      return resume.education.reduce((total, entry) => total + 2 + bulletLines(entry.bullets), 0);
    case 'projects':
      return resume.projects.reduce(
        (total, entry) =>
          total + 2 + bulletLines(entry.bullets) + (entry.tech.length > 0 ? 1 : 0),
        0,
      );
    case 'volunteering':
      return resume.volunteering.reduce((total, entry) => total + 2 + bulletLines(entry.bullets), 0);
    case 'skills':
      return resume.skills.reduce(
        (total, group) => total + Math.max(1, textLines(`${group.category}: ${group.items.join(', ')}`)),
        0,
      );
    case 'interests':
      return Math.max(1, textLines(resume.interests.items.join(', ')));
    case 'personal':
      return Math.ceil(Object.values(resume.personal).filter((value) => !isBlank(value)).length / 2);
    case 'declaration':
      return textLines(resume.declaration.text) + 2;
    case 'references':
      return resume.references.mode === 'on-request' ? 1 : resume.references.entries.length * 3;
    default: {
      if (isCustomSlot(slot)) {
        const id = customIdOf(slot);
        const section = resume.customSections.find((entry) => entry.id === id);
        if (!section) return 0;

        return section.layout === 'paragraph'
          ? textLines(section.text)
          : bulletLines(section.bullets);
      }

      const value = resume[slot as keyof Resume];

      // The remaining sections are all short, evenly shaped credential lists.
      return Array.isArray(value) ? value.length * 2 : 0;
    }
  }
};

export const estimatePages = (resume: Resume): number => {
  const { theme } = resume.meta;

  const lines =
    HEADER_LINES +
    getVisibleSections(resume).reduce(
      (total, slot) => total + SECTION_CHROME_LINES + sectionLines(resume, slot),
      0,
    );

  // A smaller type scale and a denser layout both fit more lines on a page; a
  // wider margin leaves less height to fill.
  const marginFactor =
    (PAGE_SIZE_MM.height - 2 * theme.marginMm) /
    (PAGE_SIZE_MM.height - 2 * PAGE_MARGIN_MM.default);
  const capacity =
    (LINES_PER_PAGE / theme.fontScale / DENSITY_SCALE[theme.density]) * marginFactor;

  return Math.max(1, Math.ceil(lines / capacity));
};
