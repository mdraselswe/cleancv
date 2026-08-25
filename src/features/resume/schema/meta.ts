import { z } from 'zod';

import {
  CUSTOM_SECTION_PREFIX,
  DEFAULT_ACCENT,
  DEFAULT_SECTION_ORDER,
  DEFAULT_TEMPLATE_ID,
  DENSITIES,
  FONT_FAMILIES,
  FONT_SCALE,
  PAGE_MARGIN_MM,
  PHOTO_RADIUS,
  SECTION_KEYS,
  SECTION_META,
  TEMPLATE_IDS,
} from '@/constants';
import type { SectionSlot } from '@/constants';

import { optionalText } from './primitives';

export const sectionKeySchema = z.enum(SECTION_KEYS);

/**
 * A position in the document. Custom sections are matched by prefix rather than
 * by id, because the ids they refer to live outside `meta` — `normalizeResume`
 * is what drops a slot whose section no longer exists.
 */
export const sectionSlotSchema = z.custom<SectionSlot>(
  (value) =>
    typeof value === 'string' &&
    ((SECTION_KEYS as readonly string[]).includes(value) ||
      value.startsWith(CUSTOM_SECTION_PREFIX)),
  { message: 'Unknown section' },
);

/** Per-section display state. Kept out of the data itself so content survives toggling. */
export const sectionSettingSchema = z.object({
  enabled: z.boolean(),
  /** Empty means "use SECTION_META[key].defaultHeading". */
  heading: optionalText(60),
  /**
   * Whether this section draws its glyphs — the entry markers, and the group
   * marks on skills and achievements.
   *
   * On by default, and only ever subtractive: a design that draws no icons is
   * unaffected by it. Per section rather than per document because the reasons
   * differ by section — a marker earns its place beside four roles and looks
   * fussy beside a single line of interests. See ADR-022.
   */
  showIcons: z.boolean().catch(true).default(true),
});

export const sectionSettingsSchema = z
  .record(sectionKeySchema, sectionSettingSchema)
  .catch({} as Record<string, never>)
  .default({} as Record<string, never>);

export const themeSchema = z.object({
  accent: z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    .catch(DEFAULT_ACCENT)
    .default(DEFAULT_ACCENT),
  font: z.enum(FONT_FAMILIES).catch('sans').default('sans'),
  density: z.enum(DENSITIES).catch('normal').default('normal'),
  fontScale: z
    .number()
    .min(FONT_SCALE.min)
    .max(FONT_SCALE.max)
    .catch(FONT_SCALE.default)
    .default(FONT_SCALE.default),
  marginMm: z
    .number()
    .min(PAGE_MARGIN_MM.min)
    .max(PAGE_MARGIN_MM.max)
    .catch(PAGE_MARGIN_MM.default)
    .default(PAGE_MARGIN_MM.default),
  showPhoto: z.boolean().catch(false).default(false),
  /** Corner radius of the photo, as a percentage of its box. See ADR-024. */
  photoRadius: z
    .number()
    .min(PHOTO_RADIUS.min)
    .max(PHOTO_RADIUS.max)
    .catch(PHOTO_RADIUS.default)
    .default(PHOTO_RADIUS.default),
});

export const resumeMetaSchema = z.object({
  templateId: z.enum(TEMPLATE_IDS).catch(DEFAULT_TEMPLATE_ID).default(DEFAULT_TEMPLATE_ID),
  theme: themeSchema,
  sectionOrder: z
    .array(sectionSlotSchema)
    .catch([...DEFAULT_SECTION_ORDER])
    .default([...DEFAULT_SECTION_ORDER]),
  sections: sectionSettingsSchema,
  /** Pasted job description used by the keyword-match rules. Never rendered. */
  targetJobDescription: optionalText(20000),
  /** Filename stem for exports; falls back to the person's name. */
  documentName: optionalText(80),
});

export type SectionSetting = z.infer<typeof sectionSettingSchema>;
export type SectionSettings = z.infer<typeof sectionSettingsSchema>;
export type ResumeTheme = z.infer<typeof themeSchema>;
export type ResumeMeta = z.infer<typeof resumeMetaSchema>;

/** Section display state for a brand-new resume. */
export const createDefaultSectionSettings = (): SectionSettings =>
  Object.fromEntries(
    SECTION_KEYS.map((key) => [
      key,
      { enabled: SECTION_META[key].defaultEnabled, heading: '', showIcons: true },
    ]),
  ) as SectionSettings;
