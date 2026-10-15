import {
  BULLET_WORD_RANGE,
  FIRST_PERSON_TOKENS,
  STRONG_ACTION_VERBS,
  WEAK_PHRASES,
} from '@/constants';
import { bn } from '@/lib/bn';
import { hasMetric, hasOutcome, hasScale, metricPrompt } from '@/lib/metrics';
import { findPhrases, firstWord, wordCount, words } from '@/lib/text';

import { collectBullets, describeBullet, quoteBullet } from '../utils/collect';
import type { AtsRule } from '../types';

/**
 * Does the writing show outcomes, or duties?
 *
 * This is the category a human recruiter feels even when no software is
 * involved: "responsible for the checkout flow" and "cut checkout drop-off by
 * 18%" describe the same job and land completely differently.
 */

const percent = (part: number, whole: number) => (whole === 0 ? 1 : part / whole);

/** Maps a 0-1 ratio onto pass / warn / error at the usual two-thirds and one-third marks. */
const gradeRatio = (ratio: number): 'pass' | 'warn' | 'error' =>
  ratio >= 0.66 ? 'pass' : ratio >= 0.33 ? 'warn' : 'error';

export const rules: AtsRule[] = [
  {
    id: 'bullets-exist',
    category: 'impact',
    weight: 3,
    label: 'প্রতিটি পদে বুলেট আছে',
    evaluate: (resume) => {
      const empty = resume.experience.filter(
        (entry) => entry.bullets.filter((bullet) => bullet.trim()).length === 0,
      );

      if (resume.experience.length === 0) {
        return { status: 'error', message: 'বর্ণনা করার মতো কোনো অভিজ্ঞতা এখনো নেই।', targets: ['experience'] };
      }

      if (empty.length === 0) {
        return { status: 'pass', message: 'প্রতিটি পদে আপনি আসলে কী করেছেন তা লেখা আছে।' };
      }

      return {
        status: 'error',
        message: `${bn(empty.length)}টি পদে কোনো বুলেট নেই।`,
        fixHint: 'শুধু পদের নাম পড়ে পাঠক কিছুই যাচাই করতে পারেন না।',
        targets: ['experience'],
      };
    },
  },

  {
    id: 'bullets-have-metrics',
    category: 'impact',
    weight: 5,
    label: 'সংখ্যায় মাপা যায় এমন ফলাফল',
    evaluate: (resume) => {
      const bullets = collectBullets(resume);
      if (bullets.length === 0) {
        return { status: 'error', message: 'মাপার মতো কোনো বুলেট নেই।', targets: ['experience'] };
      }

      const withMetric = bullets.filter((bullet) => hasMetric(bullet.text));
      const ratio = percent(withMetric.length, bullets.length);
      const status = gradeRatio(ratio);

      const without = bullets.filter((bullet) => !hasMetric(bullet.text));

      return {
        status,
        message: `${bn(bullets.length)}টি বুলেটের মধ্যে ${bn(withMetric.length)}টিতে সংখ্যা আছে।`,
        fixHint:
          status === 'pass'
            ? undefined
            : 'নিচের প্রতিটি লাইনে এমন একটি সংখ্যা যোগ করুন, যা পাঠক যাচাই করতে পারেন: কতজন ব্যবহার করেছে, কতটা দ্রুত বা সস্তা হয়েছে, কতগুলো টিম বা সার্ভিসে প্রভাব পড়েছে। শুধু সত্যি সংখ্যাই লিখুন।',
        details:
          status === 'pass'
            ? undefined
            : without.map(
                (bullet) =>
                  `${describeBullet(resume, bullet)} — ${quoteBullet(bullet.text)}
→ ${metricPrompt(bullet.text)}`,
              ),
        targets: ['experience', 'projects'],
      };
    },
  },

  {
    id: 'bullets-have-outcomes',
    category: 'impact',
    weight: 5,
    label: 'দায়িত্ব নয়, ফলাফল',
    evaluate: (resume) => {
      const bullets = collectBullets(resume);
      if (bullets.length === 0) {
        return { status: 'error', message: 'যাচাই করার মতো কোনো বুলেট নেই।', targets: ['experience'] };
      }

      const withOutcome = bullets.filter((bullet) => hasOutcome(bullet.text));
      const needed = Math.max(3, Math.ceil(bullets.length * 0.2));
      const status =
        withOutcome.length >= needed ? 'pass' : withOutcome.length > 0 ? 'warn' : 'error';

      if (status === 'pass') {
        return {
          status,
          message: `${bn(bullets.length)}টি বুলেটের মধ্যে ${bn(withOutcome.length)}টিতে কী বদলেছে তা বলা আছে।`,
        };
      }

      const without = bullets.filter((bullet) => !hasOutcome(bullet.text));

      return {
        status,
        message: `${bn(bullets.length)}টি বুলেটের মধ্যে ${bn(withOutcome.length)}টিতে কী বদলেছে তা বলা আছে; লক্ষ্য ${bn(needed)}টি।`,
        fixHint:
          'আপনার সবচেয়ে শক্তিশালী তিনটি অর্জন বেছে নিন, আর প্রতিটির শেষে ফলাফল লিখুন: “পেজ লোড ৪.২ সেকেন্ড থেকে ১.৮ সেকেন্ডে নামিয়েছি”, “রি-রেন্ডার ৪০% কমিয়েছি”। আগে-পরের তুলনাই CV-র সবচেয়ে বিশ্বাসযোগ্য লাইন।',
        details: without
          .slice(0, 6)
          .map(
            (bullet) =>
              `${describeBullet(resume, bullet)} — ${quoteBullet(bullet.text)}
→ ফলাফল দিয়ে শেষ করুন: ___ থেকে ___, অথবা ___% দ্রুত / কম / বেশি।`,
          ),
        targets: ['experience', 'projects'],
      };
    },
  },

  {
    id: 'bullets-show-scale',
    category: 'impact',
    weight: 3,
    label: 'কাজের আকার',
    evaluate: (resume) => {
      const bullets = collectBullets(resume);
      if (bullets.length === 0) {
        return { status: 'error', message: 'No bullets to check.', targets: ['experience'] };
      }

      const scaled = bullets.filter((bullet) => hasScale(bullet.text));

      if (scaled.length >= 2) {
        return { status: 'pass', message: `${bn(scaled.length)}টি বুলেটে কাজ কত বড় ছিল তা বলা আছে।` };
      }

      return {
        status: scaled.length === 1 ? 'warn' : 'error',
        message:
          scaled.length === 1
            ? 'মাত্র একটি বুলেটে কাজ কত বড় ছিল তা বলা আছে।'
            : 'কাজ কত বড় ছিল তা কোথাও বলা নেই — টিমের আকার, ব্যবহারকারী, বাজেট বা পরিমাণ কিছুই নেই।',
        fixHint:
          'বর্তমান বা সবচেয়ে বড় পদে কত বড় কাজ সামলেছেন তা লিখুন: টিমে কতজন, মাসে কত ব্যবহারকারী বা অর্ডার, কয়টি প্রোডাক্ট বা বাজার, বাজেট কত। রিক্রুটার কাজের আকার দেখেই বোঝেন আপনি কতটা সিনিয়র।',
        targets: ['experience'],
      };
    },
  },

  {
    id: 'bullets-start-with-verb',
    category: 'impact',
    weight: 4,
    label: 'কাজের শব্দ',
    evaluate: (resume) => {
      const bullets = collectBullets(resume);
      if (bullets.length === 0) {
        return { status: 'error', message: 'No bullets to check.', targets: ['experience'] };
      }

      const verbs = new Set<string>(STRONG_ACTION_VERBS);
      const strong = bullets.filter((bullet) => verbs.has(firstWord(bullet.text)));
      const weak = bullets.filter((bullet) => !verbs.has(firstWord(bullet.text)));
      const ratio = percent(strong.length, bullets.length);
      const status = gradeRatio(ratio);

      return {
        status,
        message: `${bn(bullets.length)}টি বুলেটের মধ্যে ${bn(strong.length)}টি জোরালো কাজের শব্দ দিয়ে শুরু হয়েছে।`,
        fixHint:
          status === 'pass'
            ? undefined
            : 'নিচের প্রতিটি লাইন শুরু করুন আপনি কী করেছেন তা দিয়ে, অতীত কালের শব্দে: Built, Led, Cut, Migrated, Shipped। “Worked on” বা “Responsible for” দিয়ে নয়।',
        details:
          status === 'pass'
            ? undefined
            : weak.map((bullet) => `${describeBullet(resume, bullet)} — ${quoteBullet(bullet.text)}`),
        targets: ['experience', 'projects'],
      };
    },
  },

  {
    id: 'no-weak-phrases',
    category: 'impact',
    weight: 4,
    label: 'ফাঁকা বুলি নেই',
    evaluate: (resume) => {
      const text = [resume.summary.text, ...collectBullets(resume).map((bullet) => bullet.text)].join(' ');
      const found = findPhrases(text, WEAK_PHRASES);

      if (found.length === 0) {
        return { status: 'pass', message: 'শুধু দায়িত্বের তালিকা বা গতবাঁধা কথা পাওয়া যায়নি।' };
      }

      return {
        status: found.length > 2 ? 'error' : 'warn',
        message: `পাওয়া গেছে: ${found.slice(0, 4).join(', ')}।`,
        fixHint: 'এগুলো শুধু চাকরির দায়িত্বের কথা, আপনি কী করেছেন তা নয়। কী বদলেছে তা লিখে এগুলো বদলে দিন।',
        targets: ['summary', 'experience'],
      };
    },
  },

  {
    id: 'no-first-person',
    category: 'impact',
    weight: 2,
    label: '“আমি” নেই',
    evaluate: (resume) => {
      const text = collectBullets(resume)
        .map((bullet) => bullet.text)
        .join(' ');
      const pronouns = new Set<string>(FIRST_PERSON_TOKENS);
      const found = words(text).filter((word) => pronouns.has(word.toLowerCase()));

      if (found.length === 0) {
        return { status: 'pass', message: 'CV-তে যেমন লেখা উচিত, তেমনই “আমি” শব্দ বাদ দিয়ে লেখা।' };
      }

      return {
        status: 'warn',
        message: `বুলেটে ${bn(found.length)}টি জায়গায় “I”, “my”, “we”-এর মতো শব্দ আছে।`,
        fixHint: '“I” আর “we” বাদ দিন — পাঠক এমনিই জানেন এটি কার CV।',
        targets: ['experience'],
      };
    },
  },

  {
    id: 'bullet-length',
    category: 'impact',
    weight: 3,
    label: 'বুলেট কত লম্বা',
    evaluate: (resume) => {
      const bullets = collectBullets(resume);
      if (bullets.length === 0) {
        return { status: 'error', message: 'No bullets to check.', targets: ['experience'] };
      }

      const long = bullets.filter((bullet) => wordCount(bullet.text) > BULLET_WORD_RANGE.max);
      const short = bullets.filter((bullet) => wordCount(bullet.text) < BULLET_WORD_RANGE.min);
      const offending = long.length + short.length;

      if (offending === 0) {
        return {
          status: 'pass',
          message: `সব বুলেট ${bn(BULLET_WORD_RANGE.min)} থেকে ${bn(BULLET_WORD_RANGE.max)} শব্দের মধ্যে আছে।`,
        };
      }

      return {
        status: offending > bullets.length / 3 ? 'error' : 'warn',
        message: `${bn(long.length)}টি বেশি লম্বা, ${bn(short.length)}টি বেশি ছোট।`,
        fixHint: 'প্রতিটি বুলেট ছাপা অবস্থায় এক বা দুই লাইন হলে ভালো। এর চেয়ে লম্বা হলে পাঠক এড়িয়ে যান, আর খুব ছোট হলে কিছুই বোঝায় না।',
        details: [
          ...long.map(
            (bullet) =>
              `বেশি লম্বা (${bn(wordCount(bullet.text))} শব্দ) — ${describeBullet(resume, bullet)}: ${quoteBullet(bullet.text, 60)}`,
          ),
          ...short.map(
            (bullet) =>
              `বেশি ছোট (${bn(wordCount(bullet.text))} শব্দ) — ${describeBullet(resume, bullet)}: ${quoteBullet(bullet.text, 60)}`,
          ),
        ],
        targets: ['experience', 'projects'],
      };
    },
  },

  {
    id: 'verb-variety',
    category: 'impact',
    weight: 2,
    label: 'আলাদা আলাদা শুরু',
    evaluate: (resume) => {
      const bullets = collectBullets(resume);
      if (bullets.length < 3) {
        return { status: 'pass', message: 'একই শব্দ বারবার এসেছে কি না দেখার মতো যথেষ্ট বুলেট এখনো নেই।' };
      }

      const counts = new Map<string, number>();
      bullets.forEach((bullet) => {
        const verb = firstWord(bullet.text);
        if (verb) counts.set(verb, (counts.get(verb) ?? 0) + 1);
      });

      const repeated = [...counts.entries()].filter(([, count]) => count > 2);

      if (repeated.length === 0) {
        return { status: 'pass', message: 'বুলেটের শুরুর শব্দগুলো আলাদা আলাদা।' };
      }

      const repeatedVerbs = new Set(repeated.map(([verb]) => verb));

      return {
        status: 'warn',
        message: `“${repeated[0][0]}” দিয়ে ${bn(repeated[0][1])}টি বুলেট শুরু হয়েছে।`,
        fixHint:
          'প্রতিটি থেকে একটি রাখুন, বাকিগুলোতে আলাদা কাজের শব্দ দিন, যা বলে কী ঘটেছিল: Designed, Reduced, Mentored, Automated, Shipped।',
        details: bullets
          .filter((bullet) => repeatedVerbs.has(firstWord(bullet.text)))
          .map((bullet) => `${describeBullet(resume, bullet)} — ${quoteBullet(bullet.text)}`),
        targets: ['experience'],
      };
    },
  },
];
