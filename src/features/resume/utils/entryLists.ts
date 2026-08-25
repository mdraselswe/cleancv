import type { Resume } from '../schema';
import {
  createAchievementEntry,
  createAwardEntry,
  createCertificationEntry,
  createConferenceEntry,
  createEducationEntry,
  createExperienceEntry,
  createExtracurricularEntry,
  createLanguageEntry,
  createMembershipEntry,
  createPatentEntry,
  createProjectEntry,
  createPublicationEntry,
  createSkillGroup,
  createTrainingEntry,
  createVolunteeringEntry,
} from './factories';

/**
 * The resume fields that hold a flat list of identified entries.
 *
 * Every list section shares one set of add / update / remove / move actions, so
 * adding a section means adding a row here rather than a new slice of the store.
 * `references` is deliberately absent: its entries are nested under a mode flag.
 */
export const ENTRY_LIST_KEYS = [
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'awards',
  'training',
  'publications',
  'conferences',
  'patents',
  'languages',
  'volunteering',
  'extracurricular',
  'memberships',
] as const;

export type EntryListKey = (typeof ENTRY_LIST_KEYS)[number];

/** The entry type stored under a given list key. */
export type EntryOf<K extends EntryListKey> = Resume[K][number];

export const ENTRY_FACTORY: { [K in EntryListKey]: () => EntryOf<K> } = {
  experience: createExperienceEntry,
  education: createEducationEntry,
  skills: () => createSkillGroup(),
  projects: createProjectEntry,
  certifications: createCertificationEntry,
  achievements: createAchievementEntry,
  awards: createAwardEntry,
  training: createTrainingEntry,
  publications: createPublicationEntry,
  conferences: createConferenceEntry,
  patents: createPatentEntry,
  languages: createLanguageEntry,
  volunteering: createVolunteeringEntry,
  extracurricular: createExtracurricularEntry,
  memberships: createMembershipEntry,
};


export const isEntryListKey = (value: string): value is EntryListKey =>
  (ENTRY_LIST_KEYS as readonly string[]).includes(value);
