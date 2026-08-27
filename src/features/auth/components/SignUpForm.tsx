'use client';

import Link from 'next/link';

import { Button, Field, Input } from '@/components/ui';
import { AUTH_ROUTES, LEGAL_ROUTES, PASSWORD_MIN, REDIRECT_PARAM } from '@/constants';

import { useSignUp } from '../hooks/useSignUp';
import { AuthDivider } from './AuthDivider';
import { AuthNotice } from './AuthNotice';
import { GoogleButton } from './GoogleButton';
import { AUTH_FIELD_CLASS } from './fieldHeight';
import { PasswordInput } from './PasswordInput';

export interface SignUpFormProps {
  redirectTo: string;
  googleEnabled: boolean;
}

/**
 * Create an account.
 *
 * Three fields, and no second password box: a reader who mistypes their
 * password can reset it from the address they just confirmed, and a
 * confirmation field's real effect is to make people paste the same typo twice.
 *
 * Signing up does not sign anyone in — the server holds the session back until
 * the address is confirmed — so the success state is a sentence naming the
 * inbox, not a redirect into the app.
 */
export const SignUpForm = ({ redirectTo, googleEnabled }: SignUpFormProps) => {
  const { values, errors, formError, pending, setField, submit, sentTo } = useSignUp(
    AUTH_ROUTES.verifyEmail,
  );

  const signInHref = `${AUTH_ROUTES.signIn}?${REDIRECT_PARAM}=${encodeURIComponent(redirectTo)}`;

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <AuthNotice tone="success">
          Check <strong className="font-semibold">{sentTo}</strong> for a confirmation link. It
          works for an hour.
        </AuthNotice>
        <p className="text-fg-subtle text-ui-md leading-relaxed">
          Nothing arrived? Look in spam, then{' '}
          <Link href={signInHref} className="tap-target text-fg underline">
            sign in
          </Link>{' '}
          to ask for another one.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled ? (
        <>
          <GoogleButton callbackURL={redirectTo} label="Sign up with Google" />
          <AuthDivider label="or use your email" />
        </>
      ) : null}

      <form className="flex flex-col gap-3.5" onSubmit={submit} noValidate>
        <Field label="Name" error={errors.name} hint="Shown on your account, not on your CV.">
          {({ id, describedBy, invalid }) => (
            <Input
              className={AUTH_FIELD_CLASS}
              id={id}
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="name"
              autoFocus
            />
          )}
        </Field>

        <Field label="Email" error={errors.email}>
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
              placeholder="you@example.com"
            />
          )}
        </Field>

        <Field
          label="Password"
          error={errors.password}
          hint={`At least ${PASSWORD_MIN} characters.`}
        >
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              className={AUTH_FIELD_CLASS}
              id={id}
              value={values.password}
              onChange={(event) => setField('password', event.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="new-password"
            />
          )}
        </Field>

        {formError ? <AuthNotice tone="error">{formError}</AuthNotice> : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="justify-center"
          disabled={pending}
        >
          {pending ? 'Creating your account…' : 'Create account'}
        </Button>

        {/*
          Under the button rather than as a checkbox. A tick-box that everybody
          ticks without reading records a consent nobody gave; a sentence at the
          moment of the act is the honest version, and the links are real.
        */}
        <p className="text-fg-subtle text-ui-xs text-center leading-relaxed">
          By creating an account you agree to the{' '}
          <Link href={LEGAL_ROUTES.terms} className="hover:text-fg underline">
            Terms
          </Link>{' '}
          and the{' '}
          <Link href={LEGAL_ROUTES.privacy} className="hover:text-fg underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="text-fg-subtle text-ui-md text-center">
        Already have an account?{' '}
        <Link href={signInHref} className="tap-target text-fg font-medium underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};
