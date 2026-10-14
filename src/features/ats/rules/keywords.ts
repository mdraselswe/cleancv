import { KEYWORD_MATCH_TARGET } from '@/constants';
import { bn } from '@/lib/bn';
import { tokenSet } from '@/lib/text';

import { collectBullets, collectSkills, matchKeywords } from '../utils/collect';
import type { AtsRule } from '../types';

/**
 * Overlap with the posting you are targeting.
 *
 * Without a pasted job description there is nothing to match against, so these
 * rules pass rather than punish — an unscored category would make the total
 * incomparable between sessions.
 */
export const rules: AtsRule[] = [
  {
    id: 'jd-coverage',
    category: 'keywords',
    weight: 6,
    label: 'চাকরির বিবরণের সঙ্গে মিল',
    evaluate: (resume, { jobKeywords }) => {
      if (jobKeywords.length === 0) {
        return {
          status: 'pass',
          message: 'এখনো কোনো চাকরির বিবরণ পেস্ট করা হয়নি।',
          fixHint: 'একটি পেস্ট করুন, দেখবেন আপনার CV-তে এর কোন শব্দগুলো নেই।',
        };
      }

      const { matched, missing, coverage } = matchKeywords(resume, jobKeywords);
      const percent = Math.round(coverage * 100);

      if (coverage >= KEYWORD_MATCH_TARGET) {
        return {
          status: 'pass',
          message: `বিজ্ঞপ্তির মূল শব্দের ${bn(percent)}% আছে (${bn(matched.length)}/${bn(jobKeywords.length)})।`,
        };
      }

      return {
        status: coverage >= KEYWORD_MATCH_TARGET / 2 ? 'warn' : 'error',
        message: `বিজ্ঞপ্তির মূল শব্দের মাত্র ${bn(percent)}% আছে।`,
        fixHint: `নেই: ${missing.slice(0, 8).join(', ')}। যেগুলো সত্যিই আপনার সম্পর্কে সত্যি, সেগুলো বিজ্ঞপ্তির নিজস্ব বানানে লিখুন।`,
        details: [
          `আপনার CV-তে নেই: ${missing.slice(0, 16).join(', ')}`,
          'কোথায় বসাবেন: পদ-সংক্রান্ত শব্দ শিরোনামে ও সারসংক্ষেপের শুরুতে, টুলগুলোর জন্য একটি দক্ষতার গ্রুপে, আর প্রতিটির প্রমাণ দেওয়ার মতো একটি বুলেটে। শুধু যেগুলো সত্যি, সেগুলোই।',
        ],
        targets: ['skills', 'summary', 'experience'],
      };
    },
  },

  {
    id: 'skills-evidenced',
    category: 'keywords',
    weight: 3,
    label: 'অভিজ্ঞতায় প্রমাণিত দক্ষতা',
    evaluate: (resume) => {
      const skills = collectSkills(resume);
      if (skills.length === 0) {
        return { status: 'error', message: 'কোনো দক্ষতা যোগ করা হয়নি।', targets: ['skills'] };
      }

      const evidence = tokenSet(
        [
          ...collectBullets(resume).map((bullet) => bullet.text),
          ...resume.experience.flatMap((entry) => entry.tech),
          ...resume.projects.flatMap((entry) => entry.tech),
        ].join(' '),
      );

      // Multi-word skills count when their first token appears; "Next.js" tokenises whole.
      const backed = skills.filter((skill) =>
        skill
          .toLowerCase()
          .split(/[\s,/]+/)
          .some((token) => evidence.has(token)),
      );

      const ratio = backed.length / skills.length;

      if (ratio >= 0.4) {
        return {
          status: 'pass',
          message: `${bn(skills.length)}টি দক্ষতার মধ্যে ${bn(backed.length)}টি আপনার অভিজ্ঞতার বর্ণনাতেও আছে।`,
        };
      }

      const unbacked = skills.filter((skill) => !backed.includes(skill));

      return {
        status: 'warn',
        message: `${bn(skills.length)}টি দক্ষতার মধ্যে মাত্র ${bn(backed.length)}টি CV-র অন্য কোথাও আছে।`,
        fixHint:
          'যে কয়েকটির জন্য চাকরি পেতে চান সেগুলো বেছে নিন, আর যে বুলেটে ব্যবহার করেছেন সেখানে নাম দিন, যেমন “…built the checkout in Next.js and GraphQL”। যেগুলোর পক্ষে দাঁড়াতে পারবেন না, সেগুলো মুছে দিন।',
        details: [`অন্য কোথাও উল্লেখ নেই: ${unbacked.slice(0, 14).join(', ')}${unbacked.length > 14 ? `, আরও ${bn(unbacked.length - 14)}টি` : ''}`],
        targets: ['experience', 'skills'],
      };
    },
  },
];
