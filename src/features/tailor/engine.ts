import { KEYWORD_STOPWORDS, LIMITS } from '@/constants';
import { collectText, extractJobKeywords } from '@/features/ats';
import { createSkillGroup, type Resume } from '@/features/resume';
import { isBlank, stripEmphasis, tokenSet } from '@/lib/text';

/**
 * Tailoring a CV to a job posting, without a model.
 *
 * Everything here is a reordering, an emphasis, or something the reader
 * ticked: no sentence is written and no fact is added. That is the point. A
 * tool that invents "5 years of Kubernetes" for a posting that asks for it is
 * a tool that gets its user caught in an interview; this one can only make
 * what is already true easier to find.
 *
 * Pure functions on plain data — the dialog previews counts by calling
 * `applyTailor` on every change, so it must stay cheap and must never mutate
 * the resume it is given.
 */

export interface TailorOptions {
  /** Skill groups, and the skills inside them, the posting asks for first. */
  reorderSkills: boolean;
  /** Inside each role or project, the bullets that match the posting first. */
  reorderBullets: boolean;
  /** Bold up to two matching terms in each bullet. */
  boldKeywords: boolean;
  /** A closing sentence naming the matched skills the reader already lists. */
  addSummaryLine: boolean;
  /** Terms the reader confirmed they really have, added to a skills group. */
  addSkills: readonly string[];
  /** Which group they go into; blank means the first, or a new one. */
  addSkillsGroupId: string;
}

export const DEFAULT_TAILOR_OPTIONS: TailorOptions = {
  reorderSkills: true,
  reorderBullets: true,
  boldKeywords: true,
  addSummaryLine: false,
  addSkills: [],
  addSkillsGroupId: '',
};

export interface TailorStats {
  skillsMoved: number;
  bulletsMoved: number;
  keywordsBolded: number;
  skillsAdded: number;
  summaryLineAdded: boolean;
}

