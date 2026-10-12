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
          New here? The same button creates your account. There is no password to remember.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled ? (
        <>
          <GoogleButton callbackURL={redirectTo} />
          <AuthDivider label="or use your email" />
        </>
      ) : null}

      <form className="flex flex-col gap-3.5" onSubmit={submit} noValidate>
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
              autoFocus
              placeholder="you@example.com"
            />
          )}
        </Field>

        <Field
          label="Password"
          error={errors.password}
          adornment={
            <Link href={AUTH_ROUTES.forgotPassword} className="tap-target hover:text-fg underline">
              Forgot it?
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
            Send the confirmation link again
          </Button>
        ) : null}
        {resent ? <AuthNotice tone="success">Sent. Check {unverifiedEmail}.</AuthNotice> : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="justify-center"
          disabled={pending}
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-fg-subtle text-ui-md text-center">
        No account yet?{' '}
        <Link href={signUpHref} className="tap-target text-fg font-medium underline">
          Create one
        </Link>
      </p>
    </div>
  );
};
