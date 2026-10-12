import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthShell, SignUpForm, readRedirect, type SearchParams } from '@/features/auth';
import { getSessionUser } from '@/server/auth/session';
import { isAuthConfigured, isEmailAuthEnabled, isGoogleConfigured } from '@/server/env';

import { AuthUnavailable } from '../unavailable';

export const metadata: Metadata = { title: 'Create an account' };
export const dynamic = 'force-dynamic';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isAuthConfigured() || (!isGoogleConfigured() && !isEmailAuthEnabled())) {
    return <AuthUnavailable />;
  }

  const next = readRedirect(await searchParams);

  if (await getSessionUser()) redirect(next);

  return (
    <AuthShell
      title="Create an account"
      subtitle="A free account unlocks PDF downloads and syncs your CVs across devices."
    >
      <SignUpForm
        redirectTo={next}
        googleEnabled={isGoogleConfigured()}
        emailEnabled={isEmailAuthEnabled()}
      />
    </AuthShell>
  );
}
