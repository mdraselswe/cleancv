/**
 * Month handling.
 *
 * Resume dates are stored as `YYYY-MM` and rendered as `MM/YYYY`. Consistency
 * here is an ATS formatting rule, so every template routes through these helpers
 * rather than formatting inline.
 */

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export interface ParsedMonth {
  year: number;
  /** 1-12. */
  month: number;
}

export const parseMonth = (value: string): ParsedMonth | null => {
  const match = MONTH_PATTERN.exec(value.trim());
  if (!match) return null;

  return { year: Number(match[1]), month: Number(match[2]) };
};

export const isValidMonth = (value: string): boolean => parseMonth(value) !== null;

/** `2022-12` -> `12/2022`. Invalid or empty input renders as ''. */
export const formatMonth = (value: string): string => {
  const parsed = parseMonth(value);
  if (!parsed) return '';

  return `${String(parsed.month).padStart(2, '0')}/${parsed.year}`;
};

/** `2022-12` -> `Dec 2022`. For templates that prefer words to slashes. */
export const formatMonthShort = (value: string): string => {
  const parsed = parseMonth(value);
  if (!parsed) return '';

  return `${MONTH_SHORT[parsed.month - 1]} ${parsed.year}`;
};

export interface DateRangeInput {
  start: string;
  end: string;
  current: boolean;
}

export interface FormatRangeOptions {
  /** Word form (`Dec 2022`) instead of numeric (`12/2022`). */
  long?: boolean;
  presentLabel?: string;
  separator?: string;
}

/**
 * Renders a range, tolerating a missing half: a start with no end reads
 * `12/2022 - Present` only when `current` is set, otherwise just `12/2022`.
 */
export const formatDateRange = (
  range: DateRangeInput,
  { long = false, presentLabel = 'Present', separator = ' - ' }: FormatRangeOptions = {},
): string => {
  const format = long ? formatMonthShort : formatMonth;
  const start = format(range.start);
  const end = range.current ? presentLabel : format(range.end);

  if (start && end) return `${start}${separator}${end}`;
  return start || end;
};

/** Sort key for reverse-chronological ordering; undated entries sink to the bottom. */
export const monthSortValue = (value: string): number => {
  const parsed = parseMonth(value);
  if (!parsed) return -1;

  return parsed.year * 12 + parsed.month;
};

/** An ongoing entry outranks every dated one. */
export const rangeSortValue = (range: DateRangeInput): number => {
  if (range.current) return Number.MAX_SAFE_INTEGER;

  return Math.max(monthSortValue(range.end), monthSortValue(range.start));
};

export const isRangeReversed = (range: DateRangeInput): boolean => {
  if (range.current) return false;

  const start = monthSortValue(range.start);
  const end = monthSortValue(range.end);
  if (start < 0 || end < 0) return false;

  return end < start;
};

/** `DD/MM/YYYY` for declaration blocks, which are dated on the day of signing. */
export const formatToday = (date = new Date()): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}/${month}/${date.getFullYear()}`;
};

/**
 * "3 minutes ago", for save timestamps.
 *
 * `Intl.RelativeTimeFormat` rather than a hand-rolled ladder, so the phrasing
 * follows the reader's locale instead of English word order.
 */
const RELATIVE_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.348],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY],
];

export const formatRelativeTime = (timestamp: number, now = Date.now()): string => {
  if (!timestamp) return 'কখনো না';

  const formatter = new Intl.RelativeTimeFormat('bn', { numeric: 'auto' });
  let amount = (timestamp - now) / 1000;

  for (const [unit, step] of RELATIVE_STEPS) {
    if (Math.abs(amount) < step) return formatter.format(Math.round(amount), unit);
    amount /= step;
  }

  return formatter.format(Math.round(amount), 'year');
};
