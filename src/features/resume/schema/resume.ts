import { z } from 'zod';

import { RESUME_SCHEMA_VERSION } from '@/constants';

import {
  declarationSchema,
  interestsSchema,
  referencesSchema,
  signatureSchema,
  summarySchema,
} from './closing';
import {
  achievementsSchema,
  awardsSchema,
  certificationsSchema,
  extracurricularSchema,
  languagesSchema,
  membershipsSchema,
  trainingSchema,
  volunteeringSchema,
} from './credentials';
import { customSectionsSchema } from './custom';
import { educationSchema, experienceSchema, skillsSchema } from './history';
import { basicsSchema, contactSchema, personalInfoSchema } from './identity';
import { resumeMetaSchema } from './meta';
import { conferencesSchema, patentsSchema, projectsSchema, publicationsSchema } from './works';

/**
 * The whole document.
 *
 * Every branch is `.catch()`-guarded so a resume saved under an older shape
 * degrades field-by-field instead of failing to load. See ADR-006.
 */
export const resumeSchema = z.object({
  version: z.number().int().catch(RESUME_SCHEMA_VERSION).default(RESUME_SCHEMA_VERSION),

  basics: basicsSchema,
  contact: contactSchema,
  personal: personalInfoSchema,
  summary: summarySchema,

  experience: experienceSchema,
  education: educationSchema,
  skills: skillsSchema,
  projects: projectsSchema,

  certifications: certificationsSchema,
  achievements: achievementsSchema,
  awards: awardsSchema,
  training: trainingSchema,
  publications: publicationsSchema,
  conferences: conferencesSchema,
  patents: patentsSchema,
  languages: languagesSchema,
  volunteering: volunteeringSchema,
  extracurricular: extracurricularSchema,
  memberships: membershipsSchema,

  interests: interestsSchema,
  references: referencesSchema,
  declaration: declarationSchema,
  signature: signatureSchema,

  /** User-invented sections, positioned through `meta.sectionOrder`. */
  customSections: customSectionsSchema,

  meta: resumeMetaSchema,
});

export type Resume = z.infer<typeof resumeSchema>;

/** Keys on Resume that hold section content, excluding meta and version. */
export type ResumeContentKey = Exclude<keyof Resume, 'version' | 'meta'>;
