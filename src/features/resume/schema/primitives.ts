import { z } from 'zod';

import { AUTO_ICON, LIMITS, RESUME_ICON_KEYS } from '@/constants';

/**
 * Shared field builders.
 *
 * Everything a resume stores is optional at the schema level: a half-filled
 * resume must still round-trip through localStorage. Required-ness is a
 * *scoring* concern, handled by the ATS completeness rules, not a save blocker.
 */

/** Stable identity for list entries; survives reordering and re-rendering. */
export const idSchema = z.string().min(1);

export const trimmed = (max: number) => z.string().trim().max(max);

/** Optional free text that normalises empty-ish input to ''. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .catch('')
    .default('');

/** `YYYY-MM`, or '' when unset. Dates are never free text — see ADR-004. */
export const monthSchema = z
  .string()
  .trim()
  .regex(/^(\d{4}-(0[1-9]|1[0-2]))?$/, 'Use the month picker')
  .catch('')
  .default('');

/**
 * Schemes that execute rather than navigate. A resume is user-authored content
 * that gets rendered as clickable links in the preview, so an unguarded
 * `javascript:` href would run in the app's own origin.
 */
const DANGEROUS_SCHEME = /^\s*(javascript|data|vbscript|file|blob):/i;

export const urlSchema = z
  .string()
  .trim()
  .max(300)
  .refine((value) => !DANGEROUS_SCHEME.test(value), { message: 'এই ধরনের লিংক চলবে না' })
  .refine(
    (value) => value === '' || /^(https?:\/\/|mailto:|tel:)/i.test(value) || !/\s/.test(value),
    { message: 'সঠিক একটি লিংক লিখুন' },
  )
  .catch('')
  .default('');

export const emailSchema = z
  .string()
  .trim()
  .max(160)
  .refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: 'সঠিক একটি ইমেইল ঠিকানা লিখুন',
  })
  .catch('')
  .default('');

/** Data URL for an uploaded photo or signature. Size is enforced on upload. */
export const imageSchema = z
  .string()
  .max(LIMITS.imageBytes * 2)
  .catch('')
  .default('');

/**
 * A chosen glyph, or `auto` to let the template guess from the text. Only
 * designs with an icon gutter draw it; the rest ignore it.
 */
export const iconSchema = z.enum(RESUME_ICON_KEYS).catch(AUTO_ICON).default(AUTO_ICON);

export const bulletsSchema = z
  .array(trimmed(LIMITS.bulletChars))
  .max(LIMITS.bulletsPerEntry)
  .catch([])
  .default([]);

export const tagsSchema = z
  .array(trimmed(60))
  .max(LIMITS.skillsPerGroup)
  .catch([])
  .default([]);

/** Wraps an entry schema as a bounded, self-healing list. */
export const entryList = <T extends z.ZodTypeAny>(entry: T) =>
  z.array(entry).max(LIMITS.entriesPerSection).catch([]).default([]);

const EMPTY_RANGE = { start: '', end: '', current: false } as const;

/**
 * A date range with an open end. `current` wins over `end` when rendering.
 *
 * Defaulted as a whole so an imported entry that omits `dates` is repaired
 * rather than dropping its entire list to the `entryList` catch.
 */
export const dateRangeSchema = z
  .object({
    start: monthSchema,
    end: monthSchema,
    current: z.boolean().catch(false).default(false),
  })
  .catch({ ...EMPTY_RANGE })
  .default({ ...EMPTY_RANGE });

export type DateRange = z.infer<typeof dateRangeSchema>;
