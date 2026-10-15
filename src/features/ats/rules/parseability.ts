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
    label: 'ডিজাইনটি ATS-এ কতটা ভালো পড়া যায়',
    evaluate: (_resume, { template }) => {
      if (template.atsBaseline >= 90) {
        return {
          status: 'pass',
          message: `${template.name} একটিই পড়ার ক্রম রাখে, তাই ATS সফটওয়্যার ঠিকমতো পড়তে পারে।`,
        };
      }

      if (template.atsBaseline >= 75) {
        return {
          status: 'warn',
          message: `${template.name}-এর লেআউট কিছু ATS সফটওয়্যার পুরোপুরি পড়তে পারে না।`,
          fixHint: 'পোর্টালে আবেদনের সময় ATS PDF পাঠান, আর এই ডিজাইনটি ইমেইলে পাঠান।',
          targets: [panelTarget('design')],
        };
      }

      return {
        status: 'error',
        message: `${template.name} দেখানোর জন্য বানানো ডিজাইন; ATS সফটওয়্যার এর কিছু অংশ পড়তে পারবে না।`,
        fixHint:
          'জব পোর্টালে যেকোনো আবেদনে ATS PDF ব্যবহার করুন, অথবা এমন একটি ডিজাইন বেছে নিন যাতে ATS স্কোরের সর্বোচ্চ সীমা বেশি।',
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
        return { status: 'pass', message: 'কোনো ছবি নেই — ATS সফটওয়্যার আটকে যাওয়ার মতো কিছু নেই।' };
      }

      return {
        status: 'warn',
        message: 'ডকুমেন্টে একটি ছবি ছাপা হচ্ছে।',
        fixHint:
          'ইউরোপ, এশিয়া ও উপসাগরীয় কিছু দেশে CV-তে ছবি দেওয়ার চল আছে। যুক্তরাষ্ট্র, যুক্তরাজ্য ও কানাডার আবেদনে ছবি দেবেন না, কারণ ছবির জন্য সেখানে CV না পড়েই বাদ দিয়ে দিতে পারে।',
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
        return { status: 'pass', message: 'সব শিরোনামে এমন নাম আছে, যা ATS সফটওয়্যার চেনে।' };
      }

      return {
        status: renamed.length > 2 ? 'error' : 'warn',
        message: `${bn(renamed.length)}টি সেকশনের নাম বদলানো হয়েছে: ${renamed
          .map((key) => resume.meta.sections[key]?.heading)
          .join(', ')}।`,
        fixHint:
          'ATS সফটওয়্যার শিরোনামের লেখা দেখে সেকশন চেনে। নাম বদলানো সেকশন চিনতে না পেরে অনেক সময় পুরোটাই বাদ দিয়ে দেয়। “সেকশন” প্যানেল থেকে নামটি ঠিক করুন।',
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
          'বেশির ভাগ ATS সফটওয়্যার এই তিনটি দেখে CV সাজিয়ে নেয়। এগুলো না থাকলে বাকি যা-ই লিখুন, স্কোর কম আসে। “সেকশন” প্যানেল থেকে এগুলো চালু করুন।',
        targets: [panelTarget('sections'), ...missing],
      };
    },
  },

  {
    id: 'text-layer',
    category: 'parseability',
    weight: 2,
    label: 'সিলেক্ট করা যায় এমন লেখা',
    evaluate: () => ({
      status: 'pass',
      message: 'আসল লেখা হিসেবে এক্সপোর্ট হয়, আর আইকন SVG হিসেবে বসে — পুরো PDF ছবি হয়ে যায় না, আইকন-ফন্টের অক্ষরও থাকে না।',
    }),
  },
];