export interface TailorAnalysis {
  keywords: string[];
  matched: string[];
  missing: string[];
  /** Skills the reader already lists that the posting asks for, most-asked first. */
  matchedSkills: string[];
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A token reduced to what a keyword looks like: no trailing punctuation. */
const normal = (token: string): string => token.toLowerCase().replace(/[.'-]+$/g, '');

const relevance = (text: string, keywords: ReadonlySet<string>): number => {
  let score = 0;

  for (const token of tokenSet(stripEmphasis(text))) {
    if (keywords.has(token) || keywords.has(normal(token))) score += 1;
  }

  return score;
};

/** A stable sort by score, descending, that also says whether anything moved. */
const orderBy = <T>(items: readonly T[], score: (item: T) => number): { sorted: T[]; moved: number } => {
  const ranked = items.map((item, index) => ({ item, index, score: score(item) }));

  ranked.sort((a, b) => b.score - a.score || a.index - b.index);

  return {
    sorted: ranked.map((entry) => entry.item),
    moved: ranked.filter((entry, position) => entry.index !== position).length,
  };
};

export const analyzeTailor = (resume: Resume, jobDescription: string): TailorAnalysis => {
  /*
   * The score's extractor keeps a sentence's closing full stop on the last
   * word ("experience." is not "experience"), which is harmless for a number
   * but reads as noise in a list the reader will tick through. Cleaned here,
   * on both sides of the comparison, rather than by changing how the score
   * tokenises.
   */
  const keywords = [
    ...new Set(
      extractJobKeywords(jobDescription)
        .map(normal)
        .filter((keyword) => keyword.length >= 3 && !KEYWORD_STOPWORDS.has(keyword)),
    ),
  ];
  const present = new Set([...tokenSet(collectText(resume))].map(normal));
  const matched = keywords.filter((keyword) => present.has(keyword));
  const missing = keywords.filter((keyword) => !present.has(keyword));
  const rank = new Map(keywords.map((keyword, index) => [keyword, index]));
  const keywordSet = new Set(keywords);

  const matchedSkills = resume.skills
    .flatMap((group) => group.items)
    .filter((item) => !isBlank(item) && relevance(item, keywordSet) > 0)
    .sort((a, b) => {
      const best = (item: string) =>
        Math.min(
          ...[...tokenSet(item)].map((token) => rank.get(normal(token)) ?? Number.MAX_SAFE_INTEGER),
        );

      return best(a) - best(b);
    });

  return { keywords, matched, missing, matchedSkills };
};

/**
 * The spelling the posting itself uses for a term, since extraction lowercases.
 * "kubernetes" becomes "Kubernetes" and "node.js" stays "Node.js".
 */
export const spellingIn = (jobDescription: string, keyword: string): string => {
  const match = new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(keyword)}(?![\\p{L}\\p{N}])`,
    'iu',
  ).exec(jobDescription);

  return match ? match[0] : keyword;
};

/** Where a term sits in a bullet, as a half-open range, or null. */
const locate = (text: string, keyword: string): [number, number] | null => {
  const match = new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(keyword)}(?![\\p{L}\\p{N}])`,
    'iu',
  ).exec(text);

  return match ? [match.index, match.index + match[0].length] : null;
};

/** Bolds up to `max` matching terms, never inside existing formatting or a link. */
const emphasise = (
  text: string,
  keywords: readonly string[],
  max = 2,
): { text: string; count: number } => {
  if (text.includes('**') || text.includes('](') || text.includes('~~')) {
    return { text, count: 0 };
  }

  const taken: Array<[number, number]> = [];

  for (const keyword of keywords) {
    if (taken.length >= max) break;

    const range = locate(text, keyword);
    if (!range) continue;

    const overlaps = taken.some(([start, end]) => range[0] < end && range[1] > start);
    if (!overlaps) taken.push(range);
  }

  if (taken.length === 0) return { text, count: 0 };

  let next = text;

  for (const [start, end] of [...taken].sort((a, b) => b[0] - a[0])) {
    next = `${next.slice(0, start)}**${next.slice(start, end)}**${next.slice(end)}`;
  }

  // A marker pair is four characters; a bullet at its ceiling is left alone.
  return next.length > LIMITS.bulletChars ? { text, count: 0 } : { text: next, count: taken.length };
};

const joinNames = (names: readonly string[]): string =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

export const applyTailor = (
  resume: Resume,
  jobDescription: string,
  options: TailorOptions,
): { resume: Resume; stats: TailorStats } => {
  const next = structuredClone(resume) as Resume;
  const analysis = analyzeTailor(resume, jobDescription);
  const keywordSet = new Set(analysis.keywords);
  const stats: TailorStats = {
    skillsMoved: 0,
    bulletsMoved: 0,
    keywordsBolded: 0,
    skillsAdded: 0,
    summaryLineAdded: false,
  };

  if (analysis.keywords.length === 0) return { resume: next, stats };

  // Skills the reader confirmed they have go in first, so the reorder sees them.
  if (options.addSkills.length > 0) {
    const existing = new Set(next.skills.flatMap((group) => group.items.map((item) => item.toLowerCase())));
    const fresh = options.addSkills
      .map((keyword) => spellingIn(jobDescription, keyword))
      .filter((skill) => !existing.has(skill.toLowerCase()));

    if (fresh.length > 0) {
      let group = next.skills.find((entry) => entry.id === options.addSkillsGroupId) ?? next.skills[0];

      if (!group) {
        group = createSkillGroup('Skills');
        next.skills.push(group);
      }

      const room = Math.max(0, LIMITS.skillsPerGroup - group.items.length);

      group.items.push(...fresh.slice(0, room));
      stats.skillsAdded = Math.min(fresh.length, room);
    }
  }

  if (options.reorderSkills) {
    for (const group of next.skills) {
      const { sorted, moved } = orderBy(group.items, (item) => relevance(item, keywordSet));

      group.items = sorted;
      stats.skillsMoved += moved;
    }

    const { sorted, moved } = orderBy(next.skills, (group) =>
      group.items.reduce((total, item) => total + relevance(item, keywordSet), 0),
    );

    next.skills = sorted;
    stats.skillsMoved += moved;
  }

  const entries = [...next.experience, ...next.projects, ...next.volunteering];

  if (options.reorderBullets) {
    for (const entry of entries) {
      const { sorted, moved } = orderBy(entry.bullets, (bullet) => relevance(bullet, keywordSet));

      entry.bullets = sorted;
      stats.bulletsMoved += moved;
    }
  }

  if (options.boldKeywords) {
    for (const entry of entries) {
      entry.bullets = entry.bullets.map((bullet) => {
        const result = emphasise(bullet, analysis.matched);

        stats.keywordsBolded += result.count;

        return result.text;
      });
    }
  }

  if (options.addSummaryLine && !isBlank(next.summary.text)) {
    const names = analysis.matchedSkills.slice(0, 3);
    const sentence = names.length >= 2 ? `Strong in ${joinNames(names)}.` : '';
    const base = next.summary.text.trim();
    const joined = `${base}${/[.!?]$/.test(base) ? '' : '.'} ${sentence}`;

    if (
      sentence &&
      !base.toLowerCase().includes('strong in') &&
      joined.length <= LIMITS.summaryChars
    ) {
      next.summary.text = joined;
      stats.summaryLineAdded = true;
    }
  }

  return { resume: next, stats };
};

/** A name for the copy from the posting's first line, when that line is short enough to be a title. */
export const suggestJobName = (jobDescription: string): string => {
  const first = jobDescription
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  if (!first || first.length > 60) return '';

  return first.replace(/[:\-–—|]+$/g, '').trim();
};
