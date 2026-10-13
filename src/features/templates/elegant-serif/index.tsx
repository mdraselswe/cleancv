import { SECTION_KEYS } from '@/constants';

import { SingleColumnLayout } from '../shared/SingleColumnLayout';
import type { TemplateMeta, TemplateProps } from '../types';

import './elegant-serif.css';

export const meta: TemplateMeta = {
  id: 'elegant-serif',
  name: 'Elegant Serif',
  description:
    'Serif headings, hairline rules and plenty of air. Distinctive without costing parse quality.',
  category: 'balanced',
  atsBaseline: 92,
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
  defaultTheme: {
    // Stated for every design: a switch applies it over the current theme, so a
    // design that says nothing would inherit the previous design's text size.
    fontScale: 1,
    accent: '#1f2937',
    font: 'serif',
    density: 'relaxed',
    marginMm: 18,
    photoRadius: 50,
  },
};

export const Template = ({ resume, print }: TemplateProps) => (
  <SingleColumnLayout
    resume={resume}
    meta={meta}
    print={print}
    templateClass="els"
    headingClass="els-heading"
  />
);
