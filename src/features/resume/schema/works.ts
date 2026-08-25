import { z } from 'zod';

import {
  bulletsSchema,
  dateRangeSchema,
  entryList,
  idSchema,
  monthSchema,
  optionalText,
  tagsSchema,
  urlSchema,
} from './primitives';

export const projectEntrySchema = z.object({
  id: idSchema,
  name: optionalText(120),
  subtitle: optionalText(160),
  role: optionalText(80),
  dates: dateRangeSchema,
  liveUrl: urlSchema,
  sourceUrl: urlSchema,
  tech: tagsSchema,
  bullets: bulletsSchema,
});

export const publicationEntrySchema = z.object({
  id: idSchema,
  title: optionalText(200),
  publisher: optionalText(140),
  authors: optionalText(200),
  date: monthSchema,
  url: urlSchema,
  description: optionalText(300),
});

export const patentEntrySchema = z.object({
  id: idSchema,
  title: optionalText(200),
  number: optionalText(60),
  status: optionalText(40),
  office: optionalText(120),
  date: monthSchema,
  url: urlSchema,
  description: optionalText(300),
});

export const conferenceEntrySchema = z.object({
  id: idSchema,
  title: optionalText(200),
  event: optionalText(140),
  role: optionalText(60),
  location: optionalText(120),
  date: monthSchema,
  url: urlSchema,
  description: optionalText(300),
});

export const projectsSchema = entryList(projectEntrySchema);
export const publicationsSchema = entryList(publicationEntrySchema);
export const patentsSchema = entryList(patentEntrySchema);
export const conferencesSchema = entryList(conferenceEntrySchema);

export type ProjectEntry = z.infer<typeof projectEntrySchema>;
export type PublicationEntry = z.infer<typeof publicationEntrySchema>;
export type PatentEntry = z.infer<typeof patentEntrySchema>;
export type ConferenceEntry = z.infer<typeof conferenceEntrySchema>;
