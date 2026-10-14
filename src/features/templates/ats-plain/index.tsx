import { SECTION_KEYS } from '@/constants';

import { SingleColumnLayout } from '../shared/SingleColumnLayout';
import type { TemplateMeta, TemplateProps } from '../types';

import './ats-plain.css';

export const meta: TemplateMeta = {
  id: 'ats-plain',
  name: 'ATS সাদামাটা',
  description:
    'এক কলাম, সাদার ওপর কালো, কোনো গ্রাফিক নেই। জব পোর্টালে আপলোডের জন্য সবচেয়ে নিরাপদ।',
  category: 'ats',
  atsBaseline: 100,
  supports: {
    // A photo is the single biggest parse hazard, so this design refuses one.
    photo: false,
    signature: true,
    accentColor: false,
    sidebar: false,
    skillBars: false,
    icons: false,
    entryMarkers: false,
    columns: 1,
  },
  supportedSections: SECTION_KEYS,
  // Every design states its margin: without one, switching to it silently
  // keeps whatever the previous template chose.
  defaultTheme: { fontScale: 1, font: 'sans', density: 'compact', accent: '#000000', marginMm: 14 },
};

export const Template = ({ resume, print }: TemplateProps) => (
  <SingleColumnLayout
    resume={resume}
    meta={meta}
    print={print}
    templateClass="atp"
    headingClass="atp-heading"
    withContactIcons={false}
  />
);
