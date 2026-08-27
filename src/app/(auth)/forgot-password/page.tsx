import type { Metadata } from 'next';

import { AuthShell, ForgotPasswordForm } from '@/features/auth';
import { isAuthConfigured } from '@/server/env';

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

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Tell us the address on the account and we will send a link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
