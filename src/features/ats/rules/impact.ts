import {
  BULLET_WORD_RANGE,
  FIRST_PERSON_TOKENS,
  METRIC_PATTERN,
  STRONG_ACTION_VERBS,
  WEAK_PHRASES,
} from '@/constants';
import { findPhrases, firstWord, wordCount, words } from '@/lib/text';

import { collectBullets } from '../utils/collect';
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
    label: 'Roles have bullets',
    evaluate: (resume) => {
      const empty = resume.experience.filter(
        (entry) => entry.bullets.filter((bullet) => bullet.trim()).length === 0,
      );

      if (resume.experience.length === 0) {
        return { status: 'error', message: 'No experience to describe yet.', targets: ['experience'] };
      }

      if (empty.length === 0) {
        return { status: 'pass', message: 'Every role describes what you actually did.' };
      }

      return {
        status: 'error',
        message: `${empty.length} role${empty.length === 1 ? ' has' : 's have'} no bullets.`,
        fixHint: 'A job title alone tells a reader nothing they can evaluate.',
        targets: ['experience'],
      };
    },
  },

  {
    id: 'bullets-have-metrics',
    category: 'impact',
    weight: 5,
    label: 'Measurable outcomes',
    evaluate: (resume) => {
      const bullets = collectBullets(resume);
      if (bullets.length === 0) {
        return { status: 'error', message: 'No bullets to measure.', targets: ['experience'] };
      }

      const withMetric = bullets.filter((bullet) => METRIC_PATTERN.test(bullet.text));
      const ratio = percent(withMetric.length, bullets.length);
      const status = gradeRatio(ratio);

      return {
        status,
        message: `${withMetric.length} of ${bullets.length} bullets carry a number.`,
        fixHint:
          status === 'pass'
            ? undefined
            : 'Add scale or outcome: how much, how many, how much faster, for how many people.',
        targets: ['experience', 'projects'],
      };
    },
  },

  {
    id: 'bullets-start-with-verb',
    category: 'impact',
    weight: 4,
    label: 'Action verbs',
    evaluate: (resume) => {
      const bullets = collectBullets(resume);
      if (bullets.length === 0) {
        return { status: 'error', message: 'No bullets to check.', targets: ['experience'] };
      }

      const verbs = new Set<string>(STRONG_ACTION_VERBS);
      const strong = bullets.filter((bullet) => verbs.has(firstWord(bullet.text)));
      const ratio = percent(strong.length, bullets.length);
      const status = gradeRatio(ratio);

      return {
        status,
        message: `${strong.length} of ${bullets.length} bullets open with a strong verb.`,
        fixHint:
          status === 'pass'
            ? undefined
            : 'Open with what you did: Built, Led, Cut, Migrated, Shipped — not "Worked on".',
        targets: ['experience', 'projects'],
      };
    },
  },

  {
    id: 'no-weak-phrases',
    category: 'impact',
    weight: 4,
    label: 'No filler phrases',
    evaluate: (resume) => {
      const text = [resume.summary.text, ...collectBullets(resume).map((bullet) => bullet.text)].join(' ');
      const found = findPhrases(text, WEAK_PHRASES);

      if (found.length === 0) {
        return { status: 'pass', message: 'No duty-speak or resume clichés found.' };
      }

      return {
        status: found.length > 2 ? 'error' : 'warn',
        message: `Found: ${found.slice(0, 4).join(', ')}.`,
        fixHint: 'These describe a job description, not your contribution. Replace with what changed.',
        targets: ['summary', 'experience'],
      };
    },
  },

  {
    id: 'no-first-person',
    category: 'impact',
    weight: 2,
    label: 'No first person',
    evaluate: (resume) => {
      const text = collectBullets(resume)
        .map((bullet) => bullet.text)
        .join(' ');
      const pronouns = new Set<string>(FIRST_PERSON_TOKENS);
      const found = words(text).filter((word) => pronouns.has(word.toLowerCase()));

      if (found.length === 0) {
        return { status: 'pass', message: 'Written in the implied first person, as a resume should be.' };
      }

      return {
        status: 'warn',
        message: `${found.length} first-person pronoun${found.length === 1 ? '' : 's'} in the bullets.`,
        fixHint: 'Drop "I" and "we" — the reader already knows whose resume this is.',
        targets: ['experience'],
      };
    },
  },

  {
    id: 'bullet-length',
    category: 'impact',
    weight: 3,
    label: 'Bullet length',
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
          message: `All bullets sit in the ${BULLET_WORD_RANGE.min}–${BULLET_WORD_RANGE.max} word range.`,
        };
      }

      return {
        status: offending > bullets.length / 3 ? 'error' : 'warn',
        message: `${long.length} too long, ${short.length} too thin.`,
        fixHint: 'One or two printed lines each. Longer and it is skimmed past; shorter and it says nothing.',
        targets: ['experience', 'projects'],
      };
    },
  },

  {
    id: 'verb-variety',
    category: 'impact',
    weight: 2,
    label: 'Varied openings',
    evaluate: (resume) => {
      const bullets = collectBullets(resume);
      if (bullets.length < 3) {
        return { status: 'pass', message: 'Too few bullets for repetition to matter yet.' };
      }

      const counts = new Map<string, number>();
      bullets.forEach((bullet) => {
        const verb = firstWord(bullet.text);
        if (verb) counts.set(verb, (counts.get(verb) ?? 0) + 1);
      });

      const repeated = [...counts.entries()].filter(([, count]) => count > 2);

      if (repeated.length === 0) {
        return { status: 'pass', message: 'Bullet openings are varied.' };
      }

      return {
        status: 'warn',
        message: `"${repeated[0][0]}" opens ${repeated[0][1]} bullets.`,
        fixHint: 'Repetition makes distinct achievements read as one.',
        targets: ['experience'],
      };
    },
  },
];
