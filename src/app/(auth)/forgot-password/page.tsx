import type { Metadata } from 'next';

import { AuthShell, ForgotPasswordForm } from '@/features/auth';
import { redirect } from 'next/navigation';

import { AUTH_ROUTES } from '@/constants';
import { isAuthConfigured, isEmailAuthEnabled } from '@/server/env';

import { AuthUnavailable } from '../unavailable';

export const metadata: Metadata = { title: 'Reset your password' };
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
      title="Reset your password"
      subtitle="Tell us the address on the account and we will send a link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
