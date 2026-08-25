import { z } from 'zod';

import { LANGUAGE_LEVELS } from '@/constants';

import {
  bulletsSchema,
  dateRangeSchema,
  entryList,
  iconSchema,
  idSchema,
  monthSchema,
  optionalText,
  urlSchema,
} from './primitives';

export const certificationEntrySchema = z.object({
  id: idSchema,
  name: optionalText(160),
  issuer: optionalText(140),
  issued: monthSchema,
  expires: monthSchema,
  credentialId: optionalText(80),
  url: urlSchema,
});

export const trainingEntrySchema = z.object({
  id: idSchema,
  name: optionalText(160),
  provider: optionalText(140),
  date: monthSchema,
  location: optionalText(120),
  description: optionalText(300),
});

export const awardEntrySchema = z.object({
  id: idSchema,
  title: optionalText(160),
  issuer: optionalText(140),
  date: monthSchema,
  description: optionalText(300),
});

/** A standout outcome, given its own callout rather than buried in a role. */
export const achievementEntrySchema = z.object({
  id: idSchema,
  title: optionalText(140),
  icon: iconSchema,
  description: optionalText(400),
});

export const membershipEntrySchema = z.object({
  id: idSchema,
  organization: optionalText(160),
  role: optionalText(100),
  dates: dateRangeSchema,
});

export const volunteeringEntrySchema = z.object({
  id: idSchema,
  role: optionalText(120),
  organization: optionalText(160),
  location: optionalText(120),
  dates: dateRangeSchema,
  bullets: bulletsSchema,
});

export const extracurricularEntrySchema = z.object({
  id: idSchema,
  activity: optionalText(140),
  organization: optionalText(160),
  role: optionalText(100),
  dates: dateRangeSchema,
  description: optionalText(300),
});

export const languageLevelSchema = z.enum(['', ...LANGUAGE_LEVELS]).catch('').default('');

export const languageEntrySchema = z.object({
  id: idSchema,
  name: optionalText(60),
  level: languageLevelSchema,
  note: optionalText(80),
});

export const certificationsSchema = entryList(certificationEntrySchema);
export const trainingSchema = entryList(trainingEntrySchema);
export const awardsSchema = entryList(awardEntrySchema);
export const achievementsSchema = entryList(achievementEntrySchema);
export const membershipsSchema = entryList(membershipEntrySchema);
export const volunteeringSchema = entryList(volunteeringEntrySchema);
export const extracurricularSchema = entryList(extracurricularEntrySchema);
export const languagesSchema = entryList(languageEntrySchema);

export type CertificationEntry = z.infer<typeof certificationEntrySchema>;
export type TrainingEntry = z.infer<typeof trainingEntrySchema>;
export type AwardEntry = z.infer<typeof awardEntrySchema>;
export type AchievementEntry = z.infer<typeof achievementEntrySchema>;
export type MembershipEntry = z.infer<typeof membershipEntrySchema>;
export type VolunteeringEntry = z.infer<typeof volunteeringEntrySchema>;
export type ExtracurricularEntry = z.infer<typeof extracurricularEntrySchema>;
export type LanguageEntry = z.infer<typeof languageEntrySchema>;
