/** Enumerated choices offered by editor form controls. */

export const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];

export const PROFICIENCY_LABEL: Record<ProficiencyLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

/** 0-1 fill used when a template renders proficiency as a bar or dots. */
export const PROFICIENCY_FILL: Record<ProficiencyLevel, number> = {
  beginner: 0.25,
  intermediate: 0.5,
  advanced: 0.75,
  expert: 1,
};

export const LANGUAGE_LEVELS = [
  'native',
  'fluent',
  'professional',
  'conversational',
  'basic',
] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export const LANGUAGE_LEVEL_LABEL: Record<LanguageLevel, string> = {
  native: 'Native',
  fluent: 'Fluent',
  professional: 'Professional working',
  conversational: 'Conversational',
  basic: 'Basic',
};

export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'freelance',
  'internship',
  'remote',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  freelance: 'Freelance',
  internship: 'Internship',
  remote: 'Remote',
};

export const SUMMARY_MODES = ['summary', 'objective'] as const;
export type SummaryMode = (typeof SUMMARY_MODES)[number];

export const SUMMARY_MODE_LABEL: Record<SummaryMode, string> = {
  summary: 'Professional Summary',
  objective: 'Career Objective',
};

export const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const SIGNATURE_MODES = ['typed', 'image'] as const;
export type SignatureMode = (typeof SIGNATURE_MODES)[number];

export const REFERENCE_MODES = ['listed', 'on-request'] as const;
export type ReferenceMode = (typeof REFERENCE_MODES)[number];

export const REFERENCE_MODE_LABEL: Record<ReferenceMode, string> = {
  listed: 'List referees',
  'on-request': 'Available upon request',
};

export const ON_REQUEST_TEXT = 'References available upon request.';

export const DEFAULT_DECLARATION_TEXT =
  'I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief.';

export const SKILL_GROUP_SUGGESTIONS = [
  'Frontend',
  'Backend',
  'State & API',
  'Databases',
  'DevOps & Cloud',
  'AI',
  'Testing',
  'Tools',
  'Leadership',
  'Design',
] as const;
