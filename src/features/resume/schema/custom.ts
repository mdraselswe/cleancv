import { z } from 'zod';

import { CUSTOM_SECTION_LAYOUTS, LIMITS, MAX_CUSTOM_SECTIONS } from '@/constants';

import { bulletsSchema, idSchema, optionalText } from './primitives';

/**
 * A section the user invents — "Portfolio Highlights", "Military Service",
 * anything the built-in registry does not cover.
 *
 * Unlike a built-in section its heading and enabled flag live on the entry
 * itself: there is no `SECTION_META` row to fall back to, and `meta.sections`
 * is keyed by the fixed `SectionKey` union.
 */
export const customSectionSchema = z.object({
  id: idSchema,
  heading: optionalText(60),
  layout: z.enum(CUSTOM_SECTION_LAYOUTS).catch('bullets').default('bullets'),
  /** Used when `layout` is 'paragraph'. */
  text: optionalText(LIMITS.summaryChars),
  /** Used when `layout` is 'bullets'. */
  bullets: bulletsSchema,
  enabled: z.boolean().catch(true).default(true),
});

export const customSectionsSchema = z
  .array(customSectionSchema)
  .max(MAX_CUSTOM_SECTIONS)
  .catch([])
  .default([]);

export type CustomSection = z.infer<typeof customSectionSchema>;
