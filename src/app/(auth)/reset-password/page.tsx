import type { Metadata } from 'next';

import { TOKEN_PARAM } from '@/constants';
import { AuthShell, ResetPasswordForm, readParam, type SearchParams } from '@/features/auth';
import { redirect } from 'next/navigation';

import { AUTH_ROUTES } from '@/constants';
import { isAuthConfigured, isEmailAuthEnabled } from '@/server/env';

import { AuthUnavailable } from '../unavailable';

export const metadata: Metadata = { title: 'নতুন পাসওয়ার্ড বেছে নিন' };
export const dynamic = 'force-dynamic';

/**
 * Where the emailed reset link lands.
 *
 * The token arrives in the query string, having been checked and re-issued by
 * Better Auth's own callback on the way here. It is read on the server and
 * handed down as a prop rather than pulled out of the URL by the form: a
 * client component reading `useSearchParams` would need a Suspense boundary
 * around it, and the value is known here for free.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isAuthConfigured()) return <AuthUnavailable />;
  if (!isEmailAuthEnabled()) redirect(AUTH_ROUTES.signIn);

  const token = readParam(await searchParams, TOKEN_PARAM);

  return (
    <AuthShell title="নতুন পাসওয়ার্ড বেছে নিন" subtitle="এতে অন্য সব ব্রাউজার সাইন-আউট হয়ে যাবে।">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
