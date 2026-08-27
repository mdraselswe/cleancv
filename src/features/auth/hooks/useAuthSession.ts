'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AUTH_ROUTES, ROUTES } from '@/constants';

import { authClient } from '../client';

/**
 * Who is signed in, in the browser.
 *
 * Answered from the signed session cookie for the first few minutes, so a page
 * load usually costs nothing. `pending` is true only on the very first read;
 * everything that renders from this shows a quiet placeholder rather than
 * "Sign in", because flashing the signed-out state at somebody who is signed in
 * reads as having been logged out.
 */
export interface AuthSession {
  user: { id: string; name: string; email: string; image: string | null } | null;
  pending: boolean;
  signedIn: boolean;
}

export const useAuthSession = (): AuthSession => {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  return {
    user: user
      ? { id: user.id, name: user.name, email: user.email, image: user.image ?? null }
      : null,
    pending: isPending,
    signedIn: Boolean(user),
  };
};

/**
 * Signing out.
 *
 * The router is refreshed rather than the page reloaded: a reload would throw
 * away the editor's in-memory undo history, and signing out has nothing to do
 * with the document — it stays in this browser either way.
 */
export const useSignOut = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const signOut = useCallback(async () => {
    setPending(true);

    try {
      await authClient.signOut();
      router.push(ROUTES.editor);
      router.refresh();
    } finally {
      setPending(false);
    }
  }, [router]);

  return { signOut, pending };
};

/**
 * Handing the browser to Google and back.
 *
 * `callbackURL` is where Google's redirect lands, and Better Auth checks it
 * against the configured origin — so it takes a path, never a full URL, and
 * the page has already reduced it to a safe one.
 */
export const useGoogleSignIn = (callbackURL: string) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const signInWithGoogle = useCallback(async () => {
    setPending(true);
    setError('');

    const { error: failure } = await authClient.signIn.social({
      provider: 'google',
      callbackURL,
      errorCallbackURL: AUTH_ROUTES.signIn,
    });

    if (failure) {
      setError(failure.message || 'Could not reach Google. Try again.');
      setPending(false);

      return;
    }

    /*
     * On success the browser is already leaving for Google. Clearing `pending`
     * here would flip the button back to its resting state during the
     * navigation, which looks like the click did nothing.
     */
  }, [callbackURL]);

  return { signInWithGoogle, pending, error };
};
