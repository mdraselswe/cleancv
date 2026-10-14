import { KEYWORD_STOPWORDS } from '@/constants';
import type { Resume } from '@/features/resume';
import { isBlank, stripEmphasis, tokenSet, words } from '@/lib/text';

/**
 * Flattens a resume into the shapes the rules need.
 *
 * Pure and memo-friendly: every rule reads from these rather than walking the
 * document again, so scoring stays cheap enough to run on every keystroke.
 */

export interface BulletRef {
  /** Where it lives, for the panel's navigation. */
  source: 'experience' | 'education' | 'projects' | 'volunteering';
  entryId: string;
  index: number;
  text: string;
}

export const collectBullets = (resume: Resume): BulletRef[] => {
  const bullets: BulletRef[] = [];

  const push = (source: BulletRef['source'], entries: Array<{ id: string; bullets: string[] }>) => {
    entries.forEach((entry) => {
      entry.bullets.forEach((text, index) => {
        // `**bold**` is styling; every rule here is about the words themselves.
        if (!isBlank(text)) {
          bullets.push({ source, entryId: entry.id, index, text: stripEmphasis(text) });
        }
      });
    });
  };

  push('experience', resume.experience);
  push('education', resume.education);
  push('projects', resume.projects);
  push('volunteering', resume.volunteering);

  return bullets;
};

const SOURCE_LABEL: Record<BulletRef['source'], string> = {
  experience: 'অভিজ্ঞতা',
  education: 'শিক্ষা',
  projects: 'প্রজেক্ট',
  volunteering: 'স্বেচ্ছাসেবা',
};

/** Where a bullet lives, in the words the reader would use: "Senior Engineer · Acme". */
export const describeBullet = (resume: Resume, ref: BulletRef): string => {
  const pick = (entry: Record<string, unknown> | undefined, keys: string[]): string =>
    keys
      .map((key) => (typeof entry?.[key] === 'string' ? (entry[key] as string).trim() : ''))
      .filter(Boolean)
      .slice(0, 2)
      .join(' · ');

  const lists: Record<BulletRef['source'], Array<Record<string, unknown>>> = {
    experience: resume.experience as unknown as Array<Record<string, unknown>>,
    education: resume.education as unknown as Array<Record<string, unknown>>,
    projects: resume.projects as unknown as Array<Record<string, unknown>>,
    volunteering: resume.volunteering as unknown as Array<Record<string, unknown>>,
  };
  const entry = lists[ref.source].find((candidate) => candidate.id === ref.entryId);

  return (
    pick(entry, ['role', 'degree', 'name', 'company', 'organization']) ||
    SOURCE_LABEL[ref.source]
  );
};

/** A bullet cut to one readable line for a list of findings. */
export const quoteBullet = (text: string, max = 78): string => {
  const flat = text.replace(/\s+/g, ' ').trim();

  return `“${flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat}”`;
};

/** Every skill the user listed, flattened across groups. */
export const collectSkills = (resume: Resume): string[] =>
  resume.skills.flatMap((group) => group.items).filter((item) => !isBlank(item));

/** All prose a parser would read. Used for keyword matching and phrase checks. */
export const collectText = (resume: Resume): string =>
  [
    resume.basics.headline,
    stripEmphasis(resume.summary.text),
    ...collectBullets(resume).map((bullet) => bullet.text),
    ...collectSkills(resume),
    ...resume.experience.map((entry) => `${entry.role} ${entry.company} ${entry.tech.join(' ')}`),
    ...resume.projects.map((entry) => `${entry.name} ${entry.subtitle} ${entry.tech.join(' ')}`),
    ...resume.education.map((entry) => `${entry.degree} ${entry.major} ${entry.institute}`),
    ...resume.certifications.map((entry) => `${entry.name} ${entry.issuer}`),
    ...resume.achievements.map((entry) => `${entry.title} ${entry.description}`),
    // A custom section is prose a parser reads like any other, so it counts
    // toward keyword coverage and the phrase checks.
    ...resume.customSections
      .filter((section) => section.enabled)
      .map((section) => `${section.heading} ${section.text} ${section.bullets.join(' ')}`),
  ].join(' ');

/**
 * Meaningful tokens from a job description.
 *
 * Stopwords and one-character tokens are dropped, and the result is ordered by
 * frequency so the panel can show what the posting actually stresses.
 */
export const extractJobKeywords = (jobDescription: string, limit = 40): string[] => {
  if (isBlank(jobDescription)) return [];

  const counts = new Map<string, number>();

  words(jobDescription).forEach((word) => {
    const token = word.toLowerCase();
    if (token.length < 3 || KEYWORD_STOPWORDS.has(token)) return;
    if (/^\d+$/.test(token)) return;

    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
};

export interface KeywordCoverage {
  matched: string[];
  missing: string[];
  coverage: number;
}

export const matchKeywords = (resume: Resume, keywords: string[]): KeywordCoverage => {
  if (keywords.length === 0) return { matched: [], missing: [], coverage: 1 };

  const present = tokenSet(collectText(resume));
  const matched = keywords.filter((keyword) => present.has(keyword));
  const missing = keywords.filter((keyword) => !present.has(keyword));

  return { matched, missing, coverage: matched.length / keywords.length };
};
