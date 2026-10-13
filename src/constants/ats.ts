/** Weights, thresholds and word lists used by the ATS scoring engine. */

export const ATS_CATEGORIES = [
  'parseability',
  'completeness',
  'impact',
  'formatting',
  'keywords',
] as const;

export type AtsCategory = (typeof ATS_CATEGORIES)[number];

export const ATS_CATEGORY_WEIGHT: Record<AtsCategory, number> = {
  parseability: 30,
  completeness: 20,
  impact: 25,
  formatting: 15,
  keywords: 10,
};

export const ATS_CATEGORY_LABEL: Record<AtsCategory, string> = {
  parseability: 'Parseability',
  completeness: 'Completeness',
  impact: 'Content impact',
  formatting: 'Formatting',
  keywords: 'Keyword match',
};

export const ATS_CATEGORY_DESCRIPTION: Record<AtsCategory, string> = {
  parseability: 'Whether an automated parser can read the document at all.',
  completeness: 'Whether the sections and fields a recruiter expects are present.',
  impact: 'Whether your bullets show measurable outcomes rather than duties.',
  formatting: 'Consistency of dates, length and structure.',
  keywords: 'Overlap with the job description you are targeting.',
};

export type AtsStatus = 'pass' | 'warn' | 'error';

/** Fraction of a rule's weight retained at each status. */
export const ATS_STATUS_CREDIT: Record<AtsStatus, number> = {
  pass: 1,
  warn: 0.5,
  error: 0,
};

export const ATS_SCORE_BANDS = [
  { min: 90, label: 'Excellent', tone: 'excellent' },
  { min: 75, label: 'Strong', tone: 'strong' },
  { min: 55, label: 'Needs work', tone: 'fair' },
  { min: 0, label: 'At risk', tone: 'poor' },
] as const;

/**
 * How far weak content holds the whole score down.
 *
 * A CV can be flawless to a machine — one column, clean text layer, every
 * heading standard — and still say nothing a recruiter can use. Additive
 * scoring let that read as 92. The overall number is therefore also capped by
 * how much the content proves: with no evidence at all it stops at `floor`,
 * and it rises by `slope` points for each point of content strength.
 */
export const ATS_CONTENT_CEILING = { floor: 50, slope: 0.5 } as const;

export type AtsScoreTone = (typeof ATS_SCORE_BANDS)[number]['tone'];

/** Bullets outside this word range read as either thin or bloated. */
export const BULLET_WORD_RANGE = { min: 8, max: 30 } as const;

export const SUMMARY_WORD_RANGE = { min: 25, max: 90 } as const;

/** A resume above this page count loses recruiter attention; academic CVs are exempt. */
export const MAX_RESUME_PAGES = 2;

/** Phrases that describe duties instead of outcomes. */
export const WEAK_PHRASES = [
  'responsible for',
  'duties included',
  'tasked with',
  'worked on',
  'helped with',
  'assisted with',
  'involved in',
  'participated in',
  'in charge of',
  'hard worker',
  'team player',
  'go-getter',
  'think outside the box',
  'detail oriented',
  'detail-oriented',
  'results driven',
  'results-driven',
] as const;

/** First-person markers; a resume is written in implied first person without pronouns. */
export const FIRST_PERSON_TOKENS = ['i', 'me', 'my', 'mine', 'myself', 'we', 'our'] as const;

/** Openers that signal ownership. Used to check the first word of each bullet. */
export const STRONG_ACTION_VERBS = [
  'accelerated', 'achieved', 'architected', 'authored', 'automated', 'built', 'championed',
  'consolidated', 'converted', 'created', 'cut', 'delivered', 'deployed', 'designed',
  'developed', 'devised', 'diagnosed', 'directed', 'doubled', 'drove', 'eliminated',
  'engineered', 'enhanced', 'established', 'expanded', 'expedited', 'generated', 'grew',
  'implemented', 'improved', 'increased', 'initiated', 'instituted', 'integrated',
  'introduced', 'launched', 'led', 'maintained', 'managed', 'mentored', 'migrated',
  'modernised', 'modernized', 'negotiated', 'optimised', 'optimized', 'orchestrated',
  'overhauled', 'pioneered', 'produced', 'redesigned', 'reduced', 'refactored',
  'resolved', 'restructured', 'revamped', 'scaled', 'secured', 'shipped', 'simplified',
  'spearheaded', 'standardised', 'standardized', 'streamlined', 'strengthened',
  'transformed', 'tripled', 'unified', 'upgraded',
] as const;

/**
 * Body type size, in points, on the printed page.
 *
 * Below `warn` is small enough that a printout is tiring to read; below `error`
 * a reader holds it closer. Measured from the rendered design, not guessed from
 * a setting, because a design's own base size and the Text size slider multiply.
 */
export const BODY_TEXT_PT = { warn: 9, error: 8 } as const;

/** Unicode Private Use Area — where icon fonts hide, and where ATS text extraction breaks. */
export const PUA_PATTERN = /[\uE000-\uF8FF]/;

export const REPLACEMENT_CHAR_PATTERN = /\uFFFD/;

/** Tokens too generic to count as a keyword match. */
export const KEYWORD_STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'in',
  'is', 'it', 'of', 'on', 'or', 'that', 'the', 'to', 'with', 'you', 'your', 'we', 'our',
  'will', 'work', 'working', 'experience', 'years', 'year', 'team', 'teams', 'role',
  'candidate', 'ability', 'strong', 'good', 'plus', 'etc', 'job', 'about', 'this',
]);

export const KEYWORD_MATCH_TARGET = 0.6;
