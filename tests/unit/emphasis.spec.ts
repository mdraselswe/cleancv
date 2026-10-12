import { describe, expect, it } from 'vitest';

import { parseEmphasis, serializeEmphasis, stripEmphasis } from '@/lib/emphasis';

const roundTrip = (value: string) => serializeEmphasis(parseEmphasis(value));

describe('parseEmphasis', () => {
  it('reads bold, italic and both', () => {
    expect(parseEmphasis('a **b** _c_ **_d_**')).toEqual([
      { text: 'a ', bold: false, italic: false },
      { text: 'b', bold: true, italic: false },
      { text: ' ', bold: false, italic: false },
      { text: 'c', bold: false, italic: true },
      { text: ' ', bold: false, italic: false },
      { text: 'd', bold: true, italic: true },
    ]);
  });

  it('leaves a marker with no partner as text', () => {
    expect(stripEmphasis('a **dangling marker')).toBe('a **dangling marker');
    expect(stripEmphasis('a _dangling marker')).toBe('a _dangling marker');
  });

  it('never treats an underscore inside a word as emphasis', () => {
    expect(stripEmphasis('see my_file_name and snake_case_here')).toBe(
      'see my_file_name and snake_case_here',
    );
    expect(stripEmphasis('https://example.com/a_b_c')).toBe('https://example.com/a_b_c');
  });

  it('does not span lines', () => {
    expect(stripEmphasis('**a\nb**')).toBe('**a\nb**');
  });
});

describe('stripEmphasis', () => {
  it('drops both kinds of marker and keeps the words', () => {
    expect(stripEmphasis('cut **40%** of _all_ cost')).toBe('cut 40% of all cost');
  });
});

describe('serializeEmphasis', () => {
  it('round-trips ordinary marked text', () => {
    for (const value of ['plain', 'a **b** c', 'a _b_ c', 'a **_b_** c', '**a** and _b_']) {
      expect(roundTrip(value)).toBe(value);
    }
  });

  it('keeps edge whitespace outside the markers so the pair stays valid', () => {
    expect(
      serializeEmphasis([
        { text: 'go ', bold: false, italic: false },
        { text: 'fast ', bold: true, italic: false },
        { text: 'now', bold: false, italic: false },
      ]),
    ).toBe('go **fast** now');
  });

  it('merges neighbouring spans of one style', () => {
    expect(
      serializeEmphasis([
        { text: 'a', bold: true, italic: false },
        { text: 'b', bold: true, italic: false },
      ]),
    ).toBe('**ab**');
  });
});
