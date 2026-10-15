import type { Resume } from '@/features/resume';
import { AI_POLISH, yearsSince } from '@/lib/aiPolish';
import { stripEmphasis } from '@/lib/text';

/**
 * The CV, as a plain-text digest a model can write a summary from.
 *
 * Only what the document already says - nothing derived except the one number
 * that is arithmetic rather than opinion, the years since the earliest job. The
 * route refuses a summary containing a number that is not in this text, so
 * whatever is left out here cannot be claimed there.
 *
 * Ordered by how much a recruiter weighs it, and cut from the end: when a long
 * CV overflows the cap, the oldest projects go before the current job does.
 */

const clip = (value: string, length: number): string =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

const plain = (value: string): string => stripEmphasis(value).replace(/\s+/g, ' ').trim();

const span = (start: string, end: string, current: boolean): string => {
  if (!start && !end && !current) return '';

  return ` (${start || '?'} - ${current ? 'present' : end || '?'})`;
};

export const buildResumeFacts = (resume: Resume): string => {
  const lines: string[] = [];

  if (resume.basics.headline.trim()) lines.push(`Current headline: ${plain(resume.basics.headline)}`);

  const starts = resume.experience
    .map((entry) => entry.dates.start)
    .map((month) => yearsSince(month))
    .filter((value): value is number => value !== null);

  if (starts.length > 0) lines.push(`Years of experience: ${Math.max(...starts)}`);

  if (resume.experience.length > 0) {
    lines.push('', 'Experience:');

    for (const entry of resume.experience) {
      const title = [plain(entry.role), plain(entry.company)].filter(Boolean).join(' at ');
      if (!title) continue;

      lines.push(`- ${title}${span(entry.dates.start, entry.dates.end, entry.dates.current)}`);
      if (entry.tech.length > 0) lines.push(`  Tech: ${entry.tech.join(', ')}`);
      for (const bullet of entry.bullets) {
        if (plain(bullet)) lines.push(`  * ${clip(plain(bullet), 240)}`);
      }
    }
  }

  const skills = resume.skills.filter((group) => group.items.length > 0);

  if (skills.length > 0) {
    lines.push('', 'Skills:');
    for (const group of skills) {
      lines.push(`- ${plain(group.category) || 'Skills'}: ${group.items.join(', ')}`);
    }
  }

  if (resume.education.length > 0) {
    lines.push('', 'Education:');
    for (const entry of resume.education) {
      const line = [plain(entry.degree), plain(entry.major), plain(entry.institute)]
        .filter(Boolean)
        .join(', ');
      if (line) lines.push(`- ${line}`);
    }
  }

  if (resume.projects.length > 0) {
    lines.push('', 'Projects:');

    for (const entry of resume.projects) {
      const title = [plain(entry.name), plain(entry.subtitle)].filter(Boolean).join(' - ');
      if (!title) continue;

      lines.push(`- ${title}`);
      if (entry.tech.length > 0) lines.push(`  Tech: ${entry.tech.join(', ')}`);
      for (const bullet of entry.bullets) {
        if (plain(bullet)) lines.push(`  * ${clip(plain(bullet), 240)}`);
      }
    }
  }

  const credentials = [
    ...resume.certifications.map((entry) => plain(entry.name)),
    ...resume.achievements.map((entry) => plain(entry.title)),
  ].filter(Boolean);

  if (credentials.length > 0) lines.push('', `Certifications and achievements: ${credentials.join('; ')}`);

  return clip(lines.join('\n'), AI_POLISH.maxFactsChars);
};
