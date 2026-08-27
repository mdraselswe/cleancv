'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AUTH_ROUTES } from '@/constants';

import { authClient } from '../client';
import { forgotPasswordSchema, resetPasswordSchema } from '../schema/credentials';
import { authErrorMessage } from '../utils/errorMessage';
import { useCredentialForm } from './useCredentialForm';

/**
 * Asking for a reset link.
 *
 * The success message is the same whether or not an account exists for that
 * address, and it is the server that makes it so. Answering "no such account"
 * turns this form into a way to ask whether a given person has one — which is
 * exactly what someone with a list of leaked addresses wants to know.
 */
export const useForgotPassword = () => {
  const [sentTo, setSentTo] = useState('');

  const form = useCredentialForm({
    schema: forgotPasswordSchema,
    initial: { email: '' },
    onSubmit: async ({ email }) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: AUTH_ROUTES.resetPassword,
      });

      if (error) return authErrorMessage(error);

      setSentTo(email);
    },
  });

  return { ...form, sentTo };
};

/**
 * Choosing the new password.
 *
 * The token comes from the link, and is the only thing authorising this. A
 * missing one is not a form error — there is nothing the reader can type to
 * fix it — so the page checks for it before rendering the form at all.
 */
export const useResetPassword = (token: string) => {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const form = useCredentialForm({
    schema: resetPasswordSchema,
    initial: { password: '', confirm: '' },
    onSubmit: async ({ password }) => {
      const { error } = await authClient.resetPassword({ newPassword: password, token });

      if (error) return authErrorMessage(error);

      setDone(true);
      /*
       * Resetting revokes every session opened with the old password, this
       * browser's included, so there is nothing to redirect into. The sign-in
       * page is the honest destination.
       */
      router.push(AUTH_ROUTES.signIn);
    },
  });

  return { ...form, done };
};
