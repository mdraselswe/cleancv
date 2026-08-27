'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { authClient } from '../client';
import { signInSchema } from '../schema/credentials';
import { authErrorMessage, isUnverifiedEmail } from '../utils/errorMessage';
import { useCredentialForm } from './useCredentialForm';

/**
 * Signing in with an email and a password.
 *
 * `redirectTo` has already been through `safeRedirect` by the time it reaches
 * here — the page does that, because the page is where the untrusted query
 * string arrives.
 *
 * One failure gets its own state rather than a message: an unconfirmed address
 * is the one error the reader cannot fix by typing more carefully, so the form
 * offers to send the link again instead of asking them to try harder.
 */
export const useSignIn = (redirectTo: string) => {
  const router = useRouter();
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resent, setResent] = useState(false);

  const form = useCredentialForm({
    schema: signInSchema,
    initial: { email: '', password: '' },
    onSubmit: async ({ email, password }) => {
      setUnverifiedEmail('');
      setResent(false);

      const { error } = await authClient.signIn.email({ email, password });

      if (error) {
        if (isUnverifiedEmail(error)) setUnverifiedEmail(email);

        return authErrorMessage(error);
      }

      router.push(redirectTo);
      /*
       * The editor and the sign-in page are both rendered on the server, and
       * the cached tree still has the signed-out one in it. Without this the
       * reader lands on a page that says "Sign in".
       */
      router.refresh();
    },
  });

  const resendVerification = useCallback(async () => {
    if (!unverifiedEmail) return;

    const { error } = await authClient.sendVerificationEmail({
      email: unverifiedEmail,
      callbackURL: redirectTo,
    });

    if (error) {
      form.setFormError(authErrorMessage(error));

      return;
    }

    setResent(true);
  }, [unverifiedEmail, redirectTo, form]);

  return { ...form, unverifiedEmail, resent, resendVerification };
};
