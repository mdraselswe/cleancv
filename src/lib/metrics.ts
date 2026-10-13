/**
 * Whether a line of a CV states something measured.
 *
 * "Measured" is narrower than "contains a digit". A bullet that says it used
 * Next.js 16 and React 19 carries two numbers and no outcome, and counting it
 * would let a CV with no results at all read as quantified. What counts: a
 * figure with a unit (40%, 3x, 9 days), money, a count of people or things
 * (12 engineers, 50,000 users), or a plain larger number that is not a version
 * and not a year.
 */

/** A figure carrying its own unit: 40%, 2.5x, 15k, 9 days. */
const WITH_UNIT =
  /\d+(?:[.,]\d+)?\s*(?:%|percent\b|x\b|k\b|m\b|mn\b|bn\b|hrs?\b|hours?\b|mins?\b|minutes?\b|days?\b|weeks?\b|months?\b|ms\b)/i;

/** Money in front of or behind a figure. */
const MONEY = /(?:[$€£৳]\s*\d)|(?:\d\s*(?:usd|eur|gbp|bdt|taka)\b)/i;

/** What a small number counts when it is followed by one of these. */
const COUNTED_THINGS = [
  'engineers',
  'developers',
  'designers',
  'people',
  'members',
  'staff',
  'reports',
  'interns',
  'users',
  'customers',
  'clients',
  'students',
  'merchants',
  'teams',
  'squads',
  'markets',
  'countries',
  'regions',
  'products',
  'services',
  'applications',
  'apps',
  'platforms',
  'projects',
  'releases',
  'sprints',
  'integrations',
  'endpoints',
  'pages',
  'components',
  'repositories',
  'clusters',
  'tests',
].join('|');

const COUNTED = new RegExp(
  `\\b\\d+(?:[.,]\\d+)?\\+?\\s+(?:[\\p{L}-]+\\s+){0,2}(?:${COUNTED_THINGS})\\b`,
  'iu',
);

/** A name a version number follows: "React 19", "Next.js 16", "Node 20". */
const VERSIONED =
  /(?:\.js|\.net|\bv|\bversion|\breleases?|\bios|\bandroid|\bangular|\bphp|\bpython|\bjava|\bnode|\breact|\bnext|\bvue|\bnuxt|\bsvelte|\btailwind|\bcss|\bhtml|\bes|\bdjango|\blaravel|\bspring|\bgo|\bruby|\brails|\bwindows|\bubuntu|\bkotlin|\bswift|\bdotnet)\s*$/i;

const BARE_NUMBER = /(?<![\p{L}\p{N}.])(\d{1,3}(?:,\d{3})+|\d{2,6})(?![\p{L}\p{N}])/gu;

const isYear = (digits: string): boolean => /^(?:19|20)\d{2}$/.test(digits);

const hasStandaloneFigure = (text: string): boolean => {
  for (const match of text.matchAll(BARE_NUMBER)) {
    const digits = match[1].replace(/,/g, '');
    const at = match.index ?? 0;
    const before = text.slice(Math.max(0, at - 14), at);
    const after = text.slice(at + match[0].length, at + match[0].length + 3);

    if (isYear(digits)) continue;
    // 16.2 is a version, and so is the 16 of "Next.js 16".
    if (/^\.\d/.test(after)) continue;
    if (VERSIONED.test(before)) continue;
    // A figure inside a date range or a phone number is not a result.
    if (/[-–/]\s*$/.test(before) || /^\s*[-–/]\s*\d/.test(after)) continue;

    return true;
  }

  return false;
};

export const hasMetric = (text: string): boolean =>
  WITH_UNIT.test(text) || MONEY.test(text) || COUNTED.test(text) || hasStandaloneFigure(text);

/** Words that say something got better or worse, as opposed to just being done. */
const CHANGE =
  /\b(?:reduc|cut|decreas|lower|shorten|improv|increas|boost|rais|grew|grow|doubl|tripl|sav|accelerat|speed|eliminat|halv|fewer|faster|slower|from)\w*/i;

/** "from 9 days to 4", "from 4.2s to 1.8s". */
const BEFORE_AFTER = /\bfrom\b[^;]{0,40}\d[^;]{0,40}\bto\b[^;]{0,25}\d/i;

/**
 * Whether a line says what changed, with a figure: a before and after, or a
 * change word beside a measured number. "Mentored 3+ engineers" is measured
 * but states no change, so it is a scale, not an outcome.
 */
export const hasOutcome = (text: string): boolean =>
  BEFORE_AFTER.test(text) || (hasMetric(text) && CHANGE.test(text));

/** A figure counting people, users, products or money — how big the work was. */
const LARGE_FIGURE = /\b\d[\d,.]*\+?\s*(?:k|m|million|thousand|billion)\b/i;

/** Whether a line says how large the work was. */
export const hasScale = (text: string): boolean =>
  COUNTED.test(text) || MONEY.test(text) || LARGE_FIGURE.test(text);

/**
 * The question that gets a number out of this line, from what the line says.
 * Never a number itself: a made-up figure is worse than none.
 */
export const metricPrompt = (text: string): string => {
  const t = text.toLowerCase();
  const has = (pattern: RegExp) => pattern.test(t);

  if (has(/\b(mentor|coach|led|lead|guid|manag|train)/)) {
    return 'How many people, over how long, and what did they ship or grow into?';
  }
  if (has(/\b(perform|speed|fast|latency|load|render|ssr|ssg|isr|cach|optimi[sz]|bundle|re-render)/)) {
    return 'By how much: load time before → after, Lighthouse score, or bundle size?';
  }
  if (has(/\b(deploy|pipeline|ci\b|cd\b|build|release|automat)/)) {
    return 'How long did it take before and after, or how many releases or deploys does it run?';
  }
  if (has(/\b(test|lint|quality|bug|incident|production issue|static analysis)/)) {
    return 'How many bugs or incidents fewer, or what test coverage did it reach?';
  }
  if (has(/\b(compon|librar|reusable|standardi[sz]|pattern|storybook|documentation|polyfill)/)) {
    return 'How many screens, products or teams use it, or how much faster did a new page ship?';
  }
  if (has(/\b(integrat|api|third-party|service|sync|workflow)/)) {
    return 'How many services, requests or users go through it?';
  }
  if (has(/\b(develop|built|build|launch|feature|platform|app|application|erp|e-commerce)/)) {
    return 'How many users, orders or pages does it serve, or how much time did it save?';
  }

  return 'What number would prove this: users, time saved, percent change or a count?';
};
