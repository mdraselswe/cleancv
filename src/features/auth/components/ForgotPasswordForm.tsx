'use client';

import Link from 'next/link';

import { Button, Field, Input } from '@/components/ui';
import { AUTH_ROUTES } from '@/constants';

import { useForgotPassword } from '../hooks/usePasswordReset';
import { AuthNotice } from './AuthNotice';
import { AUTH_FIELD_CLASS } from './fieldHeight';

/**
 * Asking for a reset link.
 *
 * The confirmation is deliberately vague about whether an account exists —
 * "if there is an account" rather than "sent". A form that answers the
 * difference is a way to test whether a given person has one, which is what
 * somebody holding a list of leaked addresses wants to find out.
 */
export const ForgotPasswordForm = () => {
  const { values, errors, formError, pending, setField, submit, sentTo } = useForgotPassword();

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <AuthNotice tone="success">
          If there is an account for <strong className="font-semibold">{sentTo}</strong>, a reset
          link is on its way. It works for an hour, and only once.
        </AuthNotice>
        <Link
          href={AUTH_ROUTES.signIn}
          className="tap-target text-fg-subtle text-ui-md text-center underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
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

      {formError ? <AuthNotice tone="error">{formError}</AuthNotice> : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="justify-center"
        disabled={pending}
      >
        {pending ? 'Sending…' : 'Send the reset link'}
      </Button>

      <Link
        href={AUTH_ROUTES.signIn}
        className="tap-target text-fg-subtle text-ui-md text-center underline"
      >
        Back to sign in
      </Link>
    </form>
  );
};
