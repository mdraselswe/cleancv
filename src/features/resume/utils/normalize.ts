import {
  DEFAULT_SECTION_ORDER,
  RESUME_SCHEMA_VERSION,
  SECTION_KEYS,
  SECTION_META,
  customSlot,
  type SectionSlot,
} from '@/constants';
import { createId } from '@/lib/id';

import { resumeSchema, type Resume } from '../schema';
import { createEmptyResume } from './factories';

/**
 * Turns anything — a stored blob, an imported JSON file, a resume written by an
 * older build — into a valid Resume, repairing rather than rejecting. A user who
 * imports a slightly wrong file should get their content back, not an error.
 */

/** Merges a partial object over a complete one, one level deep per section. */
const mergeSection = <T extends object>(base: T, incoming: unknown): T => {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return base;

  return { ...base, ...(incoming as Partial<T>) };
};

/** Every list entry needs an id; imported files often lack them. */
const withIds = <T extends { id?: string }>(value: unknown, prefix: string): T[] => {
  if (!Array.isArray(value)) return [];

  return value.map((entry) => ({
    ...(entry as T),
    id: typeof (entry as T)?.id === 'string' && (entry as T).id ? (entry as T).id : createId(prefix),
  }));
};

/**
 * Drops unknown slots and appends anything missing from a stored order.
 *
 * A `custom:` slot survives only while its section exists, and a custom section
 * that lost its slot is put back at the end — the two lists cannot drift apart.
 */
const repairSectionOrder = (value: unknown, customIds: string[]): SectionSlot[] => {
  const known = new Set<string>([...SECTION_KEYS, ...customIds.map(customSlot)]);
  const incoming = Array.isArray(value)
    ? (value.filter(
        (slot): slot is SectionSlot => typeof slot === 'string' && known.has(slot),
      ) as SectionSlot[])
    : [];
  const seen = new Set<string>(incoming);

  return [
    ...incoming,
    ...DEFAULT_SECTION_ORDER.filter((key) => !seen.has(key)),
    ...customIds.map(customSlot).filter((slot) => !seen.has(slot)),
  ];
};

/**
 * Rebuilt key by key rather than merged, so a section added to the app since a
 * document was saved arrives with its default rather than missing. Every field
 * of the setting has to be listed here: one left out is silently reset on the
 * next load, which is indistinguishable from the setting not working.
 */
const repairSectionSettings = (value: unknown): Resume['meta']['sections'] => {
  const incoming = (value ?? {}) as Record<
    string,
    { enabled?: boolean; heading?: string; showIcons?: boolean }
  >;

  return Object.fromEntries(
    SECTION_KEYS.map((key) => [
      key,
      {
        enabled: incoming[key]?.enabled ?? SECTION_META[key].defaultEnabled,
        heading: incoming[key]?.heading ?? '',
        showIcons: incoming[key]?.showIcons ?? true,
      },
    ]),
  ) as Resume['meta']['sections'];
};

export const normalizeResume = (input: unknown): Resume => {
  const base = createEmptyResume();

  if (!input || typeof input !== 'object') return base;

  const raw = input as Record<string, unknown>;
  const customSections = withIds<Resume['customSections'][number]>(raw.customSections, 'cst');

  const candidate: Resume = {
    ...base,
    version: RESUME_SCHEMA_VERSION,

    basics: mergeSection(base.basics, raw.basics),
    contact: {
      ...mergeSection(base.contact, raw.contact),
      links: withIds((raw.contact as Record<string, unknown>)?.links, 'lnk'),
    },
    personal: mergeSection(base.personal, raw.personal),
    summary: mergeSection(base.summary, raw.summary),

    experience: withIds(raw.experience, 'exp'),
    education: withIds(raw.education, 'edu'),
    skills: withIds(raw.skills, 'skl'),
    projects: withIds(raw.projects, 'prj'),

    certifications: withIds(raw.certifications, 'crt'),
    achievements: withIds(raw.achievements, 'ach'),
    awards: withIds(raw.awards, 'awd'),
    training: withIds(raw.training, 'trn'),
    publications: withIds(raw.publications, 'pub'),
    conferences: withIds(raw.conferences, 'cnf'),
    patents: withIds(raw.patents, 'pat'),
    languages: withIds(raw.languages, 'lng'),
    volunteering: withIds(raw.volunteering, 'vol'),
    extracurricular: withIds(raw.extracurricular, 'eca'),
    memberships: withIds(raw.memberships, 'mem'),

    interests: mergeSection(base.interests, raw.interests),
    references: {
      ...mergeSection(base.references, raw.references),
      entries: withIds((raw.references as Record<string, unknown>)?.entries, 'ref'),
    },
    declaration: mergeSection(base.declaration, raw.declaration),
    signature: mergeSection(base.signature, raw.signature),

    customSections,

    meta: {
      ...mergeSection(base.meta, raw.meta),
      theme: mergeSection(base.meta.theme, (raw.meta as Record<string, unknown>)?.theme),
      sectionOrder: repairSectionOrder(
        (raw.meta as Record<string, unknown>)?.sectionOrder,
        customSections.map((section) => section.id),
      ),
      sections: repairSectionSettings((raw.meta as Record<string, unknown>)?.sections),
    },
  };

  const parsed = resumeSchema.safeParse(candidate);

  return parsed.success ? parsed.data : base;
};

export interface ImportResult {
  ok: boolean;
  resume: Resume;
  error?: string;
}

export const parseResumeFile = (contents: string): ImportResult => {
  try {
    const parsed: unknown = JSON.parse(contents);

    return { ok: true, resume: normalizeResume(parsed) };
  } catch {
    return {
      ok: false,
      resume: createEmptyResume(),
      error: 'That file is not valid JSON. Export a backup from this app to see the expected shape.',
    };
  }
};

export const serializeResume = (resume: Resume): string => JSON.stringify(resume, null, 2);
