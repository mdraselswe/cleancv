import {
  AUTO_ICON,
  DEFAULT_ACCENT,
  DEFAULT_DECLARATION_TEXT,
  DEFAULT_SECTION_ORDER,
  DEFAULT_TEMPLATE_ID,
  DEFAULT_TEMPLATE_FONT_SCALE,
  PAGE_MARGIN_MM,
  PHOTO_FRAME,
  PHOTO_RADIUS,
  RESUME_SCHEMA_VERSION,
} from '@/constants';
import { createId } from '@/lib/id';

import { createDefaultSectionSettings } from '../schema/meta';
import type {
  AchievementEntry,
  AwardEntry,
  CertificationEntry,
  ConferenceEntry,
  CustomLink,
  CustomSection,
  DateRange,
  EducationEntry,
  ExperienceEntry,
  ExtracurricularEntry,
  LanguageEntry,
  MembershipEntry,
  PatentEntry,
  ProjectEntry,
  PublicationEntry,
  ReferenceEntry,
  Resume,
  SkillGroup,
  TrainingEntry,
  VolunteeringEntry,
} from '../schema';

/**
 * Blank-entry factories.
 *
 * Every list section adds rows through one of these, so a new row always has
 * the complete field set the schema expects — no partially-shaped objects reach
 * the store or the templates.
 */

const emptyRange = (): DateRange => ({ start: '', end: '', current: false });

export const createExperienceEntry = (): ExperienceEntry => ({
  id: createId('exp'),
  role: '',
  company: '',
  companyNote: '',
  location: '',
  employmentType: '',
  dates: emptyRange(),
  bullets: [''],
  tech: [],
});

export const createEducationEntry = (): EducationEntry => ({
  id: createId('edu'),
  degree: '',
  major: '',
  institute: '',
  board: '',
  location: '',
  dates: emptyRange(),
  result: '',
  resultScale: '',
  thesis: '',
  coursework: [],
  bullets: [],
});

export const createSkillGroup = (category = ''): SkillGroup => ({
  id: createId('skl'),
  category,
  level: '',
  icon: AUTO_ICON,
  items: [],
});

export const createProjectEntry = (): ProjectEntry => ({
  id: createId('prj'),
  name: '',
  subtitle: '',
  role: '',
  dates: emptyRange(),
  liveUrl: '',
  sourceUrl: '',
  tech: [],
  bullets: [''],
});

export const createCertificationEntry = (): CertificationEntry => ({
  id: createId('crt'),
  name: '',
  issuer: '',
  issued: '',
  expires: '',
  credentialId: '',
  url: '',
});

export const createAchievementEntry = (): AchievementEntry => ({
  id: createId('ach'),
  title: '',
  icon: AUTO_ICON,
  description: '',
});

export const createAwardEntry = (): AwardEntry => ({
  id: createId('awd'),
  title: '',
  issuer: '',
  date: '',
  description: '',
});

export const createTrainingEntry = (): TrainingEntry => ({
  id: createId('trn'),
  name: '',
  provider: '',
  date: '',
  location: '',
  description: '',
});

export const createPublicationEntry = (): PublicationEntry => ({
  id: createId('pub'),
  title: '',
  publisher: '',
  authors: '',
  date: '',
  url: '',
  description: '',
});

export const createConferenceEntry = (): ConferenceEntry => ({
  id: createId('cnf'),
  title: '',
  event: '',
  role: '',
  location: '',
  date: '',
  url: '',
  description: '',
});

export const createPatentEntry = (): PatentEntry => ({
  id: createId('pat'),
  title: '',
  number: '',
  status: '',
  office: '',
  date: '',
  url: '',
  description: '',
});

export const createLanguageEntry = (): LanguageEntry => ({
  id: createId('lng'),
  name: '',
  level: '',
  note: '',
});

export const createVolunteeringEntry = (): VolunteeringEntry => ({
  id: createId('vol'),
  role: '',
  organization: '',
  location: '',
  dates: emptyRange(),
  bullets: [''],
});

export const createExtracurricularEntry = (): ExtracurricularEntry => ({
  id: createId('eca'),
  activity: '',
  organization: '',
  role: '',
  dates: emptyRange(),
  description: '',
});

export const createMembershipEntry = (): MembershipEntry => ({
  id: createId('mem'),
  organization: '',
  role: '',
  dates: emptyRange(),
});

export const createReferenceEntry = (): ReferenceEntry => ({
  id: createId('ref'),
  name: '',
  designation: '',
  organization: '',
  relationship: '',
  email: '',
  phone: '',
});

export const createCustomLink = (): CustomLink => ({
  id: createId('lnk'),
  label: '',
  url: '',
});

export const createCustomSection = (): CustomSection => ({
  id: createId('cst'),
  heading: '',
  layout: 'bullets',
  text: '',
  bullets: [''],
  enabled: true,
});

export const createEmptyResume = (): Resume => ({
  version: RESUME_SCHEMA_VERSION,

  basics: {
    fullName: '',
    headline: '',
    photo: '',
    photoFrame: {
      x: PHOTO_FRAME.position.default,
      y: PHOTO_FRAME.position.default,
      zoom: PHOTO_FRAME.zoom.default,
    },
  },
  contact: {
    phone: '',
    altPhone: '',
    email: '',
    location: '',
    presentAddress: '',
    permanentAddress: '',
    linkedin: '',
    github: '',
    portfolio: '',
    links: [],
  },
  personal: {
    dateOfBirth: '',
    gender: '',
    nationality: '',
    maritalStatus: '',
    religion: '',
    bloodGroup: '',
    fatherName: '',
    motherName: '',
    nationalId: '',
    passportNumber: '',
  },
  summary: { mode: 'summary', text: '' },

  experience: [],
  education: [],
  skills: [],
  projects: [],

  certifications: [],
  achievements: [],
  awards: [],
  training: [],
  publications: [],
  conferences: [],
  patents: [],
  languages: [],
  volunteering: [],
  extracurricular: [],
  memberships: [],

  interests: { items: [] },
  references: { mode: 'on-request', entries: [] },
  declaration: { text: DEFAULT_DECLARATION_TEXT, place: '', date: '', showDate: true },
  signature: { mode: 'typed', typedName: '', image: '', caption: '' },

  customSections: [],

  meta: {
    templateId: DEFAULT_TEMPLATE_ID,
    theme: {
      accent: DEFAULT_ACCENT,
      font: 'sans',
      density: 'normal',
      fontScale: DEFAULT_TEMPLATE_FONT_SCALE,
      marginMm: PAGE_MARGIN_MM.default,
      showPhoto: false,
      photoRadius: PHOTO_RADIUS.default,
    },
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sections: createDefaultSectionSettings(),
    columns: {},
    targetJobDescription: '',
    documentName: '',
  },
});
