import {
  SECTION_META,
  SECTION_UI_LABEL,
  isRecognisedHeading,
  panelTarget,
  type SectionKey,
} from '@/constants';
import { isSectionEnabled } from '@/features/resume';
import { bn } from '@/lib/bn';
import { isBlank } from '@/lib/text';

import type { AtsRule } from '../types';

/**
 * Can a parser read the document at all?
 *
 * These are the rules that decide whether the other four categories even get
 * looked at. A beautiful resume that extracts as noise scores zero everywhere.
 */
export const rules: AtsRule[] = [
  {
    id: 'template-ceiling',
    category: 'parseability',
    weight: 4,
    label: 'টেমপ্লেটের পার্সিং নির্ভরযোগ্যতা',
    evaluate: (_resume, { template }) => {
      if (template.atsBaseline >= 90) {
        return {
          status: 'pass',
          message: `${template.name} একটিই পড়ার ক্রম বজায় রাখে, তাই পরিষ্কারভাবে পার্স হয়।`,
        };
      }

      if (template.atsBaseline >= 75) {
        return {
          status: 'warn',
          message: `${template.name}-এর লেআউট কিছু পার্সার পুরোপুরি পড়তে পারে না।`,
          fixHint: 'পোর্টালে আবেদনের সময় ATS PDF পাঠান, আর এই ডিজাইনটি ইমেইলে পাঠান।',
          targets: [panelTarget('design')],
        };
      }

      return {
        status: 'error',
        message: `${template.name} একটি প্রদর্শনী-ধরনের ডিজাইন; স্বয়ংক্রিয় পার্সার এর কিছু অংশ হারাবে।`,
        fixHint:
          'জব পোর্টালের মাধ্যমে যেকোনো আবেদনে ATS PDF এক্সপোর্ট ব্যবহার করুন, অথবা আরও বেশি সীমার একটি ডিজাইন বেছে নিন।',
        targets: [panelTarget('design')],
      };
    },
  },

  {
    id: 'photo-risk',
    category: 'parseability',
    weight: 2,
    label: 'ছবি',
    evaluate: (resume, { template }) => {
      const showing = template.supports.photo && resume.meta.theme.showPhoto && !isBlank(resume.basics.photo);

      if (!showing) {
        return { status: 'pass', message: 'কোনো ছবি নেই — পার্সার আটকে যাওয়ার মতো কিছু নেই।' };
      }

      return {
        status: 'warn',
        message: 'ডকুমেন্টে একটি ছবি ছাপা হচ্ছে।',
        fixHint:
          'ইউরোপ, এশিয়া ও উপসাগরের কিছু অংশে এটি প্রত্যাশিত। যুক্তরাষ্ট্র, যুক্তরাজ্য ও কানাডার আবেদনে ছবি সরিয়ে দিন, কারণ সেখানে ছবির জন্য CV না পড়েই বাতিল হতে পারে।',
        targets: ['contact'],
      };
    },
  },

  {
    id: 'standard-headings',
    category: 'parseability',
    weight: 3,
    label: 'সেকশনের শিরোনাম',
    evaluate: (resume) => {
      // Only names no parser is known to match on. "Professional Experience"
      // is a standard heading, not a risk, and flagging it would be noise.
      const renamed = (Object.keys(resume.meta.sections) as SectionKey[]).filter((key) => {
        const heading = resume.meta.sections[key]?.heading;

        return (
          isSectionEnabled(resume, key) &&
          !isBlank(heading) &&
          !isRecognisedHeading(key, heading)
        );
      });

      if (renamed.length === 0) {
        return { status: 'pass', message: 'সব শিরোনামে এমন নাম আছে, যা পার্সার চেনে।' };
      }

      return {
        status: renamed.length > 2 ? 'error' : 'warn',
        message: `${bn(renamed.length)}টি সেকশনের নাম বদলানো হয়েছে: ${renamed
          .map((key) => resume.meta.sections[key]?.heading)
          .join(', ')}।`,
        fixHint:
          'পার্সার শিরোনামের লেখা দেখে মেলায়। নাম বদলানো সেকশন ভুল লেবেল না পেয়ে প্রায়ই পুরোটাই বাদ পড়ে যায়। “সেকশন” প্যানেল থেকে নামটি ঠিক করুন।',
        targets: [panelTarget('sections'), ...renamed],
      };
    },
  },

  {
    id: 'core-sections-present',
    category: 'parseability',
    weight: 3,
    label: 'মূল সেকশন',
    evaluate: (resume) => {
      const required: SectionKey[] = ['experience', 'education', 'skills'];
      const missing = required.filter((key) => !isSectionEnabled(resume, key));

      if (missing.length === 0) {
        return { status: 'pass', message: 'অভিজ্ঞতা, শিক্ষা ও দক্ষতা তিনটিই আছে।' };
      }

      return {
        status: 'error',
        message: `নেই: ${missing.map((key) => `${SECTION_UI_LABEL[key]} (${SECTION_META[key].defaultHeading})`).join(', ')}।`,
        fixHint:
          'বেশির ভাগ পার্সার এই তিনটির ওপর ভিত্তি করে সূচি বানায়। এগুলো না থাকলে যা-ই লিখুন, স্কোর কম আসে। “সেকশন” প্যানেল থেকে এগুলো চালু করুন।',
        targets: [panelTarget('sections'), ...missing],
      };
    },
  },

  {
    id: 'text-layer',
    category: 'parseability',
    weight: 2,
    label: 'নির্বাচনযোগ্য লেখা',
    evaluate: () => ({
      status: 'pass',
      message: 'আসল লেখা হিসেবে এক্সপোর্ট হয়, আর আইকন ইনলাইন SVG — ছবি-সর্বস্ব PDF নয়, আইকন-ফন্টের অক্ষরও নয়।',
    }),
  },
];
