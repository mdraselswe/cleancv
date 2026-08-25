import { z } from 'zod';

import { LIMITS, MARITAL_STATUSES, PHOTO_FRAME } from '@/constants';

import { emailSchema, idSchema, imageSchema, optionalText, urlSchema } from './primitives';

const framePart = (bounds: { min: number; max: number; default: number }) =>
  z.number().min(bounds.min).max(bounds.max).catch(bounds.default).default(bounds.default);

/**
 * How the photo is framed, kept beside the photo rather than in the theme.
 *
 * The shape of the frame is the design's business and lives in `theme`; which
 * part of the image shows through it is the image's own, and should survive
 * switching designs and reset when a different photo is uploaded. See ADR-025.
 */
export const photoFrameSchema = z.object({
  x: framePart(PHOTO_FRAME.position),
  y: framePart(PHOTO_FRAME.position),
  zoom: framePart(PHOTO_FRAME.zoom),
});

/** Name, title and photo — the block every template renders first. */
export const basicsSchema = z.object({
  fullName: optionalText(LIMITS.nameChars),
  headline: optionalText(LIMITS.headlineChars),
  photo: imageSchema,
  photoFrame: photoFrameSchema,
});

/** A user-added profile link beyond the four we give first-class fields to. */
export const customLinkSchema = z.object({
  id: idSchema,
  label: optionalText(40),
  url: urlSchema,
});

export const contactSchema = z.object({
  phone: optionalText(40),
  altPhone: optionalText(40),
  email: emailSchema,
  location: optionalText(120),
  presentAddress: optionalText(200),
  permanentAddress: optionalText(200),
  linkedin: urlSchema,
  github: urlSchema,
  portfolio: urlSchema,
  links: z.array(customLinkSchema).max(LIMITS.customLinks).catch([]).default([]),
});

export const maritalStatusSchema = z.enum(['', ...MARITAL_STATUSES]).catch('').default('');

/**
 * Civil details. Expected on South Asian and public-sector CVs, and a liability
 * on most Western applications — hence off by default and individually toggleable.
 */
export const personalInfoSchema = z.object({
  dateOfBirth: optionalText(20),
  gender: optionalText(30),
  nationality: optionalText(60),
  maritalStatus: maritalStatusSchema,
  religion: optionalText(40),
  bloodGroup: optionalText(10),
  fatherName: optionalText(LIMITS.nameChars),
  motherName: optionalText(LIMITS.nameChars),
  nationalId: optionalText(40),
  passportNumber: optionalText(40),
});

export type Basics = z.infer<typeof basicsSchema>;
export type PhotoFrame = z.infer<typeof photoFrameSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type CustomLink = z.infer<typeof customLinkSchema>;
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
