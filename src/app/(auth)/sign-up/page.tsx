import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthShell, SignUpForm, readRedirect, type SearchParams } from '@/features/auth';
import { getSessionUser } from '@/server/auth/session';
import { isAuthConfigured, isGoogleConfigured } from '@/server/env';

import { AuthUnavailable } from '../unavailable';

export const metadata: Metadata = { title: 'Create an account' };
export const dynamic = 'force-dynamic';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isAuthConfigured()) return <AuthUnavailable />;

  const next = readRedirect(await searchParams);

  if (await getSessionUser()) redirect(next);

  return (
    <AuthShell
      title="Create an account"
      subtitle="One account unlocks the PDF downloads. Your CV never leaves this browser."
    >
      <SignUpForm redirectTo={next} googleEnabled={isGoogleConfigured()} />
    </AuthShell>
  );
}
