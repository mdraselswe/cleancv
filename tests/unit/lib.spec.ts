import { describe, expect, it } from 'vitest';

import { moveItem, uniqueStrings, updateById } from '@/lib/array';
import { formatDateRange, formatMonth, isRangeReversed, rangeSortValue } from '@/lib/date';
import { containsPhrase, joinNonEmpty, stripEmphasis, toFileStem, wordCount } from '@/lib/text';
import { displayUrl, ensureProtocol } from '@/lib/url';

describe('date', () => {
  it('formats a month as MM/YYYY and ignores malformed input', () => {
    expect(formatMonth('2022-12')).toBe('12/2022');
    expect(formatMonth('2022-13')).toBe('');
    expect(formatMonth('')).toBe('');
  });

  it('renders an ongoing range as Present only when current is set', () => {
    expect(formatDateRange({ start: '2022-12', end: '', current: true })).toBe('12/2022 - Present');
    expect(formatDateRange({ start: '2022-12', end: '', current: false })).toBe('12/2022');
  });

  it('sorts an ongoing role above every dated one', () => {
    const ongoing = rangeSortValue({ start: '2020-01', end: '', current: true });
    const past = rangeSortValue({ start: '2024-01', end: '2025-01', current: false });

    expect(ongoing).toBeGreaterThan(past);
  });

  it('detects a range that ends before it starts', () => {
    expect(isRangeReversed({ start: '2022-05', end: '2021-05', current: false })).toBe(true);
    expect(isRangeReversed({ start: '2022-05', end: '2023-05', current: false })).toBe(false);
    // An open range cannot be reversed, whatever the stale end value says.
    expect(isRangeReversed({ start: '2022-05', end: '2001-05', current: true })).toBe(false);
  });
});

describe('text', () => {
  it('counts words without punctuation inflating the total', () => {
    expect(wordCount('Cut build time by 40%, across 12 repos.')).toBe(8);
    expect(wordCount('')).toBe(0);
  });

  it('matches phrases on word boundaries only', () => {
    expect(containsPhrase('I was responsible for the API', 'responsible for')).toBe(true);
    expect(containsPhrase('irresponsible forecasting', 'responsible for')).toBe(false);
  });

  it('drops blank parts when joining a meta line', () => {
    expect(joinNonEmpty(['12/2022', '', 'Dhaka', undefined])).toBe('12/2022 • Dhaka');
    expect(joinNonEmpty(['', null])).toBe('');
  });

  it('makes a safe filename stem', () => {
    expect(toFileStem('Muhammad Rasel — Senior Engineer')).toBe('Muhammad-Rasel-Senior-Engineer');
    expect(toFileStem('///')).toBe('resume');
  });
});

describe('url', () => {
  it('prints the destination and links the full address', () => {
    expect(displayUrl('https://www.linkedin.com/in/someone/')).toBe('linkedin.com/in/someone');
    expect(ensureProtocol('github.com/x')).toBe('https://github.com/x');
    expect(ensureProtocol('mailto:a@b.c')).toBe('mailto:a@b.c');
  });
});

describe('array', () => {
  it('moves an item and clamps out-of-range targets', () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 0, 99)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 5, 0)).toEqual([1, 2, 3]);
  });

  it('updates by id without touching the rest', () => {
    const list = [{ id: 'a', n: 1 }, { id: 'b', n: 2 }];
    expect(updateById(list, 'b', { n: 9 })).toEqual([{ id: 'a', n: 1 }, { id: 'b', n: 9 }]);
    expect(list[1].n).toBe(2);
  });

  it('de-duplicates case-insensitively, keeping the first spelling', () => {
    expect(uniqueStrings(['React', 'react', 'Next.js', ''])).toEqual(['React', 'Next.js']);
  });
});

describe('stripEmphasis', () => {
  it('removes the markers and keeps the words', () => {
    expect(stripEmphasis('achieving a **40% improvement** in speed')).toBe(
      'achieving a 40% improvement in speed',
    );
  });

  it('leaves text without markers untouched', () => {
    expect(stripEmphasis('no emphasis here')).toBe('no emphasis here');
  });

  it('ignores an unclosed marker rather than eating the rest of the line', () => {
    expect(stripEmphasis('a **dangling marker')).toBe('a **dangling marker');
  });
});
