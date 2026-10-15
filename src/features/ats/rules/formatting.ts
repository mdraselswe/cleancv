import {
  BODY_TEXT_PT,
  FONT_SCALE,
  MAX_RESUME_PAGES,
  SUMMARY_WORD_RANGE,
  panelTarget,
} from '@/constants';
import { bn } from '@/lib/bn';
import { isRangeReversed } from '@/lib/date';
import { isBlank, wordCount } from '@/lib/text';

import type { AtsRule } from '../types';

/** Structure and consistency — the things that make a document scannable. */
export const rules: AtsRule[] = [
  {
    id: 'date-order',
    category: 'formatting',
    weight: 4,
    label: 'তারিখের সীমা',
    evaluate: (resume) => {
      const reversed = [
        ...resume.experience.filter((entry) => isRangeReversed(entry.dates)),
        ...resume.education.filter((entry) => isRangeReversed(entry.dates)),
        ...resume.projects.filter((entry) => isRangeReversed(entry.dates)),
      ];

      if (reversed.length === 0) {
        return { status: 'pass', message: 'প্রতিটি তারিখের শুরু আগে, শেষ পরে — কোনোটি উল্টো নয়, আর সবই একই MM/YYYY ফরম্যাটে।' };
      }

      return {
        status: 'error',
        message: `${bn(reversed.length)}টি এন্ট্রি শুরু হওয়ার আগেই শেষ হয়েছে।`,
        fixHint: 'ATS সফটওয়্যার এগুলো পড়লে অভিজ্ঞতার সময় মাইনাস ধরবে।',
        targets: ['experience', 'education'],
      };
    },
  },

  {
    id: 'page-count',
    category: 'formatting',
    weight: 4,
    label: 'দৈর্ঘ্য',
    evaluate: (_resume, { estimatedPages }) => {
      if (estimatedPages <= MAX_RESUME_PAGES) {
        return {
          status: 'pass',
          message: `প্রায় ${bn(estimatedPages)} পেজ — স্বাভাবিক সীমার ভেতরে।`,
        };
      }

      return {
        status: estimatedPages > MAX_RESUME_PAGES + 1 ? 'error' : 'warn',
        message: `প্রায় ${bn(estimatedPages)} পেজ।`,
        fixHint:
          'পুরনো পদগুলোতে দুটি করে বুলেট রাখুন, অথবা “ডিজাইন” থেকে ফাঁকা জায়গা কমান। একাডেমিক CV ছাড়া অন্য CV দুই পেজের বেশি হওয়া ঠিক নয়।',
        targets: [panelTarget('design')],
      };
    },
  },

  {
    id: 'summary-length',
    category: 'formatting',
    weight: 3,
    label: 'সংক্ষিপ্ত পরিচিতিের দৈর্ঘ্য',
    evaluate: (resume) => {
      if (isBlank(resume.summary.text)) {
        return { status: 'warn', message: 'মাপার মতো কোনো সংক্ষিপ্ত পরিচিতি নেই।', targets: ['summary'] };
      }

      const count = wordCount(resume.summary.text);

      if (count >= SUMMARY_WORD_RANGE.min && count <= SUMMARY_WORD_RANGE.max) {
        return { status: 'pass', message: `${bn(count)} শব্দ — ঠিক আছে।` };
      }

      return {
        status: 'warn',
        message:
          count < SUMMARY_WORD_RANGE.min
            ? `${bn(count)} শব্দ — আপনাকে তুলে ধরার জন্য খুব কম।`
            : `${bn(count)} শব্দ — কেউ এত লম্বা পড়ে না।`,
        fixHint: `${bn(SUMMARY_WORD_RANGE.min)} থেকে ${bn(SUMMARY_WORD_RANGE.max)} শব্দের মধ্যে রাখুন।`,
        targets: ['summary'],
      };
    },
  },

  {
    id: 'reverse-chronological',
    category: 'formatting',
    weight: 3,
    label: 'নতুনটি আগে',
    evaluate: (resume) => {
      const dated = resume.experience.filter((entry) => !isBlank(entry.dates.start));
      if (dated.length < 2) {
        return { status: 'pass', message: 'তারিখসহ পদ এত কম যে ক্রম নিয়ে ভাবার দরকার নেই।' };
      }

      const outOfOrder = dated.some((entry, index) => {
        if (index === 0) return false;
        const previous = dated[index - 1];
        if (previous.dates.current) return false;

        return entry.dates.current || entry.dates.start > previous.dates.start;
      });

      return outOfOrder
        ? {
            status: 'warn',
            message: 'পদগুলো নতুন থেকে পুরনো ক্রমে নেই।',
            fixHint: 'সবচেয়ে নতুনটি আগে রাখুন। রিক্রুটার ও ATS সফটওয়্যার দুজনেই এটাই ধরে নেয়।',
            targets: ['experience'],
          }
        : { status: 'pass', message: 'পদগুলো নতুন থেকে পুরনো ক্রমে সাজানো।' };
    },
  },

  {
    id: 'body-size',
    category: 'formatting',
    weight: 3,
    label: 'লেখার আকার',
    evaluate: (resume, { measuredBodyPt }) => {
      if (!measuredBodyPt || measuredBodyPt <= 0) {
        return {
          status: 'pass',
          message: 'প্রিভিউ থেকে মাপা হয়, আর এই স্ক্রিনে প্রিভিউ খোলা নেই।',
        };
      }

      const pt = Math.round(measuredBodyPt * 10) / 10;

      if (pt >= BODY_TEXT_PT.warn) {
        return { status: 'pass', message: `মূল লেখার আকার ${bn(pt)}pt।` };
      }

      /*
       * The slider multiplies the design's own size, so the new value is the
       * current one scaled by how far short the printed size falls. Rounded up
       * to the slider's step so it lands on or just over the line, never under.
       */
      const current = resume.meta.theme.fontScale;
      const exact = (current * BODY_TEXT_PT.warn) / measuredBodyPt;
      const value = Math.min(FONT_SCALE.max, Math.ceil(exact / FONT_SCALE.step - 1e-9) * FONT_SCALE.step);
      const rounded = Math.round(value * 100) / 100;

      return {
        status: pt < BODY_TEXT_PT.error ? 'error' : 'warn',
        message: `মূল লেখার আকার প্রায় ${bn(pt)}pt — পড়তে চোখে কষ্ট হওয়ার মতো ছোট।`,
        fixHint: `লেখার আকার ${bn(Math.round(current * 100))}% থেকে ${bn(Math.round(rounded * 100))}% করলে এটি ${bn(BODY_TEXT_PT.warn)}pt-তে পৌঁছায়। এতে একটি পেজ বেড়ে যেতে পারে; বাড়লে লেখার আকার আবার ছোট না করে দু-একটি বুলেট কমিয়ে দিন।`,
        fix: {
          kind: 'font-scale',
          value: rounded,
          label: `লেখার আকার ${bn(Math.round(rounded * 100))}% করুন`,
        },
        targets: [panelTarget('design')],
      };
    },
  },

  {
    id: 'section-count',
    category: 'formatting',
    weight: 1,
    label: 'সেকশনের সংখ্যা',
    evaluate: (resume) => {
      const enabled = Object.values(resume.meta.sections).filter((setting) => setting?.enabled).length;

      if (enabled <= 12) {
        return { status: 'pass', message: `${bn(enabled)}টি সেকশন চালু আছে।` };
      }

      return {
        status: 'warn',
        message: `${bn(enabled)}টি সেকশন চালু আছে।`,
        fixHint: 'বারোটির বেশি হলে প্রতিটি সেকশন কম মনোযোগ পায়। যেগুলো কাজে লাগছে না, বন্ধ করে দিন।',
        targets: [panelTarget('sections')],
      };
    },
  },
];
