import { KEYWORD_MATCH_TARGET } from '@/constants';
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
    label: 'Job description match',
    evaluate: (resume, { jobKeywords }) => {
      if (jobKeywords.length === 0) {
        return {
          status: 'pass',
          message: 'No job description pasted yet.',
          fixHint: 'Paste one to see which of its terms your resume is missing.',
        };
      }

      const { matched, missing, coverage } = matchKeywords(resume, jobKeywords);
      const percent = Math.round(coverage * 100);

      if (coverage >= KEYWORD_MATCH_TARGET) {
        return {
          status: 'pass',
          message: `${percent}% of the posting's key terms appear (${matched.length}/${jobKeywords.length}).`,
        };
      }

      return {
        status: coverage >= KEYWORD_MATCH_TARGET / 2 ? 'warn' : 'error',
        message: `Only ${percent}% of the posting's key terms appear.`,
        fixHint: `Missing: ${missing.slice(0, 8).join(', ')}. Use the posting's own spellings where they are honestly true of you.`,
        targets: ['skills', 'summary', 'experience'],
      };
    },
  },

  {
    id: 'skills-evidenced',
    category: 'keywords',
    weight: 3,
    label: 'Skills backed by experience',
    evaluate: (resume) => {
      const skills = collectSkills(resume);
      if (skills.length === 0) {
        return { status: 'error', message: 'No skills listed.', targets: ['skills'] };
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
          message: `${backed.length} of ${skills.length} skills also appear in your experience.`,
        };
      }

      return {
        status: 'warn',
        message: `Only ${backed.length} of ${skills.length} skills appear anywhere else on the resume.`,
        fixHint:
          'A skills list nothing supports reads as a wish list. Name the important ones inside the bullets where you used them.',
        targets: ['experience', 'skills'],
      };
    },
  },
];
