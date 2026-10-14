/**
 * Bangla numerals.
 *
 * The interface shows every number in Bangla digits, so a score reads "৯২" and
 * a count "৩টি". What is *stored* and *sent* is never touched: this is for
 * display only, and the CV document keeps whatever digits its author typed.
 */

const DIGITS = '০১২৩৪৫৬৭৮৯';

/** Replaces every ASCII digit in `value` with its Bangla one. */
export const bn = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => DIGITS[Number(digit)]);

/** A percentage, as the interface prints it: ৯২%. */
export const bnPercent = (value: number): string => `${bn(Math.round(value))}%`;
