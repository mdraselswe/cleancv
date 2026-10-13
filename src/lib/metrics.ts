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
