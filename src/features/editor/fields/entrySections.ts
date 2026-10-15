import {
  EMPLOYMENT_TYPES,
  LANGUAGE_LEVELS,
  LIMITS,
  PROFICIENCY_LEVELS,
  SKILL_GROUP_SUGGESTIONS,
  type EmploymentType,
  type LanguageLevel,
  type ProficiencyLevel,
} from '@/constants';
import type { EntryListKey } from '@/features/resume';

import type { EntrySectionConfig } from './types';

/**
 * Form definitions for every repeatable section.
 *
 * This file is the whole difference between a "Work Experience" form and a
 * "Patents" form. Everything else - add, remove, reorder, collapse, validation,
 * store wiring - is shared.
 *
 * Labels and hints are in Bangla because they are the interface. The example
 * values in `placeholder` stay in English on purpose: they show what the CV
 * itself will say, and a CV for an employer abroad is written in English.
 */

/*
 * What the dropdowns say. The stored value is unchanged, and the CV still prints
 * the English label from `constants/options.ts`.
 */
const EMPLOYMENT_UI_LABEL: Record<EmploymentType, string> = {
  'full-time': 'ফুল-টাইম',
  'part-time': 'পার্ট-টাইম',
  contract: 'চুক্তিভিত্তিক',
  freelance: 'ফ্রিল্যান্স',
  internship: 'ইন্টার্নশিপ',
  remote: 'রিমোট',
};

const LANGUAGE_UI_LABEL: Record<LanguageLevel, string> = {
  native: 'মাতৃভাষা',
  fluent: 'সাবলীল',
  professional: 'পেশাগত কাজ চালানোর মতো',
  conversational: 'কথোপকথনের মতো',
  basic: 'প্রাথমিক',
};

const PROFICIENCY_UI_LABEL: Record<ProficiencyLevel, string> = {
  beginner: 'শিক্ষানবিস',
  intermediate: 'মাঝারি',
  advanced: 'উন্নত',
  expert: 'বিশেষজ্ঞ',
};

const employmentOptions = EMPLOYMENT_TYPES.map((value) => ({
  value,
  label: EMPLOYMENT_UI_LABEL[value],
}));

const languageLevelOptions = LANGUAGE_LEVELS.map((value) => ({
  value,
  label: LANGUAGE_UI_LABEL[value],
}));

const proficiencyOptions = PROFICIENCY_LEVELS.map((value) => ({
  value,
  label: PROFICIENCY_UI_LABEL[value],
}));

const NOT_SPECIFIED = 'দেওয়া নেই';
const OPTIONAL = 'ঐচ্ছিক';

