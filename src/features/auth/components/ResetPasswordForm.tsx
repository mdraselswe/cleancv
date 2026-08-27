'use client';

import Link from 'next/link';

import { Button, Field } from '@/components/ui';
import { AUTH_ROUTES, PASSWORD_MIN } from '@/constants';

import { useResetPassword } from '../hooks/usePasswordReset';
import { AuthNotice } from './AuthNotice';
import { AUTH_FIELD_CLASS } from './fieldHeight';
import { PasswordInput } from './PasswordInput';

export interface ResetPasswordFormProps {
  /** From the emailed link. An empty string means the link was incomplete. */
  token: string;
}

/**
 * Choosing the new password.
 *
 * Two boxes here, unlike sign-up: the reader cannot see what they are setting,
 * has no account to fall back on if they mistype it, and the link they would
 * need to try again has just been spent.
 *
 * A missing token is not a form error — nothing they can type fixes it — so
 * the form is not rendered at all.
 */
export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const { values, errors, formError, pending, setField, submit, done } = useResetPassword(token);

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <AuthNotice tone="error">
          This link is incomplete. Reset links work once, and expire after an hour.
        </AuthNotice>
        <Link
          href={AUTH_ROUTES.forgotPassword}
          className="tap-target text-fg text-ui-md text-center font-medium underline"
        >
          Ask for a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <AuthNotice tone="success">
        Password changed. Every other session has been signed out. Taking you to sign in…
      </AuthNotice>
    );
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={submit} noValidate>
      <Field
        label="New password"
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
            autoFocus
          />
        )}
      </Field>

      <Field label="Type it again" error={errors.confirm}>
        {({ id, describedBy, invalid }) => (
          <PasswordInput
            className={AUTH_FIELD_CLASS}
            id={id}
            value={values.confirm}
            onChange={(event) => setField('confirm', event.target.value)}
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
        {pending ? 'Saving…' : 'Set the new password'}
      </Button>
    </form>
  );
};
