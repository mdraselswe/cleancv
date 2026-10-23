import { z } from 'zod';

import {
  DEFAULT_DECLARATION_TEXT,
  LIMITS,
  REFERENCE_MODES,
  SIGNATURE_MODES,
  SIGNATURE_SCALE,
  SUMMARY_MODES,
} from '@/constants';

import {
  emailSchema,
  entryList,
  idSchema,
  imageSchema,
  optionalText,
  tagsSchema,
} from './primitives';

export const summaryModeSchema = z.enum(SUMMARY_MODES).catch('summary').default('summary');

export const summarySchema = z.object({
  mode: summaryModeSchema,
  text: optionalText(LIMITS.summaryChars),
});

export const interestsSchema = z.object({
  items: tagsSchema,
});

export const referenceEntrySchema = z.object({
  id: idSchema,
  name: optionalText(LIMITS.nameChars),
  designation: optionalText(120),
  organization: optionalText(160),
  relationship: optionalText(80),
  email: emailSchema,
  phone: optionalText(40),
});

export const referencesSchema = z.object({
  mode: z.enum(REFERENCE_MODES).catch('on-request').default('on-request'),
  entries: entryList(referenceEntrySchema),
});

export const declarationSchema = z.object({
  text: optionalText(500).default(DEFAULT_DECLARATION_TEXT),
  place: optionalText(80),
  /** Shown beside the declaration; blank means "render today's date at export". */
  date: optionalText(40),
  /**
   * Whether to print a date at all. A declaration is a standing statement, and
   * a date on it makes the document look written for one particular day — which
   * is wrong on a CV sent to twenty employers over three months. Defaults on,
   * because that is what documents saved before this option had.
   */
  showDate: z.boolean().catch(true).default(true),
});

export const signatureSchema = z.object({
  mode: z.enum(SIGNATURE_MODES).catch('typed').default('typed'),
  /** Used when mode is 'typed'; falls back to basics.fullName when empty. */
  typedName: optionalText(LIMITS.nameChars),
  image: imageSchema,
  caption: optionalText(80),
  /** Percent of the design's own signature size; the reader's, so it survives a change of design. */
  scale: z
    .number()
    .min(SIGNATURE_SCALE.min)
    .max(SIGNATURE_SCALE.max)
    .catch(SIGNATURE_SCALE.default)
    .default(SIGNATURE_SCALE.default),
});

export type Summary = z.infer<typeof summarySchema>;
export type Interests = z.infer<typeof interestsSchema>;
export type ReferenceEntry = z.infer<typeof referenceEntrySchema>;
export type References = z.infer<typeof referencesSchema>;
export type Declaration = z.infer<typeof declarationSchema>;
export type Signature = z.infer<typeof signatureSchema>;
