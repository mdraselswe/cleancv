import { describe, expect, it } from 'vitest';

import { parseEmphasis, serializeEmphasis, stripEmphasis } from '@/lib/emphasis';

const roundTrip = (value: string) => serializeEmphasis(parseEmphasis(value));

describe('parseEmphasis', () => {
  it('reads bold, italic and both', () => {
    expect(parseEmphasis('a **b** _c_ **_d_**')).toEqual([
      { text: 'a ', bold: false, italic: false, underline: false },
      { text: 'b', bold: true, italic: false, underline: false },
      { text: ' ', bold: false, italic: false, underline: false },
      { text: 'c', bold: false, italic: true, underline: false },
      { text: ' ', bold: false, italic: false, underline: false },
      { text: 'd', bold: true, italic: true, underline: false },
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
        { text: 'go ', bold: false, italic: false, underline: false },
        { text: 'fast ', bold: true, italic: false, underline: false },
        { text: 'now', bold: false, italic: false, underline: false },
      ]),
    ).toBe('go **fast** now');
  });

  it('merges neighbouring spans of one style', () => {
    expect(
      serializeEmphasis([
        { text: 'a', bold: true, italic: false, underline: false },
        { text: 'b', bold: true, italic: false, underline: false },
      ]),
    ).toBe('**ab**');
  });
});

describe('underline and links', () => {
  it('reads underline as ~~', () => {
    expect(parseEmphasis('a ~~b~~ c')[1]).toEqual({
      text: 'b',
      bold: false,
      italic: false,
      underline: true,
    });
  });

  it('does not let C++ swallow a line', () => {
    expect(stripEmphasis('C++, Java and C++')).toBe('C++, Java and C++');
  });

  it('reads a link and keeps only the label for scoring', () => {
    const spans = parseEmphasis('see [my site](https://example.com) now');

    expect(spans[1]).toMatchObject({ text: 'my site', href: 'https://example.com' });
    expect(stripEmphasis('see [my site](https://example.com) now')).toBe('see my site now');
  });

  it('refuses an address that is not http, https or mailto', () => {
    const value = 'x [bad](javascript:alert(1)) y';

    expect(parseEmphasis(value).some((span) => span.href)).toBe(false);
    expect(stripEmphasis(value)).toBe(value);
  });

  it('carries bold inside a link and round-trips it', () => {
    const value = 'a [**Docs**](https://example.com/d) b';

    expect(parseEmphasis(value)[1]).toMatchObject({ text: 'Docs', bold: true, href: 'https://example.com/d' });
    expect(roundTrip(value)).toBe(value);
  });

  it('round-trips underline', () => {
    expect(roundTrip('a ~~b~~ c')).toBe('a ~~b~~ c');
    expect(roundTrip('a **~~_b_~~** c')).toBe('a **~~_b_~~** c');
  });
});
