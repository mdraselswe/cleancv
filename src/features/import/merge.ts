import { normalizeResume, type Resume } from '@/features/resume';
import { isBlank } from '@/lib/text';

import type { ParsedResume } from './types';

/**
 * Turning a parse into an edit.
 *
 * Nothing here writes to the resume directly. The review screen decides which
 * groups the user accepted and this applies exactly those — because a parser
 * that silently overwrites a finished CV with its own worse guess is a far
 * more expensive mistake than one that misses a field.
 */

export type MergeGroup =
  | 'basics'
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages';

export const MERGE_GROUPS: MergeGroup[] = [
  'basics',
  'contact',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
];

export const MERGE_GROUP_LABEL: Record<MergeGroup, string> = {
  basics: 'Name and headline',
  contact: 'Contact details',
  summary: 'Summary',
  experience: 'Work experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
};

/** How a list group joins what is already in the document. */
export type ListStrategy = 'replace' | 'append';

export interface MergePlan {
  accepted: Set<MergeGroup>;
  strategy: ListStrategy;
}

const LIST_GROUPS = new Set<MergeGroup>([
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
]);

/** Fields with a value, so an empty parse of a field leaves the original alone. */
const withoutBlanks = <T extends object>(patch: Partial<T>): Partial<T> =>
  Object.fromEntries(
    Object.entries(patch).filter(([, value]) => typeof value !== 'string' || !isBlank(value)),
  ) as Partial<T>;

/** How much a group actually found — drives the review screen's ordering. */
export const groupSize = (parsed: ParsedResume, group: MergeGroup): number => {
  const value = parsed[group];

  if (Array.isArray(value)) return value.length;
  if (group === 'summary') return isBlank(parsed.summary?.text ?? '') ? 0 : 1;
  if (value && typeof value === 'object') {
    return Object.values(value).filter((entry) => !isBlank(String(entry ?? ''))).length;
  }

  return 0;
};

/** Groups the parser found something for, in a sensible review order. */
export const foundGroups = (parsed: ParsedResume): MergeGroup[] =>
  MERGE_GROUPS.filter((group) => groupSize(parsed, group) > 0);

export const applyImport = (
  resume: Resume,
  parsed: ParsedResume,
  plan: MergePlan,
): Resume => {
  const next: Resume = structuredClone(resume);
  const accepted = (group: MergeGroup) => plan.accepted.has(group);

  if (accepted('basics') && parsed.basics) {
    next.basics = { ...next.basics, ...withoutBlanks(parsed.basics) };
  }

  if (accepted('contact') && parsed.contact) {
    next.contact = { ...next.contact, ...withoutBlanks(parsed.contact) };
  }

  if (accepted('summary') && parsed.summary?.text) {
    next.summary = { ...next.summary, text: parsed.summary.text };
  }

  for (const group of LIST_GROUPS) {
    if (!accepted(group)) continue;

    const incoming = parsed[group];
    if (!Array.isArray(incoming) || incoming.length === 0) continue;

    const existing = next[group] as unknown[];
    (next[group] as unknown[]) =
      plan.strategy === 'append' ? [...existing, ...incoming] : [...incoming];
  }

  // Everything from here on has been through the schema, ids included.
  return normalizeResume(next);
};
