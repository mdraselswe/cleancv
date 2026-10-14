import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthShell, SignUpForm, readRedirect, type SearchParams } from '@/features/auth';
import { getSessionUser } from '@/server/auth/session';
import { isAuthConfigured, isEmailAuthEnabled, isGoogleConfigured } from '@/server/env';

import { AuthUnavailable } from '../unavailable';

export const metadata: Metadata = { title: 'অ্যাকাউন্ট খুলুন' };
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
      title="অ্যাকাউন্ট খুলুন"
      subtitle="একটি ফ্রি অ্যাকাউন্টে PDF ডাউনলোড করা যায়, আর আপনার পছন্দের ৩টি পর্যন্ত CV অ্যাকাউন্টে রাখা যায়।"
    >
      <SignUpForm
        redirectTo={next}
        googleEnabled={isGoogleConfigured()}
        emailEnabled={isEmailAuthEnabled()}
      />
    </AuthShell>
  );
}
