import { SECTION_KEYS } from '@/constants';

import { SingleColumnLayout } from '../shared/SingleColumnLayout';
import type { TemplateMeta, TemplateProps } from '../types';

import './academic-cv.css';

export const meta: TemplateMeta = {
  id: 'academic-cv',
  name: 'একাডেমিক / সরকারি CV',
  description:
    'মাঝখানে নাম-পরিচয়, ব্যক্তিগত তথ্যের টেবিল, ঘোষণা ও সই। সরকারি ও একাডেমিক চাকরিতে যে আনুষ্ঠানিক ধাঁচ আশা করা হয়।',
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
    // Stated for every design: a switch applies it over the current theme, so a
    // design that says nothing would inherit the previous design's text size.
    fontScale: 1,
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
