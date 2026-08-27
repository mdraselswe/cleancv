'use client';

import { useState } from 'react';

import { authClient } from '../client';
import { signUpSchema } from '../schema/credentials';
import { authErrorMessage } from '../utils/errorMessage';
import { useCredentialForm } from './useCredentialForm';

/**
 * Creating an account with an email and a password.
 *
 * A successful sign-up does not sign anyone in: the server holds the session
 * back until the address is confirmed. So the form's success state is not a
 * redirect, it is a sentence naming the inbox to go and look in — and it keeps
 * the address, because "check your email" without saying which one is a dead
 * end for anyone with two.
 */
export const useSignUp = (callbackURL: string) => {
  const [sentTo, setSentTo] = useState('');

  const form = useCredentialForm({
    schema: signUpSchema,
    initial: { name: '', email: '', password: '' },
    onSubmit: async ({ name, email, password }) => {
      const { error } = await authClient.signUp.email({ name, email, password, callbackURL });

      if (error) return authErrorMessage(error);

      setSentTo(email);
    },
  });

  return { ...form, sentTo };
};
