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
  'clean-classic',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** The template used for the auto-generated ATS export, regardless of design choice. */
export const ATS_EXPORT_TEMPLATE_ID: TemplateId = 'ats-plain';

export const DEFAULT_TEMPLATE_ID: TemplateId = 'classic-dc';

export const TEMPLATE_CATEGORIES = ['ats', 'balanced', 'creative'] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_CATEGORY_LABEL: Record<TemplateCategory, string> = {
  ats: 'ATS-সেফ',
  balanced: 'মাঝামাঝি',
  creative: 'সৃজনশীল',
};

export const TEMPLATE_CATEGORY_HINT: Record<TemplateCategory, string> = {
  ats: 'ATS সফটওয়্যার এগুলো সবচেয়ে ভালো পড়তে পারে। জব পোর্টালে আবেদন করার সময় এগুলো ব্যবহার করুন।',
  balanced: 'আলাদা লেআউট, তবুও ATS সফটওয়্যার সহজেই পড়তে পারে।',
  creative: 'চোখে পড়ার মতো ডিজাইন। অনলাইনে আবেদনের সময় ATS এক্সপোর্টের সঙ্গে ব্যবহার করুন।',
};

/** Font stacks are limited to faces that embed and subset cleanly in print. */
export const FONT_FAMILIES = [
  'sans',
  'humanist',
  'serif',
  'grotesk',
  'opensans',
  'carlito',
  'arimo',
] as const;
export type FontFamilyKey = (typeof FONT_FAMILIES)[number];

export const FONT_FAMILY_LABEL: Record<FontFamilyKey, string> = {
  sans: 'Inter (sans)',
  humanist: 'PT Sans (humanist)',
  serif: 'Source Serif (serif)',
  grotesk: 'Space Grotesk (grotesk)',
  opensans: 'Open Sans (humanist)',
  carlito: 'Carlito (Calibri-style)',
  arimo: 'Arimo (Arial-style)',
};

/** CSS variable each font key resolves to; set on the document root by next/font. */
export const FONT_FAMILY_VAR: Record<FontFamilyKey, string> = {
  sans: 'var(--font-resume-sans), var(--font-bangla)',
  humanist: 'var(--font-resume-humanist), var(--font-bangla)',
  serif: 'var(--font-resume-serif), var(--font-bangla)',
  grotesk: 'var(--font-resume-grotesk), var(--font-bangla)',
  opensans: 'var(--font-resume-opensans), var(--font-bangla)',
  carlito: 'var(--font-resume-carlito), var(--font-bangla)',
  arimo: 'var(--font-resume-arimo), var(--font-bangla)',
};

export const DENSITIES = ['compact', 'normal', 'relaxed'] as const;
export type Density = (typeof DENSITIES)[number];

export const DENSITY_LABEL: Record<Density, string> = {
  compact: 'ঘন',
  normal: 'স্বাভাবিক',
  relaxed: 'খোলামেলা',
};

/** Multiplier applied to the template's base line-height and section spacing. */
export const DENSITY_SCALE: Record<Density, number> = {
  compact: 0.9,
  normal: 1,
  relaxed: 1.12,
};

export const ACCENT_PRESETS = [
  { name: 'কালি', value: '#1f2937' },
  { name: 'নেভি', value: '#1e3a5f' },
  { name: 'টিল', value: '#0f766e' },
  { name: 'পান্না সবুজ', value: '#047857' },
  { name: 'বেগুনি', value: '#6d28d9' },
  { name: 'গাঢ় লাল', value: '#b91c1c' },
  { name: 'অ্যাম্বার', value: '#b45309' },
  { name: 'স্লেট নীল', value: '#3b5bdb' },
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
  { id: 'square', label: 'চৌকো', radius: 0 },
  { id: 'rounded', label: 'গোলাকার কোণ', radius: 12 },
  { id: 'circle', label: 'বৃত্ত', radius: PHOTO_RADIUS.max },
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
