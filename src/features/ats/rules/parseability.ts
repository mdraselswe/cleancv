import { SECTION_META, isRecognisedHeading, panelTarget, type SectionKey } from '@/constants';
import { isSectionEnabled } from '@/features/resume';
import { isBlank } from '@/lib/text';

import type { AtsRule } from '../types';

/**
 * Can a parser read the document at all?
 *
 * These are the rules that decide whether the other four categories even get
 * looked at. A beautiful resume that extracts as noise scores zero everywhere.
 */
export const rules: AtsRule[] = [
  {
    id: 'template-ceiling',
    category: 'parseability',
    weight: 4,
    label: 'Template parse reliability',
    evaluate: (_resume, { template }) => {
      if (template.atsBaseline >= 90) {
        return {
          status: 'pass',
          message: `${template.name} keeps a single reading order and parses cleanly.`,
        };
      }

      if (template.atsBaseline >= 75) {
        return {
          status: 'warn',
          message: `${template.name} uses a layout some parsers handle imperfectly.`,
          fixHint: 'Send the ATS PDF when applying through a portal, and this design by email.',
          targets: [panelTarget('design')],
        };
      }

      return {
        status: 'error',
        message: `${template.name} is a display design; automated parsers will lose parts of it.`,
        fixHint:
          'Use the ATS PDF export for any application that goes through a job portal, or pick a design with a higher ceiling.',
        targets: [panelTarget('design')],
      };
    },
  },

  {
    id: 'photo-risk',
    category: 'parseability',
    weight: 2,
    label: 'Photo',
    evaluate: (resume, { template }) => {
      const showing = template.supports.photo && resume.meta.theme.showPhoto && !isBlank(resume.basics.photo);

      if (!showing) {
        return { status: 'pass', message: 'No photo — nothing for a parser to trip over.' };
      }

      return {
        status: 'warn',
        message: 'A photo is printed on the document.',
        fixHint:
          'Expected in parts of Europe, Asia and the Gulf. Remove it for US, UK and Canadian applications, where it can get a resume discarded unread.',
        targets: ['contact'],
      };
    },
  },

  {
    id: 'standard-headings',
    category: 'parseability',
    weight: 3,
    label: 'Section headings',
    evaluate: (resume) => {
      // Only names no parser is known to match on. "Professional Experience"
      // is a standard heading, not a risk, and flagging it would be noise.
      const renamed = (Object.keys(resume.meta.sections) as SectionKey[]).filter((key) => {
        const heading = resume.meta.sections[key]?.heading;

        return (
          isSectionEnabled(resume, key) &&
          !isBlank(heading) &&
          !isRecognisedHeading(key, heading)
        );
      });

      if (renamed.length === 0) {
        return { status: 'pass', message: 'All headings use names parsers recognise.' };
      }

      return {
        status: renamed.length > 2 ? 'error' : 'warn',
        message: `${renamed.length} section${renamed.length === 1 ? '' : 's'} renamed: ${renamed
          .map((key) => resume.meta.sections[key]?.heading)
          .join(', ')}.`,
        fixHint:
          'A parser matches on the heading text. A renamed section is often skipped entirely rather than mislabelled. Rename it under Sections.',
        targets: [panelTarget('sections'), ...renamed],
      };
    },
  },

  {
    id: 'core-sections-present',
    category: 'parseability',
    weight: 3,
    label: 'Core sections',
    evaluate: (resume) => {
      const required: SectionKey[] = ['experience', 'education', 'skills'];
      const missing = required.filter((key) => !isSectionEnabled(resume, key));

      if (missing.length === 0) {
        return { status: 'pass', message: 'Experience, education and skills are all present.' };
      }

      return {
        status: 'error',
        message: `Missing: ${missing.map((key) => SECTION_META[key].defaultHeading).join(', ')}.`,
        fixHint:
          'Most parsers index on these three. A resume without them scores poorly whatever it says. Switch them on under Sections.',
        targets: [panelTarget('sections'), ...missing],
      };
    },
  },

  {
    id: 'text-layer',
    category: 'parseability',
    weight: 2,
    label: 'Selectable text',
    evaluate: () => ({
      status: 'pass',
      message: 'Exported as real text with inline SVG icons — no image-only PDF, no icon-font glyphs.',
    }),
  },
];
