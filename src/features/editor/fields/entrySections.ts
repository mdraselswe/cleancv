import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABEL,
  LANGUAGE_LEVELS,
  LANGUAGE_LEVEL_LABEL,
  LIMITS,
  PROFICIENCY_LABEL,
  PROFICIENCY_LEVELS,
  SKILL_GROUP_SUGGESTIONS,
} from '@/constants';
import type { EntryListKey } from '@/features/resume';

import type { EntrySectionConfig } from './types';

/**
 * Form definitions for every repeatable section.
 *
 * This file is the whole difference between a "Work Experience" form and a
 * "Patents" form. Everything else — add, remove, reorder, collapse, validation,
 * store wiring — is shared.
 */

const employmentOptions = EMPLOYMENT_TYPES.map((value) => ({
  value,
  label: EMPLOYMENT_TYPE_LABEL[value],
}));

const languageLevelOptions = LANGUAGE_LEVELS.map((value) => ({
  value,
  label: LANGUAGE_LEVEL_LABEL[value],
}));

const proficiencyOptions = PROFICIENCY_LEVELS.map((value) => ({
  value,
  label: PROFICIENCY_LABEL[value],
}));

export const ENTRY_SECTIONS: Record<EntryListKey, EntrySectionConfig> = {
  experience: {
    titleKey: 'role',
    subtitleKey: 'company',
    addLabel: 'Add role',
    emptyTitle: 'No roles yet',
    emptyDescription: 'Add your most recent position first — recruiters read top-down.',
    fields: [
      { kind: 'text', key: 'role', label: 'Job title', placeholder: 'Senior Software Engineer' },
      { kind: 'text', key: 'company', label: 'Company', placeholder: 'Shikho Technologies' },
      { kind: 'text', key: 'location', label: 'Location', placeholder: 'Dhaka, Bangladesh' },
      {
        kind: 'select',
        key: 'employmentType',
        label: 'Employment type',
        options: employmentOptions,
        placeholderOption: 'Not specified',
      },
      { kind: 'dateRange', key: 'dates', label: 'Dates' },
      {
        kind: 'text',
        key: 'companyNote',
        label: 'What the company does',
        span: 2,
        placeholder: 'A technology company focused on digital learning.',
        hint: 'One line. Worth adding when the name alone will not mean anything abroad.',
      },
      {
        kind: 'bullets',
        key: 'bullets',
        label: 'Achievements',
        hint: 'Verb first, outcome second, number third.',
      },
      { kind: 'tags', key: 'tech', label: 'Tech used', placeholder: 'Next.js, GraphQL' },
    ],
  },

  education: {
    titleKey: 'degree',
    subtitleKey: 'institute',
    addLabel: 'Add qualification',
    emptyTitle: 'No education yet',
    emptyDescription: 'List your highest qualification first.',
    fields: [
      { kind: 'text', key: 'degree', label: 'Degree', placeholder: 'B.Sc. in Software Engineering' },
      { kind: 'text', key: 'major', label: 'Major', placeholder: 'Software Engineering' },
      { kind: 'text', key: 'institute', label: 'Institution', placeholder: 'Daffodil International University' },
      { kind: 'text', key: 'board', label: 'Board / University', placeholder: 'Optional' },
      { kind: 'text', key: 'location', label: 'Location', placeholder: 'Dhaka, Bangladesh' },
      { kind: 'text', key: 'result', label: 'Result', placeholder: 'CGPA 3.20' },
      { kind: 'text', key: 'resultScale', label: 'Out of', placeholder: '4.00' },
      { kind: 'dateRange', key: 'dates', label: 'Dates' },
      { kind: 'text', key: 'thesis', label: 'Thesis', span: 2, placeholder: 'Optional' },
      { kind: 'tags', key: 'coursework', label: 'Relevant coursework' },
      { kind: 'bullets', key: 'bullets', label: 'Notes', max: 4 },
    ],
  },

  skills: {
    titleKey: 'category',
    addLabel: 'Add skill group',
    emptyTitle: 'No skills yet',
    emptyDescription: 'Group skills by area so a reader can scan for what they need.',
    fields: [
      {
        kind: 'text',
        key: 'category',
        label: 'Group name',
        placeholder: 'Frontend',
        hint: `Suggestions: ${SKILL_GROUP_SUGGESTIONS.slice(0, 5).join(', ')}`,
      },
      {
        kind: 'select',
        key: 'level',
        label: 'Proficiency',
        options: proficiencyOptions,
        placeholderOption: 'Not shown',
        hint: 'Optional. Shown as a meter on creative templates, as a label elsewhere.',
      },
      {
        kind: 'icon',
        key: 'icon',
        fromKey: 'category',
        label: 'Icon',
        hint: 'Drawn by templates with an icon gutter. Automatic reads the group name.',
      },
      {
        kind: 'tags',
        key: 'items',
        label: 'Skills',
        max: LIMITS.skillsPerGroup,
        placeholder: 'React.js, Next.js, TypeScript',
      },
    ],
  },

  projects: {
    titleKey: 'name',
    subtitleKey: 'subtitle',
    addLabel: 'Add project',
    emptyTitle: 'No projects yet',
    emptyDescription: 'Projects carry weight when your job history is short.',
    fields: [
      { kind: 'text', key: 'name', label: 'Project name', placeholder: 'Blood Reach' },
      { kind: 'text', key: 'role', label: 'Your role', placeholder: 'Optional' },
      { kind: 'text', key: 'subtitle', label: 'One-line description', span: 2, placeholder: 'Emergency blood donation connector' },
      { kind: 'text', key: 'liveUrl', label: 'Live link', type: 'url', placeholder: 'https://…' },
      { kind: 'text', key: 'sourceUrl', label: 'Source link', type: 'url', placeholder: 'https://…' },
      { kind: 'dateRange', key: 'dates', label: 'Dates' },
      { kind: 'bullets', key: 'bullets', label: 'What it achieved' },
      { kind: 'tags', key: 'tech', label: 'Tech used' },
    ],
  },

  certifications: {
    titleKey: 'name',
    subtitleKey: 'issuer',
    addLabel: 'Add certification',
    emptyTitle: 'No certifications yet',
    emptyDescription: 'Add credentials with an issuer and a date.',
    fields: [
      { kind: 'text', key: 'name', label: 'Certification', span: 2, placeholder: 'JavaScript Essential Training' },
      { kind: 'text', key: 'issuer', label: 'Issuer', placeholder: 'LinkedIn Learning' },
      { kind: 'text', key: 'credentialId', label: 'Credential ID', placeholder: 'Optional' },
      { kind: 'month', key: 'issued', label: 'Issued' },
      { kind: 'month', key: 'expires', label: 'Expires' },
      { kind: 'text', key: 'url', label: 'Verification link', span: 2, type: 'url' },
    ],
  },

  achievements: {
    titleKey: 'title',
    addLabel: 'Add achievement',
    emptyTitle: 'No achievements yet',
    emptyDescription: 'Pull out the two or three outcomes you want read first.',
    fields: [
      { kind: 'text', key: 'title', label: 'Title', span: 2, placeholder: 'Strategic Project Leadership' },
      {
        kind: 'icon',
        key: 'icon',
        fromKey: 'title',
        label: 'Icon',
        hint: 'Drawn by templates with an icon gutter. Automatic reads the title.',
      },
      { kind: 'textarea', key: 'description', label: 'What you did', max: 400, rows: 3 },
    ],
  },

  awards: {
    titleKey: 'title',
    subtitleKey: 'issuer',
    addLabel: 'Add award',
    emptyTitle: 'No awards yet',
    emptyDescription: 'Prizes, scholarships and formal recognition.',
    fields: [
      { kind: 'text', key: 'title', label: 'Award', span: 2 },
      { kind: 'text', key: 'issuer', label: 'Awarded by' },
      { kind: 'month', key: 'date', label: 'Date' },
      { kind: 'textarea', key: 'description', label: 'Description', max: 300, rows: 2 },
    ],
  },

  training: {
    titleKey: 'name',
    subtitleKey: 'provider',
    addLabel: 'Add training',
    emptyTitle: 'No training yet',
    emptyDescription: 'Courses and workshops that are not formal certifications.',
    fields: [
      { kind: 'text', key: 'name', label: 'Course or workshop', span: 2 },
      { kind: 'text', key: 'provider', label: 'Provider' },
      { kind: 'text', key: 'location', label: 'Location' },
      { kind: 'month', key: 'date', label: 'Date' },
      { kind: 'textarea', key: 'description', label: 'Description', max: 300, rows: 2 },
    ],
  },

  publications: {
    titleKey: 'title',
    subtitleKey: 'publisher',
    addLabel: 'Add publication',
    emptyTitle: 'No publications yet',
    emptyDescription: 'Papers, articles and research output.',
    fields: [
      { kind: 'text', key: 'title', label: 'Title', span: 2 },
      { kind: 'text', key: 'publisher', label: 'Publisher or journal' },
      { kind: 'month', key: 'date', label: 'Published' },
      { kind: 'text', key: 'authors', label: 'Authors', span: 2, placeholder: 'In citation order' },
      { kind: 'text', key: 'url', label: 'Link', span: 2, type: 'url' },
      { kind: 'textarea', key: 'description', label: 'Abstract', max: 300, rows: 2 },
    ],
  },

  conferences: {
    titleKey: 'title',
    subtitleKey: 'event',
    addLabel: 'Add talk',
    emptyTitle: 'No talks yet',
    emptyDescription: 'Talks given and conferences attended.',
    fields: [
      { kind: 'text', key: 'title', label: 'Talk title', span: 2 },
      { kind: 'text', key: 'event', label: 'Event' },
      { kind: 'text', key: 'role', label: 'Your role', placeholder: 'Speaker' },
      { kind: 'text', key: 'location', label: 'Location' },
      { kind: 'month', key: 'date', label: 'Date' },
      { kind: 'text', key: 'url', label: 'Link', span: 2, type: 'url' },
      { kind: 'textarea', key: 'description', label: 'Description', max: 300, rows: 2 },
    ],
  },

  patents: {
    titleKey: 'title',
    subtitleKey: 'number',
    addLabel: 'Add patent',
    emptyTitle: 'No patents yet',
    emptyDescription: 'Granted or pending patents with their numbers.',
    fields: [
      { kind: 'text', key: 'title', label: 'Title', span: 2 },
      { kind: 'text', key: 'number', label: 'Patent number' },
      { kind: 'text', key: 'status', label: 'Status', placeholder: 'Granted / Pending' },
      { kind: 'text', key: 'office', label: 'Patent office' },
      { kind: 'month', key: 'date', label: 'Date' },
      { kind: 'text', key: 'url', label: 'Link', span: 2, type: 'url' },
      { kind: 'textarea', key: 'description', label: 'Description', max: 300, rows: 2 },
    ],
  },

  memberships: {
    titleKey: 'organization',
    subtitleKey: 'role',
    addLabel: 'Add membership',
    emptyTitle: 'No memberships yet',
    emptyDescription: 'Professional bodies and associations.',
    fields: [
      { kind: 'text', key: 'organization', label: 'Organisation', span: 2 },
      { kind: 'text', key: 'role', label: 'Role', span: 2, placeholder: 'Member' },
      { kind: 'dateRange', key: 'dates', label: 'Dates' },
    ],
  },

  volunteering: {
    titleKey: 'role',
    subtitleKey: 'organization',
    addLabel: 'Add volunteering',
    emptyTitle: 'No volunteering yet',
    emptyDescription: 'Community and unpaid work counts as experience.',
    fields: [
      { kind: 'text', key: 'role', label: 'Role' },
      { kind: 'text', key: 'organization', label: 'Organisation' },
      { kind: 'text', key: 'location', label: 'Location', span: 2 },
      { kind: 'dateRange', key: 'dates', label: 'Dates' },
      { kind: 'bullets', key: 'bullets', label: 'What you did', max: 6 },
    ],
  },

  extracurricular: {
    titleKey: 'activity',
    subtitleKey: 'organization',
    addLabel: 'Add activity',
    emptyTitle: 'No activities yet',
    emptyDescription: 'Clubs, societies and leadership roles.',
    fields: [
      { kind: 'text', key: 'activity', label: 'Activity' },
      { kind: 'text', key: 'role', label: 'Your role' },
      { kind: 'text', key: 'organization', label: 'Organisation', span: 2 },
      { kind: 'dateRange', key: 'dates', label: 'Dates' },
      { kind: 'textarea', key: 'description', label: 'Description', max: 300, rows: 2 },
    ],
  },

  languages: {
    titleKey: 'name',
    subtitleKey: 'level',
    addLabel: 'Add language',
    emptyTitle: 'No languages yet',
    emptyDescription: 'Worth listing when you are applying across borders.',
    fields: [
      { kind: 'text', key: 'name', label: 'Language', placeholder: 'Bengali' },
      {
        kind: 'select',
        key: 'level',
        label: 'Proficiency',
        options: languageLevelOptions,
        placeholderOption: 'Not specified',
      },
      { kind: 'text', key: 'note', label: 'Note', span: 2, placeholder: 'IELTS 7.5' },
    ],
  },
};
