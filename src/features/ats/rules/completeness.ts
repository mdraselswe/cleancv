import { bn } from '@/lib/bn';
import { isBlank } from '@/lib/text';

import type { AtsRule } from '../types';

/** Are the fields a recruiter — and their software — expects actually filled in? */
export const rules: AtsRule[] = [
  {
    id: 'contact-essentials',
    category: 'completeness',
    weight: 5,
    label: 'ফোন ও ইমেইল',
    evaluate: (resume) => {
      const missing = [
        isBlank(resume.contact.phone) ? 'ফোন নম্বর' : '',
        isBlank(resume.contact.email) ? 'ইমেইল' : '',
      ].filter(Boolean);

      if (missing.length === 0) {
        return { status: 'pass', message: 'ফোন নম্বর ও ইমেইল ঠিকানা দুটোই আছে।' };
      }

      return {
        status: 'error',
        message: `ডকুমেন্টে ${missing.join(' ও ')} নেই।`,
        fixHint: 'যে CV-তে রিক্রুটার উত্তর দিতে পারেন না, সেটি বাদ পড়ে যায়।',
        targets: ['contact'],
      };
    },
  },

  {
    id: 'name-present',
    category: 'completeness',
    weight: 3,
    label: 'নাম',
    evaluate: (resume) =>
      isBlank(resume.basics.fullName)
        ? {
            status: 'error',
            message: 'ডকুমেন্টে কোনো নাম নেই।',
            targets: ['contact'],
          }
        : { status: 'pass', message: 'আপনার নাম পেজের সবার আগে আছে।' },
  },

  {
    id: 'headline-present',
    category: 'completeness',
    weight: 2,
    label: 'শিরোনাম',
    evaluate: (resume) =>
      isBlank(resume.basics.headline)
        ? {
            status: 'warn',
            message: 'কোনো পেশাগত শিরোনাম নেই।',
            fixHint: 'যে পদে আবেদন করছেন তার নাম এক লাইনে লিখুন। ATS সফটওয়্যার প্রায়ই এটিকে চাকরির পদের নামের সঙ্গে মেলায়।',
            targets: ['contact'],
          }
        : { status: 'pass', message: 'শিরোনামে আপনার লক্ষ্যের পদটি বলা আছে।' },
  },

  {
    id: 'summary-present',
    category: 'completeness',
    weight: 2,
    label: 'সংক্ষিপ্ত পরিচিতি',
    evaluate: (resume) =>
      isBlank(resume.summary.text)
        ? {
            status: 'warn',
            message: 'কোনো সংক্ষিপ্ত পরিচিতি বা উদ্দেশ্য লেখা নেই।',
            fixHint: 'দুই থেকে চার লাইন লিখুন। নিচের সবকিছু নিজের ভাষায় গুছিয়ে বলার এটিই একমাত্র জায়গা।',
            targets: ['summary'],
          }
        : { status: 'pass', message: 'সংক্ষিপ্ত পরিচিতি আছে, যা পাঠককে পুরো CV-র একটি ধারণা দেয়।' },
  },

  {
    id: 'experience-present',
    category: 'completeness',
    weight: 4,
    label: 'কাজের অভিজ্ঞতা',
    evaluate: (resume) =>
      resume.experience.length === 0
        ? {
            status: 'error',
            message: 'কোনো পদ যোগ করা হয়নি।',
            fixHint: 'ইন্টার্নশিপ, ফ্রিল্যান্স আর স্বেচ্ছাসেবার কাজও গণ্য হয়।',
            targets: ['experience'],
          }
        : {
            status: 'pass',
            message: `${bn(resume.experience.length)}টি পদ যোগ করা আছে।`,
          },
  },

  {
    id: 'education-present',
    category: 'completeness',
    weight: 2,
    label: 'শিক্ষা',
    evaluate: (resume) =>
      resume.education.length === 0
        ? { status: 'warn', message: 'কোনো শিক্ষাগত যোগ্যতা যোগ করা হয়নি।', targets: ['education'] }
        : { status: 'pass', message: 'শিক্ষা যোগ করা আছে।' },
  },

  {
    id: 'skills-present',
    category: 'completeness',
    weight: 3,
    label: 'দক্ষতা',
    evaluate: (resume) => {
      const total = resume.skills.reduce((count, group) => count + group.items.length, 0);

      if (total === 0) {
        return {
          status: 'error',
          message: 'কোনো দক্ষতা যোগ করা হয়নি।',
          fixHint: 'কীওয়ার্ড মেলানোর কাজ সবচেয়ে বেশি এই সেকশনের ওপরই নির্ভর করে।',
          targets: ['skills'],
        };
      }

      if (total < 8) {
        return {
          status: 'warn',
          message: `মাত্র ${bn(total)}টি দক্ষতা যোগ করা আছে।`,
          fixHint: 'কয়েকটি গ্রুপে মোট ১২ থেকে ২৫টি রাখুন, আর বিজ্ঞপ্তিতে যে বানানে লেখা আছে ঠিক সেভাবে লিখুন।',
          targets: ['skills'],
        };
      }

      return {
        status: 'pass',
        message: `${bn(resume.skills.length)}টি গ্রুপে মোট ${bn(total)}টি দক্ষতা যোগ করা আছে।`,
      };
    },
  },

  {
    id: 'dates-complete',
    category: 'completeness',
    weight: 3,
    label: 'প্রতিটি এন্ট্রিতে তারিখ',
    evaluate: (resume) => {
      const undated = [
        ...resume.experience.filter((entry) => isBlank(entry.dates.start)),
        ...resume.education.filter((entry) => isBlank(entry.dates.start)),
      ];

      if (undated.length === 0) {
        return { status: 'pass', message: 'প্রতিটি পদ ও শিক্ষাগত যোগ্যতায় শুরুর তারিখ আছে।' };
      }

      return {
        status: 'warn',
        message: `${bn(undated.length)}টি এন্ট্রিতে শুরুর তারিখ নেই।`,
        fixHint: 'ATS সফটওয়্যার এই তারিখ থেকে অভিজ্ঞতার বছর হিসাব করে। তারিখ না থাকলে সেটি ফাঁক বলে ধরা হয়।',
        targets: ['experience', 'education'],
      };
    },
  },

  {
    id: 'profile-links',
    category: 'completeness',
    weight: 1,
    label: 'প্রোফাইল লিংক',
    evaluate: (resume) => {
      const links = [resume.contact.linkedin, resume.contact.github, resume.contact.portfolio].filter(
        (link) => !isBlank(link),
      );

      return links.length > 0
        ? { status: 'pass', message: `${bn(links.length)}টি প্রোফাইল লিংক দেওয়া আছে।` }
        : {
            status: 'warn',
            message: 'LinkedIn, GitHub বা পোর্টফোলিওর কোনো লিংক নেই।',
            targets: ['contact'],
          };
    },
  },
];
