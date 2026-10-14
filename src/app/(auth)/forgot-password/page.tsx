import type { Metadata } from 'next';

import { AuthShell, ForgotPasswordForm } from '@/features/auth';
import { redirect } from 'next/navigation';

import { AUTH_ROUTES } from '@/constants';
import { isAuthConfigured, isEmailAuthEnabled } from '@/server/env';

import { AuthUnavailable } from '../unavailable';

export const metadata: Metadata = { title: 'পাসওয়ার্ড রিসেট করুন' };
export const dynamic = 'force-dynamic';

/**
 * No session check here, unlike the other pages.
 *
 * Somebody signed in on this browser may still be resetting the password
 * because they no longer trust it — redirecting them into the editor would
 * take away the one page that fixes that.
 */
export default function ForgotPasswordPage() {
  if (!isAuthConfigured()) return <AuthUnavailable />;
  // Nothing to reset where there are no passwords, and no mail to send the link by.
  if (!isEmailAuthEnabled()) redirect(AUTH_ROUTES.signIn);

  return (
    <AuthShell
      title="পাসওয়ার্ড রিসেট করুন"
      subtitle="অ্যাকাউন্টের ইমেইল ঠিকানাটি লিখুন, আমরা একটি লিংক পাঠাব।"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
