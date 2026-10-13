import { describe, expect, it } from 'vitest';

import { FONT_SCALE, SECTION_ENTRY_ICON, TEMPLATE_IDS } from '@/constants';
import { ICON_COMPONENTS, getAvailableTemplates } from '@/features/templates';

/** The sections that hold a list of entries, and so gain from a marker. */
const ENTRY_LIST_SECTIONS = [
  'experience',
  'education',
  'projects',
  'certifications',
  'awards',
  'training',
  'publications',
  'conferences',
  'patents',
  'memberships',
  'volunteering',
  'extracurricular',
  'references',
] as const;

/**
 * The template contract.
 *
 * These are the parts of `meta` a template can omit and still compile, which is
 * exactly why they need a test: each omission is invisible until someone
 * switches designs and sees the previous one's setting bleed through.
 */
describe('template metadata', () => {
  const templates = getAvailableTemplates();

  it('registers every declared id', () => {
    expect(templates.map(({ meta }) => meta.id).sort()).toEqual([...TEMPLATE_IDS].sort());
  });

  it.each(templates.map(({ meta }) => meta))('$id states a page margin', (meta) => {
    // Omitting it inherits the previous template's margin. See ADR-018.
    expect(typeof meta.defaultTheme.marginMm).toBe('number');
  });

  it.each(templates.map(({ meta }) => meta))('$id states its text size', (meta) => {
    // A switch applies the design's theme over the current one, so a design that
    // is silent inherits the last design's scale — a 7.6pt design's 120% on a
    // 10pt design prints at 12pt.
    expect(typeof meta.defaultTheme.fontScale).toBe('number');
  });

  it.each(templates.map(({ meta }) => meta))('$id says whether it draws icons', (meta) => {
    // The editor reads this to tell the user a picked icon will not be drawn,
    // rather than letting the control do nothing.
    expect(typeof meta.supports.icons).toBe('boolean');
  });

  it('has at least one design that draws icons, or the picker is pointless', () => {
    expect(templates.some(({ meta }) => meta.supports.icons)).toBe(true);
  });

  it.each(templates.filter(({ meta }) => meta.supports.photo).map(({ meta }) => meta))(
    '$id states the shape it draws a photo in',
    (meta) => {
      // Omitting it inherits the previous design's shape — the same defect as a
      // missing margin, and just as invisible until someone switches. ADR-024.
      expect(typeof meta.defaultTheme.photoRadius).toBe('number');
    },
  );

  it.each(templates.map(({ meta }) => meta))('$id says whether it marks entries', (meta) => {
    expect(typeof meta.supports.entryMarkers).toBe('boolean');
  });

  it('never marks entries in a design that draws no icons', () => {
    // The marker is a glyph. A design opting out of glyphs cannot opt into one.
    for (const { meta } of templates) {
      if (!meta.supports.icons) expect(meta.supports.entryMarkers).toBe(false);
    }
  });
});

describe('entry markers', () => {
  it('gives every repeatable section a marker, and no other section one', () => {
    // A marker separates siblings, so it belongs to the sections that have them.
    for (const key of ENTRY_LIST_SECTIONS) {
      expect(SECTION_ENTRY_ICON[key]).toBeTruthy();
    }

    for (const key of ['summary', 'contact', 'skills', 'interests', 'declaration'] as const) {
      expect(SECTION_ENTRY_ICON[key]).toBeUndefined();
    }
  });

  it('draws every marker it names', () => {
    for (const icon of Object.values(SECTION_ENTRY_ICON)) {
      expect(ICON_COMPONENTS[icon!]).toBeTypeOf('function');
    }
  });
});

describe('font scale bounds', () => {
  it('spans enough for a step to be visible on paper', () => {
    // At the old range one step moved body text by a tenth of a point, which
    // read as the export ignoring the setting.
    expect(FONT_SCALE.max - FONT_SCALE.min).toBeGreaterThanOrEqual(0.4);
    expect(FONT_SCALE.step).toBeGreaterThanOrEqual(0.05);
  });

  it('keeps the default inside the range', () => {
    expect(FONT_SCALE.default).toBeGreaterThanOrEqual(FONT_SCALE.min);
    expect(FONT_SCALE.default).toBeLessThanOrEqual(FONT_SCALE.max);
  });
});
