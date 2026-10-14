import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { GATE_REASON } from '@/constants';
import { AuthShell, SignInForm, readRedirect, type SearchParams } from '@/features/auth';
import { getSessionUser } from '@/server/auth/session';
import { isAuthConfigured, isEmailAuthEnabled, isGoogleConfigured } from '@/server/env';

import { AuthUnavailable } from '../unavailable';

export const metadata: Metadata = { title: 'সাইন-ইন' };
/* Reads the session and the environment. Nothing here can be prerendered. */
export const dynamic = 'force-dynamic';

interface AuthPageProps {
  searchParams: Promise<SearchParams>;
}

/**
 * Sign in.
 *
 * A server component, so whether the Google button exists is decided by
 * whether credentials are configured — rather than by a public env var that
 * has to be kept in step with a private one, and is wrong the first time it
 * is not. Somebody already signed in never sees the form; they are sent where
 * they were going.
 */
export default async function SignInPage({ searchParams }: AuthPageProps) {
  if (!isAuthConfigured() || (!isGoogleConfigured() && !isEmailAuthEnabled())) {
    return <AuthUnavailable />;
  }

  const next = readRedirect(await searchParams);

  if (await getSessionUser()) redirect(next);

  return (
    <AuthShell title="সাইন-ইন" subtitle={GATE_REASON}>
      <SignInForm
        redirectTo={next}
        googleEnabled={isGoogleConfigured()}
        emailEnabled={isEmailAuthEnabled()}
      />
    </AuthShell>
  );
}
