import { z } from 'zod';

import { EMPLOYMENT_TYPES, LIMITS, PROFICIENCY_LEVELS } from '@/constants';

import {
  bulletsSchema,
  dateRangeSchema,
  entryList,
  iconSchema,
  idSchema,
  optionalText,
  tagsSchema,
} from './primitives';

export const employmentTypeSchema = z.enum(['', ...EMPLOYMENT_TYPES]).catch('').default('');

export const experienceEntrySchema = z.object({
  id: idSchema,
  role: optionalText(120),
  company: optionalText(120),
  /** One line on what the company does; helps a recruiter who has not heard of it. */
  companyNote: optionalText(240),
  location: optionalText(120),
  employmentType: employmentTypeSchema,
  dates: dateRangeSchema,
  bullets: bulletsSchema,
  /** Rendered as a trailing tech line; also feeds keyword matching. */
  tech: tagsSchema,
});

export const educationEntrySchema = z.object({
  id: idSchema,
  degree: optionalText(140),
  major: optionalText(120),
  institute: optionalText(160),
  board: optionalText(120),
  location: optionalText(120),
  dates: dateRangeSchema,
  /** Free text so 'CGPA 3.20 / 4.00', 'First Class' and 'GPA 5.00' all fit. */
  result: optionalText(60),
  resultScale: optionalText(20),
  thesis: optionalText(240),
  coursework: tagsSchema,
  bullets: bulletsSchema,
});

export const experienceSchema = entryList(experienceEntrySchema);
export const educationSchema = entryList(educationEntrySchema);

export const proficiencySchema = z.enum(['', ...PROFICIENCY_LEVELS]).catch('').default('');

/**
 * A named group of skills, e.g. Frontend / Backend / Leadership.
 *
 * Proficiency is per group rather than per skill. Per-skill ratings turn the
 * items into objects, which forces the printed list out of the plain
 * comma-separated form parsers read best — and a self-assigned number against
 * twenty individual skills tells a reader less than one honest label per group.
 */
export const skillGroupSchema = z.object({
  id: idSchema,
  category: optionalText(60),
  level: proficiencySchema,
  icon: iconSchema,
  items: tagsSchema,
});

export const skillsSchema = z
  .array(skillGroupSchema)
  .max(LIMITS.skillGroups)
  .catch([])
  .default([]);

export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