export const ENTRY_SECTIONS: Record<EntryListKey, EntrySectionConfig> = {
  experience: {
    titleKey: 'role',
    subtitleKey: 'company',
    noun: 'পদ',
    addLabel: 'পদ যোগ করুন',
    emptyTitle: 'এখনো কোনো পদ নেই',
    emptyDescription: 'সবচেয়ে নতুন পদটি আগে যোগ করুন — রিক্রুটার ওপর থেকে নিচে পড়েন।',
    fields: [
      { kind: 'text', key: 'role', label: 'পদের নাম', placeholder: 'Senior Software Engineer' },
      { kind: 'text', key: 'company', label: 'প্রতিষ্ঠান', placeholder: 'Shikho Technologies' },
      { kind: 'text', key: 'location', label: 'অবস্থান', placeholder: 'Dhaka, Bangladesh' },
      {
        kind: 'select',
        key: 'employmentType',
        label: 'চাকরির ধরন',
        options: employmentOptions,
        placeholderOption: NOT_SPECIFIED,
      },
      { kind: 'dateRange', key: 'dates', label: 'তারিখ' },
      {
        kind: 'text',
        key: 'companyNote',
        label: 'প্রতিষ্ঠানটি কী করে',
        span: 2,
        placeholder: 'A technology company focused on digital learning.',
        hint: 'এক লাইনে লিখুন। প্রতিষ্ঠানের নাম বিদেশে অচেনা হলে এটি যোগ করা ভালো।',
      },
      {
        kind: 'bullets',
        key: 'bullets',
        label: 'অর্জন',
        hint: 'আগে কাজের শব্দ, তারপর ফলাফল, তারপর সংখ্যা।',
      },
      { kind: 'tags', key: 'tech', label: 'ব্যবহৃত টেকনোলজি', placeholder: 'Next.js, GraphQL' },
    ],
  },

  education: {
    titleKey: 'degree',
    subtitleKey: 'institute',
    noun: 'শিক্ষাগত যোগ্যতা',
    addLabel: 'শিক্ষা যোগ করুন',
    emptyTitle: 'এখনো কোনো শিক্ষা যোগ হয়নি',
    emptyDescription: 'সর্বোচ্চ ডিগ্রিটি আগে লিখুন।',
    fields: [
      { kind: 'text', key: 'degree', label: 'ডিগ্রি', placeholder: 'B.Sc. in Software Engineering' },
      { kind: 'text', key: 'major', label: 'বিষয়', placeholder: 'Software Engineering' },
      { kind: 'text', key: 'institute', label: 'প্রতিষ্ঠান', placeholder: 'Daffodil International University' },
      { kind: 'text', key: 'board', label: 'বোর্ড / বিশ্ববিদ্যালয়', placeholder: OPTIONAL },
      { kind: 'text', key: 'location', label: 'অবস্থান', placeholder: 'Dhaka, Bangladesh' },
      { kind: 'text', key: 'result', label: 'ফলাফল', placeholder: 'CGPA 3.20' },
      { kind: 'text', key: 'resultScale', label: 'মোট', placeholder: '4.00' },
      { kind: 'dateRange', key: 'dates', label: 'তারিখ' },
      { kind: 'text', key: 'thesis', label: 'থিসিস', span: 2, placeholder: OPTIONAL },
      { kind: 'tags', key: 'coursework', label: 'কাজের সঙ্গে মেলে এমন কোর্স' },
      { kind: 'bullets', key: 'bullets', label: 'টীকা', max: 4 },
    ],
  },

  skills: {
    titleKey: 'category',
    noun: 'দক্ষতার গ্রুপ',
    addLabel: 'দক্ষতার গ্রুপ যোগ করুন',
    emptyTitle: 'এখনো কোনো দক্ষতা নেই',
    emptyDescription: 'দক্ষতাগুলো এলাকা অনুযায়ী গ্রুপ করুন, যাতে পাঠক দ্রুত খুঁজে নিতে পারেন।',
    fields: [
      {
        kind: 'text',
        key: 'category',
        label: 'গ্রুপের নাম',
        placeholder: 'Frontend',
        hint: `পরামর্শ: ${SKILL_GROUP_SUGGESTIONS.slice(0, 5).join(', ')}`,
      },
      {
        kind: 'select',
        key: 'level',
        label: 'দক্ষতার স্তর',
        options: proficiencyOptions,
        placeholderOption: 'দেখানো হবে না',
        hint: 'ঐচ্ছিক। সৃজনশীল ডিজাইনে মিটার আকারে, অন্যগুলোতে সাধারণ লেখা হিসেবে দেখায়।',
      },
      {
        kind: 'icon',
        key: 'icon',
        fromKey: 'category',
        label: 'আইকন',
        hint: 'যে ডিজাইনে আইকনের জন্য আলাদা জায়গা আছে সেখানে আঁকা হয়। “স্বয়ংক্রিয়” দিলে গ্রুপের নাম দেখে আইকন বেছে নেয়।',
      },
      {
        kind: 'tags',
        key: 'items',
        label: 'দক্ষতা',
        max: LIMITS.skillsPerGroup,
        placeholder: 'React.js, Next.js, TypeScript',
      },
    ],
  },

  projects: {
    titleKey: 'name',
    subtitleKey: 'subtitle',
    noun: 'প্রজেক্ট',
    addLabel: 'প্রজেক্ট যোগ করুন',
    emptyTitle: 'এখনো কোনো প্রজেক্ট নেই',
    emptyDescription: 'কাজের ইতিহাস ছোট হলে প্রজেক্টই আপনার পক্ষে কথা বলে।',
    fields: [
      { kind: 'text', key: 'name', label: 'প্রজেক্টের নাম', placeholder: 'Blood Reach' },
      { kind: 'text', key: 'role', label: 'আপনার ভূমিকা', placeholder: OPTIONAL },
      { kind: 'text', key: 'subtitle', label: 'এক লাইনের বিবরণ', span: 2, placeholder: 'Emergency blood donation connector' },
      { kind: 'text', key: 'liveUrl', label: 'লাইভ লিংক', type: 'url', placeholder: 'https://…' },
      { kind: 'text', key: 'sourceUrl', label: 'সোর্স কোডের লিংক', type: 'url', placeholder: 'https://…' },
      { kind: 'dateRange', key: 'dates', label: 'তারিখ' },
      { kind: 'bullets', key: 'bullets', label: 'কী অর্জন হয়েছে' },
      { kind: 'tags', key: 'tech', label: 'ব্যবহৃত টেকনোলজি' },
    ],
  },

  certifications: {
    titleKey: 'name',
    subtitleKey: 'issuer',
    noun: 'সার্টিফিকেশন',
    addLabel: 'সার্টিফিকেশন যোগ করুন',
    emptyTitle: 'এখনো কোনো সার্টিফিকেশন নেই',
    emptyDescription: 'কোন প্রতিষ্ঠান কবে দিয়েছে, সেই তথ্যসহ সার্টিফিকেট যোগ করুন।',
    fields: [
      { kind: 'text', key: 'name', label: 'সার্টিফিকেশন', span: 2, placeholder: 'JavaScript Essential Training' },
      { kind: 'text', key: 'issuer', label: 'যে প্রতিষ্ঠান দিয়েছে', placeholder: 'LinkedIn Learning' },
      { kind: 'text', key: 'credentialId', label: 'ক্রেডেনশিয়াল আইডি', placeholder: OPTIONAL },
      { kind: 'month', key: 'issued', label: 'প্রদানের তারিখ' },
      { kind: 'month', key: 'expires', label: 'মেয়াদ শেষ' },
      { kind: 'text', key: 'url', label: 'যাচাইয়ের লিংক', span: 2, type: 'url' },
    ],
  },

  achievements: {
    titleKey: 'title',
    noun: 'অর্জন',
    addLabel: 'অর্জন যোগ করুন',
    emptyTitle: 'এখনো কোনো অর্জন নেই',
    emptyDescription: 'যে দুই-তিনটি ফলাফল আগে পড়াতে চান, সেগুলো আলাদা করে তুলে ধরুন।',
    fields: [
      { kind: 'text', key: 'title', label: 'শিরোনাম', span: 2, placeholder: 'Strategic Project Leadership' },
      {
        kind: 'icon',
        key: 'icon',
        fromKey: 'title',
        label: 'আইকন',
        hint: 'যে ডিজাইনে আইকনের জন্য আলাদা জায়গা আছে সেখানে আঁকা হয়। “স্বয়ংক্রিয়” দিলে শিরোনাম দেখে আইকন বেছে নেয়।',
      },
      { kind: 'textarea', key: 'description', label: 'আপনি কী করেছেন', max: 400, rows: 3 },
    ],
  },

  awards: {
    titleKey: 'title',
    subtitleKey: 'issuer',
    noun: 'পুরস্কার',
    addLabel: 'পুরস্কার যোগ করুন',
    emptyTitle: 'এখনো কোনো পুরস্কার নেই',
    emptyDescription: 'পুরস্কার, বৃত্তি ও আনুষ্ঠানিক স্বীকৃতি।',
    fields: [
      { kind: 'text', key: 'title', label: 'পুরস্কার', span: 2 },
      { kind: 'text', key: 'issuer', label: 'কে দিয়েছে' },
      { kind: 'month', key: 'date', label: 'তারিখ' },
      { kind: 'textarea', key: 'description', label: 'বিবরণ', max: 300, rows: 2 },
    ],
  },

  training: {
    titleKey: 'name',
    subtitleKey: 'provider',
    noun: 'প্রশিক্ষণ',
    addLabel: 'প্রশিক্ষণ যোগ করুন',
    emptyTitle: 'এখনো কোনো প্রশিক্ষণ নেই',
    emptyDescription: 'আনুষ্ঠানিক সার্টিফিকেট নয়, এমন কোর্স ও ওয়ার্কশপ।',
    fields: [
      { kind: 'text', key: 'name', label: 'কোর্স বা ওয়ার্কশপ', span: 2 },
      { kind: 'text', key: 'provider', label: 'আয়োজক' },
      { kind: 'text', key: 'location', label: 'অবস্থান' },
      { kind: 'month', key: 'date', label: 'তারিখ' },
      { kind: 'textarea', key: 'description', label: 'বিবরণ', max: 300, rows: 2 },
    ],
  },

  publications: {
    titleKey: 'title',
    subtitleKey: 'publisher',
    noun: 'প্রকাশনা',
    addLabel: 'প্রকাশনা যোগ করুন',
    emptyTitle: 'এখনো কোনো প্রকাশনা নেই',
    emptyDescription: 'গবেষণাপত্র, প্রবন্ধ ও গবেষণার ফলাফল।',
    fields: [
      { kind: 'text', key: 'title', label: 'শিরোনাম', span: 2 },
      { kind: 'text', key: 'publisher', label: 'প্রকাশক বা জার্নাল' },
      { kind: 'month', key: 'date', label: 'প্রকাশের তারিখ' },
      { kind: 'text', key: 'authors', label: 'লেখকরা', span: 2, placeholder: 'In citation order' },
      { kind: 'text', key: 'url', label: 'লিংক', span: 2, type: 'url' },
      { kind: 'textarea', key: 'description', label: 'সংক্ষিপ্ত পরিচিতি', max: 300, rows: 2 },
    ],
  },

  conferences: {
    titleKey: 'title',
    subtitleKey: 'event',
    noun: 'বক্তব্য',
    addLabel: 'বক্তব্য যোগ করুন',
    emptyTitle: 'এখনো কোনো বক্তব্য নেই',
    emptyDescription: 'দেওয়া বক্তব্য ও অংশ নেওয়া সম্মেলন।',
    fields: [
      { kind: 'text', key: 'title', label: 'বক্তব্যের শিরোনাম', span: 2 },
      { kind: 'text', key: 'event', label: 'অনুষ্ঠান' },
      { kind: 'text', key: 'role', label: 'আপনার ভূমিকা', placeholder: 'Speaker' },
      { kind: 'text', key: 'location', label: 'অবস্থান' },
      { kind: 'month', key: 'date', label: 'তারিখ' },
      { kind: 'text', key: 'url', label: 'লিংক', span: 2, type: 'url' },
      { kind: 'textarea', key: 'description', label: 'বিবরণ', max: 300, rows: 2 },
    ],
  },

  patents: {
    titleKey: 'title',
    subtitleKey: 'number',
    noun: 'পেটেন্ট',
    addLabel: 'পেটেন্ট যোগ করুন',
    emptyTitle: 'এখনো কোনো পেটেন্ট নেই',
    emptyDescription: 'নম্বরসহ পাওয়া বা আবেদন করা পেটেন্ট।',
    fields: [
      { kind: 'text', key: 'title', label: 'শিরোনাম', span: 2 },
      { kind: 'text', key: 'number', label: 'পেটেন্ট নম্বর' },
      { kind: 'text', key: 'status', label: 'অবস্থা', placeholder: 'Granted / Pending' },
      { kind: 'text', key: 'office', label: 'পেটেন্ট অফিস' },
      { kind: 'month', key: 'date', label: 'তারিখ' },
      { kind: 'text', key: 'url', label: 'লিংক', span: 2, type: 'url' },
      { kind: 'textarea', key: 'description', label: 'বিবরণ', max: 300, rows: 2 },
    ],
  },

  memberships: {
    titleKey: 'organization',
    subtitleKey: 'role',
    noun: 'সদস্যপদ',
    addLabel: 'সদস্যপদ যোগ করুন',
    emptyTitle: 'এখনো কোনো সদস্যপদ নেই',
    emptyDescription: 'পেশাগত সংগঠন ও সমিতি।',
    fields: [
      { kind: 'text', key: 'organization', label: 'সংগঠন', span: 2 },
      { kind: 'text', key: 'role', label: 'ভূমিকা', span: 2, placeholder: 'Member' },
      { kind: 'dateRange', key: 'dates', label: 'তারিখ' },
    ],
  },

  volunteering: {
    titleKey: 'role',
    subtitleKey: 'organization',
    noun: 'স্বেচ্ছাসেবা',
    addLabel: 'স্বেচ্ছাসেবা যোগ করুন',
    emptyTitle: 'এখনো কোনো স্বেচ্ছাসেবা নেই',
    emptyDescription: 'সমাজসেবা ও বিনা পারিশ্রমিকের কাজও অভিজ্ঞতা হিসেবে গণ্য হয়।',
    fields: [
      { kind: 'text', key: 'role', label: 'ভূমিকা' },
      { kind: 'text', key: 'organization', label: 'সংগঠন' },
      { kind: 'text', key: 'location', label: 'অবস্থান', span: 2 },
      { kind: 'dateRange', key: 'dates', label: 'তারিখ' },
      { kind: 'bullets', key: 'bullets', label: 'আপনি কী করেছেন', max: 6 },
    ],
  },

  extracurricular: {
    titleKey: 'activity',
    subtitleKey: 'organization',
    noun: 'কার্যক্রম',
    addLabel: 'কার্যক্রম যোগ করুন',
    emptyTitle: 'এখনো কোনো কার্যক্রম নেই',
    emptyDescription: 'ক্লাব, সংগঠন ও নেতৃত্বের ভূমিকা।',
    fields: [
      { kind: 'text', key: 'activity', label: 'কার্যক্রম' },
      { kind: 'text', key: 'role', label: 'আপনার ভূমিকা' },
      { kind: 'text', key: 'organization', label: 'সংগঠন', span: 2 },
      { kind: 'dateRange', key: 'dates', label: 'তারিখ' },
      { kind: 'textarea', key: 'description', label: 'বিবরণ', max: 300, rows: 2 },
    ],
  },

  languages: {
    titleKey: 'name',
    subtitleKey: 'level',
    noun: 'ভাষা',
    addLabel: 'ভাষা যোগ করুন',
    emptyTitle: 'এখনো কোনো ভাষা নেই',
    emptyDescription: 'দেশের বাইরে আবেদন করলে ভাষা উল্লেখ করা কাজে দেয়।',
    fields: [
      { kind: 'text', key: 'name', label: 'ভাষা', placeholder: 'Bengali' },
      {
        kind: 'select',
        key: 'level',
        label: 'দক্ষতার স্তর',
        options: languageLevelOptions,
        placeholderOption: NOT_SPECIFIED,
      },
      { kind: 'text', key: 'note', label: 'টীকা', span: 2, placeholder: 'IELTS 7.5' },
    ],
  },
};
