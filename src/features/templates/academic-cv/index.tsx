import { SECTION_KEYS } from '@/constants';

import { SingleColumnLayout } from '../shared/SingleColumnLayout';
import type { TemplateMeta, TemplateProps } from '../types';

import './academic-cv.css';

export const meta: TemplateMeta = {
  id: 'academic-cv',
  name: 'Academic / Govt CV',
  description:
    'Centred identity, personal-details table, declaration and signature. The formal shape expected for public-sector and academic posts.',
  category: 'balanced',
  atsBaseline: 90,
  supports: {
    photo: true,
    signature: true,
    accentColor: true,
    sidebar: false,
    skillBars: false,
    icons: true,
    entryMarkers: true,
    columns: 1,
  },
  supportedSections: SECTION_KEYS,
  defaultTheme: {
    accent: '#1e3a5f',
    font: 'sans',
    density: 'normal',
    marginMm: 16,
    photoRadius: 0,
  },
};

export const Template = ({ resume, print }: TemplateProps) => (
  <SingleColumnLayout
    resume={resume}
    meta={meta}
    print={print}
    templateClass="acv"
    headingClass="acv-heading"
  />
);
