'use client';

import Link from 'next/link';

import { Button, Field, Input } from '@/components/ui';
import { AUTH_ROUTES, REDIRECT_PARAM } from '@/constants';

import { useSignIn } from '../hooks/useSignIn';
import { AuthDivider } from './AuthDivider';
import { AuthNotice } from './AuthNotice';
import { GoogleButton } from './GoogleButton';
import { AUTH_FIELD_CLASS } from './fieldHeight';
import { PasswordInput } from './PasswordInput';

export interface SignInFormProps {
  /** Already reduced to an app-relative path by the page. */
  redirectTo: string;
  googleEnabled: boolean;
  /** False where mail cannot be sent: Google is then the only way in. */
  emailEnabled: boolean;
}

/**
 * Sign in.
 *
 * Google first, then the email form: an account made with Google has no
 * password to type, and putting the password fields first invites the reader to
 * try one that does not exist.
 *
 * `autoComplete` is set on every field. Without it a password manager fills the
 * wrong box or nothing at all, and the reader types a long password by hand on
 * a phone, which is where they give up.
 */
export const SignInForm = ({ redirectTo, googleEnabled, emailEnabled }: SignInFormProps) => {
  const {
    values,
    errors,
    formError,
    pending,
    setField,
    submit,
    unverifiedEmail,
    resent,
    resendVerification,
  } = useSignIn(redirectTo);

  const signUpHref = `${AUTH_ROUTES.signUp}?${REDIRECT_PARAM}=${encodeURIComponent(redirectTo)}`;

  if (!emailEnabled) {
    return (
      <div className="flex flex-col gap-4">
        {googleEnabled ? <GoogleButton callbackURL={redirectTo} /> : null}
        <p className="text-fg-subtle text-ui-md text-center leading-relaxed">
          নতুন? একই বোতাম আপনার অ্যাকাউন্ট খুলে দেবে। মনে রাখার মতো কোনো পাসওয়ার্ড নেই।
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled ? (
        <>
          <GoogleButton callbackURL={redirectTo} />
          <AuthDivider label="অথবা ইমেইল ব্যবহার করুন" />
        </>
      ) : null}

      <form className="flex flex-col gap-3.5" onSubmit={submit} noValidate>
        <Field label="ইমেইল" error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              className={AUTH_FIELD_CLASS}
              id={id}
              type="email"
              value={values.email}
              onChange={(event) => setField('email', event.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
            />
          )}
        </Field>

        <Field
          label="পাসওয়ার্ড"
          error={errors.password}
          adornment={
            <Link href={AUTH_ROUTES.forgotPassword} className="tap-target hover:text-fg underline">
              ভুলে গেছেন?
            </Link>
          }
        >
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              className={AUTH_FIELD_CLASS}
              id={id}
              value={values.password}
              onChange={(event) => setField('password', event.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="current-password"
            />
          )}
        </Field>

        {formError ? <AuthNotice tone="error">{formError}</AuthNotice> : null}

        {/* The one failure the reader cannot fix by typing more carefully. */}
        {unverifiedEmail && !resent ? (
          <Button variant="ghost" size="sm" onClick={() => void resendVerification()}>
            নিশ্চিতকরণ লিংক আবার পাঠান
          </Button>
        ) : null}
        {resent ? <AuthNotice tone="success">পাঠানো হয়েছে। {unverifiedEmail} দেখুন।</AuthNotice> : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="justify-center"
          disabled={pending}
        >
          {pending ? 'সাইন-ইন হচ্ছে…' : 'সাইন-ইন'}
        </Button>
      </form>

      <p className="text-fg-subtle text-ui-md text-center">
        এখনো অ্যাকাউন্ট নেই?{' '}
        <Link href={signUpHref} className="tap-target text-fg font-medium underline">
          একটি খুলুন
        </Link>
      </p>
    </div>
  );
};
