import type { CSSProperties } from 'react';

import { DENSITY_SCALE, FONT_FAMILY_VAR } from '@/constants';
import type { SectionColumn, SectionSlot } from '@/constants';
import type { PageBleed } from '@/lib/pageBleed';
import type { Resume, ResumeTheme } from '@/features/resume';

import type { TemplateMeta } from '../types';

/**
 * Turns the stored theme into the `--rz-*` variables that resume.css and every
 * template stylesheet read. Templates never hard-code a colour or a size; this
 * is the only place theme values become CSS.
 */

/** Mixes an accent toward white for tinted backgrounds, without a colour library. */
const softenHex = (hex: string, amount = 0.9): string => {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const channel = (offset: number) => {
    const value = Number.parseInt(full.slice(offset, offset + 2), 16);

    return Math.round(value + (255 - value) * amount);
  };

  return `rgb(${channel(0)} ${channel(2)} ${channel(4)})`;
};

export interface ResolvedTemplateStyle extends CSSProperties {
  '--rz-accent': string;
  '--rz-accent-soft': string;
  '--rz-font': string;
  '--rz-scale': number;
  '--rz-density': number;
  '--rz-margin': string;
  '--rz-photo-radius': string;
  /** Width of the page's accent band, for designs that declare one. */
  '--rz-bleed': string;
}

export const resolveTemplateStyle = (
  theme: ResumeTheme,
  meta: TemplateMeta,
): ResolvedTemplateStyle => {
  // A template that opts out of colour renders in ink regardless of the picker.
  const accent = meta.supports.accentColor ? theme.accent : '#16181d';

  return {
    '--rz-accent': accent,
    '--rz-accent-soft': softenHex(accent),
    '--rz-font': FONT_FAMILY_VAR[theme.font],
    '--rz-scale': theme.fontScale,
    '--rz-density': DENSITY_SCALE[theme.density],
    '--rz-margin': `${theme.marginMm}mm`,
    // A percentage of the photo's own square box: 0 square, 50 circle.
    '--rz-photo-radius': `${theme.photoRadius}%`,
    /*
     * The stylesheet needs the same number the page is painted with, so the
     * design's rail can end exactly where the band does. `0` for a design
     * without one, which is what a `calc` against it should come out to.
     */
    '--rz-bleed': meta.pageBleed?.width ?? '0px',
  };
};

/**
 * The band a design paints down the left of the paper, resolved against the
 * theme — or nothing, for a design that declares none.
 *
 * The preview and the export both start here, so the sheet and the paper cannot
 * end up with different bands. See ADR-036.
 */
/**
 * Which column a section takes: the reader's override if there is one, and the
 * design's own default otherwise.
 *
 * One resolver, so the template that lays the columns out and the map that
 * draws them cannot disagree about where a section is. See ADR-043.
 */
export const resolveSectionColumn = (
  resume: Resume,
  meta: TemplateMeta,
  slot: SectionSlot,
): SectionColumn => {
  if (meta.supports.columns === 1) return 'main';

  return (
    resume.meta.columns[slot] ??
    (meta.mainSections?.some((key) => key === slot) ? 'main' : 'side')
  );
};

export const resolvePageBleed = (
  theme: ResumeTheme,
  meta: TemplateMeta,
): PageBleed | undefined =>
  meta.pageBleed
    ? {
        color: meta.supports.accentColor ? theme.accent : '#16181d',
        width: meta.pageBleed.width,
      }
    : undefined;



/** Whether the photo should render, given both the user's toggle and the design. */
export const shouldShowPhoto = (theme: ResumeTheme, meta: TemplateMeta, photo: string): boolean =>
  meta.supports.photo && theme.showPhoto && photo.length > 0;
