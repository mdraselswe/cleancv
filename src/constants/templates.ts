/** Template identifiers, categories, and the theme vocabulary templates draw from. */

export const TEMPLATE_IDS = [
  'classic-dc',
  'ats-plain',
  'modern-sidebar',
  'academic-cv',
  'elegant-serif',
  'vibrant',
  'compact-pro',
  'formal-centered',
  'side-panel',
  'verdant',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** The template used for the auto-generated ATS export, regardless of design choice. */
export const ATS_EXPORT_TEMPLATE_ID: TemplateId = 'ats-plain';

export const DEFAULT_TEMPLATE_ID: TemplateId = 'classic-dc';

export const TEMPLATE_CATEGORIES = ['ats', 'balanced', 'creative'] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_CATEGORY_LABEL: Record<TemplateCategory, string> = {
  ats: 'ATS-safe',
  balanced: 'Balanced',
  creative: 'Creative',
};

export const TEMPLATE_CATEGORY_HINT: Record<TemplateCategory, string> = {
  ats: 'Maximum parse reliability. Use these when applying through a job portal.',
  balanced: 'Distinctive layout that still parses cleanly.',
  creative: 'Strong visual identity. Pair with the ATS export when applying online.',
};

/** Font stacks are limited to faces that embed and subset cleanly in print. */
export const FONT_FAMILIES = ['sans', 'humanist', 'serif', 'grotesk'] as const;
export type FontFamilyKey = (typeof FONT_FAMILIES)[number];

export const FONT_FAMILY_LABEL: Record<FontFamilyKey, string> = {
  sans: 'Inter (sans)',
  humanist: 'PT Sans (humanist)',
  serif: 'Source Serif (serif)',
  grotesk: 'Space Grotesk (grotesk)',
};

/** CSS variable each font key resolves to; set on the document root by next/font. */
export const FONT_FAMILY_VAR: Record<FontFamilyKey, string> = {
  sans: 'var(--font-resume-sans)',
  humanist: 'var(--font-resume-humanist)',
  serif: 'var(--font-resume-serif)',
  grotesk: 'var(--font-resume-grotesk)',
};

export const DENSITIES = ['compact', 'normal', 'relaxed'] as const;
export type Density = (typeof DENSITIES)[number];

export const DENSITY_LABEL: Record<Density, string> = {
  compact: 'Compact',
  normal: 'Normal',
  relaxed: 'Relaxed',
};

/** Multiplier applied to the template's base line-height and section spacing. */
export const DENSITY_SCALE: Record<Density, number> = {
  compact: 0.9,
  normal: 1,
  relaxed: 1.12,
};

export const ACCENT_PRESETS = [
  { name: 'Ink', value: '#1f2937' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Teal', value: '#0f766e' },
  { name: 'Emerald', value: '#047857' },
  { name: 'Plum', value: '#6d28d9' },
  { name: 'Crimson', value: '#b91c1c' },
  { name: 'Amber', value: '#b45309' },
  { name: 'Slate blue', value: '#3b5bdb' },
] as const;

export const DEFAULT_ACCENT = ACCENT_PRESETS[1].value;

/**
 * Font scale bounds, applied as a multiplier to the template base size.
 *
 * The range is wide enough that moving the control is legible on paper. At the
 * old +/-15% a step was a tenth of a point and the exported PDF looked
 * unchanged, which read as the setting being ignored rather than as it being
 * small. The step is coarse for the same reason: every stop is a visible one.
 */
export const FONT_SCALE = { min: 0.8, max: 1.4, step: 0.05, default: 1 } as const;

/**
 * Photo corner radius, as a percentage of the photo's own box.
 *
 * One number rather than a shape enum plus an override: on a square box 0% is a
 * square, 50% is a circle, and everything between is the rounded rectangle
 * someone actually wanted. The named shapes below are shortcuts to values on
 * this scale, not a separate setting that could disagree with it. See ADR-024.
 */
export const PHOTO_RADIUS = { min: 0, max: 50, step: 1, default: 50 } as const;

export const PHOTO_SHAPES = [
  { id: 'square', label: 'Square', radius: 0 },
  { id: 'rounded', label: 'Rounded', radius: 12 },
  { id: 'circle', label: 'Circle', radius: PHOTO_RADIUS.max },
] as const;

export type PhotoShapeId = (typeof PHOTO_SHAPES)[number]['id'];

/**
 * How the photo sits inside its frame.
 *
 * `x`/`y` are the point of the image the frame centres on, as percentages, and
 * `zoom` magnifies about that same point. Nothing here touches the file: the
 * uploaded image is kept whole and only framed differently, so a bad crop is
 * always one drag away from being fixed rather than needing another upload.
 * See ADR-025.
 */
export const PHOTO_FRAME = {
  position: { min: 0, max: 100, step: 1, default: 50 },
  zoom: { min: 1, max: 2.5, step: 0.05, default: 1 },
} as const;

/** Page margin bounds in millimetres. */
export const PAGE_MARGIN_MM = { min: 8, max: 24, step: 1, default: 14 } as const;

/**
 * Body-text lines an A4 page holds at the default margin, type scale and
 * density. Feeds the content-based page estimate only — the preview measures
 * the real document and its number always wins.
 */
export const LINES_PER_PAGE = 46;
