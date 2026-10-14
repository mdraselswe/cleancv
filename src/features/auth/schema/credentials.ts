import { z } from 'zod';

import { NAME_MAX, PASSWORD_MAX, PASSWORD_MIN } from '@/constants';

/**
 * What the forms accept, before the server sees it.
 *
 * The server validates the same things again — this is not the check that
 * protects anything. It is the check that tells the reader which field is
 * wrong while they are still looking at it, instead of after a round trip that
 * answers "Validation Error".
 */

export const emailField = z
  .string()
  .trim()
  .min(1, 'আপনার ইমেইল ঠিকানা লিখুন।')
  .email('এটি ইমেইল ঠিকানার মতো দেখাচ্ছে না।')
  .max(254, 'ইমেইল ঠিকানাটি অনেক লম্বা।');

export const passwordField = z
  .string()
  .min(PASSWORD_MIN, `কমপক্ষে ${PASSWORD_MIN}টি অক্ষর ব্যবহার করুন।`)
  .max(PASSWORD_MAX, `সর্বোচ্চ ${PASSWORD_MAX}টি অক্ষর ব্যবহার করুন।`);

export const nameField = z
  .string()
  .trim()
  .min(1, 'আপনার নাম লিখুন।')
  .max(NAME_MAX, `সর্বোচ্চ ${NAME_MAX}টি অক্ষর ব্যবহার করুন।`);

export const signInSchema = z.object({
  email: emailField,
  /*
   * Not `passwordField`: an existing account may predate a change to the
   * minimum, and refusing to *send* their password would lock them out of the
   * account with a message about a rule they never agreed to.
   */
  password: z.string().min(1, 'আপনার পাসওয়ার্ড লিখুন।'),
});

export const signUpSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'দুটি পাসওয়ার্ড মেলেনি।',
    path: ['confirm'],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
