import { z } from 'zod';

import { LANGUAGE_LEVELS } from '@/constants';
import {
  createCertificationEntry,
  createEducationEntry,
  createExperienceEntry,
  createLanguageEntry,
  createProjectEntry,
  createSkillGroup,
} from '@/features/resume';

import type { ParsedResume } from '../types';

/**
 * The contract with whatever model the user pointed at.
 *
 * Deliberately flatter and smaller than the resume schema: fewer fields for a
 * model to hallucinate, and dates as plain `YYYY-MM` strings it can produce
 * without being told about the editor's month picker. Everything is optional
 * and every branch is `.catch()`-guarded, because a model that returns one
 * malformed entry must not cost the user the other twenty.
 */

const text = z.string().trim().max(500).catch('').default('');
const month = z
  .string()
  .trim()
  .regex(/^(\d{4}-(0[1-9]|1[0-2]))?$/)
  .catch('')
  .default('');

const list = <T extends z.ZodTypeAny>(entry: T) => z.array(entry).max(40).catch([]).default([]);

const dates = z
  .object({ start: month, end: month, current: z.boolean().catch(false).default(false) })
  .catch({ start: '', end: '', current: false })
  .default({ start: '', end: '', current: false });

export const smartResponseSchema = z.object({
  fullName: text,
  headline: text,
  email: text,
  phone: text,
  location: text,
  linkedin: text,
  github: text,
  portfolio: text,
  summary: z.string().trim().max(3000).catch('').default(''),
  experience: list(
    z.object({
      role: text,
      company: text,
      location: text,
      dates,
      bullets: list(z.string().trim().max(500)),
    }),
  ),
  education: list(
    z.object({
      degree: text,
      institute: text,
      dates,
      result: text,
    }),
  ),
  skills: list(z.object({ category: text, items: list(z.string().trim().max(60)) })),
  projects: list(
    z.object({
      name: text,
      subtitle: text,
      url: text,
      bullets: list(z.string().trim().max(500)),
    }),
  ),
  certifications: list(z.object({ name: text, issuer: text })),
  languages: list(z.object({ name: text, level: text })),
});

export type SmartResponse = z.infer<typeof smartResponseSchema>;

/**
 * The shape given to the model.
 *
 * Written out rather than generated from the schema: the comments are the
 * instructions that matter, and a generated schema loses them.
 */
export const SMART_JSON_SHAPE = `{
  "fullName": "", "headline": "", "email": "", "phone": "", "location": "",
  "linkedin": "", "github": "", "portfolio": "",
  "summary": "",
  "experience": [{ "role": "", "company": "", "location": "",
    "dates": { "start": "YYYY-MM", "end": "YYYY-MM", "current": false },
    "bullets": [""] }],
  "education": [{ "degree": "", "institute": "",
    "dates": { "start": "YYYY-MM", "end": "YYYY-MM", "current": false }, "result": "" }],
  "skills": [{ "category": "", "items": [""] }],
  "projects": [{ "name": "", "subtitle": "", "url": "", "bullets": [""] }],
  "certifications": [{ "name": "", "issuer": "" }],
  "languages": [{ "name": "", "level": "native|fluent|professional|conversational|basic" }]
}`;

export const SMART_SYSTEM_PROMPT = `You extract structured data from a CV or resume.

Return ONLY a JSON object in exactly this shape, with no prose and no markdown fence:
${SMART_JSON_SHAPE}

Rules:
- Copy text as written. Do not rewrite, summarise, improve or translate anything.
- Never invent a value. If something is not in the document, use "" or [].
- Dates are "YYYY-MM". A month you cannot determine is "". An ongoing role sets "current": true and leaves "end" as "".
- Keep every bullet of a role as its own string, without its bullet character.
- "skills" groups only if the document groups them; otherwise use one group with an empty category.
- If the document is not a CV, return the shape with everything empty.`;

/** Maps the model's answer onto the app's own entry types. */
export const toParsedResume = (response: SmartResponse): ParsedResume => ({
  basics: { fullName: response.fullName, headline: response.headline },
  contact: {
    email: response.email,
    phone: response.phone,
    location: response.location,
    linkedin: response.linkedin,
    github: response.github,
    portfolio: response.portfolio,
  },
  summary: { text: response.summary },
  experience: response.experience.map((entry) => ({
    ...createExperienceEntry(),
    role: entry.role,
    company: entry.company,
    location: entry.location,
    dates: entry.dates,
    bullets: entry.bullets,
  })),
  education: response.education.map((entry) => ({
    ...createEducationEntry(),
    degree: entry.degree,
    institute: entry.institute,
    dates: entry.dates,
    result: entry.result,
  })),
  skills: response.skills.map((group) => ({
    ...createSkillGroup(group.category),
    items: group.items,
  })),
  projects: response.projects.map((entry) => ({
    ...createProjectEntry(),
    name: entry.name,
    subtitle: entry.subtitle,
    liveUrl: entry.url,
    bullets: entry.bullets,
  })),
  certifications: response.certifications.map((entry) => ({
    ...createCertificationEntry(),
    name: entry.name,
    issuer: entry.issuer,
  })),
  languages: response.languages.map((entry) => ({
    ...createLanguageEntry(),
    name: entry.name,
    level:
      LANGUAGE_LEVELS.find((level) => entry.level.toLowerCase().startsWith(level)) ?? '',
  })),
});
