import { isBlank } from '@/lib/text';

import type { AtsRule } from '../types';

/** Are the fields a recruiter — and their software — expects actually filled in? */
export const rules: AtsRule[] = [
  {
    id: 'contact-essentials',
    category: 'completeness',
    weight: 5,
    label: 'Phone and email',
    evaluate: (resume) => {
      const missing = [
        isBlank(resume.contact.phone) ? 'phone' : '',
        isBlank(resume.contact.email) ? 'email' : '',
      ].filter(Boolean);

      if (missing.length === 0) {
        return { status: 'pass', message: 'Both a phone number and an email address are present.' };
      }

      return {
        status: 'error',
        message: `No ${missing.join(' or ')} on the document.`,
        fixHint: 'A resume a recruiter cannot reply to is a resume that gets skipped.',
        targets: ['contact'],
      };
    },
  },

  {
    id: 'name-present',
    category: 'completeness',
    weight: 3,
    label: 'Name',
    evaluate: (resume) =>
      isBlank(resume.basics.fullName)
        ? {
            status: 'error',
            message: 'The document has no name on it.',
            targets: ['contact'],
          }
        : { status: 'pass', message: 'Your name is the first thing on the page.' },
  },

  {
    id: 'headline-present',
    category: 'completeness',
    weight: 2,
    label: 'Headline',
    evaluate: (resume) =>
      isBlank(resume.basics.headline)
        ? {
            status: 'warn',
            message: 'No professional headline.',
            fixHint: 'One line naming the role you want. Parsers often use it as the job-title match.',
            targets: ['contact'],
          }
        : { status: 'pass', message: 'A headline states the role you are targeting.' },
  },

  {
    id: 'summary-present',
    category: 'completeness',
    weight: 2,
    label: 'Summary',
    evaluate: (resume) =>
      isBlank(resume.summary.text)
        ? {
            status: 'warn',
            message: 'No summary or objective.',
            fixHint: 'Two to four lines. It is the only place you get to frame everything below it.',
            targets: ['summary'],
          }
        : { status: 'pass', message: 'A summary frames the rest of the document.' },
  },

  {
    id: 'experience-present',
    category: 'completeness',
    weight: 4,
    label: 'Work experience',
    evaluate: (resume) =>
      resume.experience.length === 0
        ? {
            status: 'error',
            message: 'No roles listed.',
            fixHint: 'Internships, freelance and volunteer work all count.',
            targets: ['experience'],
          }
        : {
            status: 'pass',
            message: `${resume.experience.length} role${resume.experience.length === 1 ? '' : 's'} listed.`,
          },
  },

  {
    id: 'education-present',
    category: 'completeness',
    weight: 2,
    label: 'Education',
    evaluate: (resume) =>
      resume.education.length === 0
        ? { status: 'warn', message: 'No education listed.', targets: ['education'] }
        : { status: 'pass', message: 'Education is listed.' },
  },

  {
    id: 'skills-present',
    category: 'completeness',
    weight: 3,
    label: 'Skills',
    evaluate: (resume) => {
      const total = resume.skills.reduce((count, group) => count + group.items.length, 0);

      if (total === 0) {
        return {
          status: 'error',
          message: 'No skills listed.',
          fixHint: 'This is the section keyword matching leans on hardest.',
          targets: ['skills'],
        };
      }

      if (total < 8) {
        return {
          status: 'warn',
          message: `Only ${total} skills listed.`,
          fixHint: 'Aim for 12–25 across a few groups, using the exact spellings the posting uses.',
          targets: ['skills'],
        };
      }

      return { status: 'pass', message: `${total} skills listed across ${resume.skills.length} groups.` };
    },
  },

  {
    id: 'dates-complete',
    category: 'completeness',
    weight: 3,
    label: 'Dates on every entry',
    evaluate: (resume) => {
      const undated = [
        ...resume.experience.filter((entry) => isBlank(entry.dates.start)),
        ...resume.education.filter((entry) => isBlank(entry.dates.start)),
      ];

      if (undated.length === 0) {
        return { status: 'pass', message: 'Every role and qualification has a start date.' };
      }

      return {
        status: 'warn',
        message: `${undated.length} entr${undated.length === 1 ? 'y is' : 'ies are'} missing a start date.`,
        fixHint: 'Parsers compute years of experience from these. A missing date reads as a gap.',
        targets: ['experience', 'education'],
      };
    },
  },

  {
    id: 'profile-links',
    category: 'completeness',
    weight: 1,
    label: 'Profile links',
    evaluate: (resume) => {
      const links = [resume.contact.linkedin, resume.contact.github, resume.contact.portfolio].filter(
        (link) => !isBlank(link),
      );

      return links.length > 0
        ? { status: 'pass', message: `${links.length} profile link${links.length === 1 ? '' : 's'} included.` }
        : {
            status: 'warn',
            message: 'No LinkedIn, GitHub or portfolio link.',
            targets: ['contact'],
          };
    },
  },
];
