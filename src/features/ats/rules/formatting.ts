import { BODY_TEXT_PT, MAX_RESUME_PAGES, SUMMARY_WORD_RANGE, panelTarget } from '@/constants';
import { isRangeReversed } from '@/lib/date';
import { isBlank, wordCount } from '@/lib/text';

import type { AtsRule } from '../types';

/** Structure and consistency — the things that make a document scannable. */
export const rules: AtsRule[] = [
  {
    id: 'date-order',
    category: 'formatting',
    weight: 4,
    label: 'Date ranges',
    evaluate: (resume) => {
      const reversed = [
        ...resume.experience.filter((entry) => isRangeReversed(entry.dates)),
        ...resume.education.filter((entry) => isRangeReversed(entry.dates)),
        ...resume.projects.filter((entry) => isRangeReversed(entry.dates)),
      ];

      if (reversed.length === 0) {
        return { status: 'pass', message: 'Every date range runs forwards, in one MM/YYYY format.' };
      }

      return {
        status: 'error',
        message: `${reversed.length} entr${reversed.length === 1 ? 'y ends' : 'ies end'} before they start.`,
        fixHint: 'A parser reading these will compute negative tenure.',
        targets: ['experience', 'education'],
      };
    },
  },

  {
    id: 'page-count',
    category: 'formatting',
    weight: 4,
    label: 'Length',
    evaluate: (_resume, { estimatedPages }) => {
      if (estimatedPages <= MAX_RESUME_PAGES) {
        return {
          status: 'pass',
          message: `About ${estimatedPages} page${estimatedPages === 1 ? '' : 's'} — within the usual limit.`,
        };
      }

      return {
        status: estimatedPages > MAX_RESUME_PAGES + 1 ? 'error' : 'warn',
        message: `About ${estimatedPages} pages.`,
        fixHint:
          'Cut older roles to two bullets, or tighten spacing under Design. Two pages is the ceiling outside academia.',
        targets: [panelTarget('design')],
      };
    },
  },

  {
    id: 'summary-length',
    category: 'formatting',
    weight: 3,
    label: 'Summary length',
    evaluate: (resume) => {
      if (isBlank(resume.summary.text)) {
        return { status: 'warn', message: 'No summary to measure.', targets: ['summary'] };
      }

      const count = wordCount(resume.summary.text);

      if (count >= SUMMARY_WORD_RANGE.min && count <= SUMMARY_WORD_RANGE.max) {
        return { status: 'pass', message: `${count} words — about right.` };
      }

      return {
        status: 'warn',
        message:
          count < SUMMARY_WORD_RANGE.min
            ? `${count} words — too thin to position you.`
            : `${count} words — longer than anyone reads.`,
        fixHint: `Aim for ${SUMMARY_WORD_RANGE.min}–${SUMMARY_WORD_RANGE.max} words.`,
        targets: ['summary'],
      };
    },
  },

  {
    id: 'reverse-chronological',
    category: 'formatting',
    weight: 3,
    label: 'Newest first',
    evaluate: (resume) => {
      const dated = resume.experience.filter((entry) => !isBlank(entry.dates.start));
      if (dated.length < 2) {
        return { status: 'pass', message: 'Too few dated roles for ordering to matter.' };
      }

      const outOfOrder = dated.some((entry, index) => {
        if (index === 0) return false;
        const previous = dated[index - 1];
        if (previous.dates.current) return false;

        return entry.dates.current || entry.dates.start > previous.dates.start;
      });

      return outOfOrder
        ? {
            status: 'warn',
            message: 'Roles are not in reverse-chronological order.',
            fixHint: 'Most recent first. Recruiters and parsers both assume it.',
            targets: ['experience'],
          }
        : { status: 'pass', message: 'Roles run newest to oldest.' };
    },
  },

  {
    id: 'body-size',
    category: 'formatting',
    weight: 3,
    label: 'Text size',
    evaluate: (_resume, { measuredBodyPt }) => {
      if (!measuredBodyPt || measuredBodyPt <= 0) {
        return {
          status: 'pass',
          message: 'Measured from the preview, which is not open on this screen.',
        };
      }

      const pt = Math.round(measuredBodyPt * 10) / 10;

      if (pt >= BODY_TEXT_PT.warn) {
        return { status: 'pass', message: `Body text measures ${pt}pt.` };
      }

      // The slider is a multiplier on the design's own size, so say how much.
      const needed = Math.min(140, Math.ceil(((BODY_TEXT_PT.warn / measuredBodyPt) * 100) / 5) * 5);

      return {
        status: pt < BODY_TEXT_PT.error ? 'error' : 'warn',
        message: `Body text measures about ${pt}pt — small enough to tire a reader.`,
        fixHint: `Set Text size to about ${needed}% in Design, or pick a design with larger type. It may add a page; trim before you shrink.`,
        targets: [panelTarget('design')],
      };
    },
  },

  {
    id: 'section-count',
    category: 'formatting',
    weight: 1,
    label: 'Section count',
    evaluate: (resume) => {
      const enabled = Object.values(resume.meta.sections).filter((setting) => setting?.enabled).length;

      if (enabled <= 12) {
        return { status: 'pass', message: `${enabled} sections enabled.` };
      }

      return {
        status: 'warn',
        message: `${enabled} sections enabled.`,
        fixHint: 'Past a dozen, each one gets less attention. Turn off what is not earning its space.',
        targets: [panelTarget('sections')],
      };
    },
  },
];
