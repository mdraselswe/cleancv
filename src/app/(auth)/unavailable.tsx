import Link from 'next/link';

import { ROUTES } from '@/constants';
import { AuthNotice, AuthShell } from '@/features/auth';

/**
 * What the sign-in pages show on an install with no auth configured.
 *
 * A fresh clone has no database and no secret, while the local editor and PDF
 * downloads open without either (in development only). Throwing a stack trace at that reader would say
 * the app is broken, when what is true is that this one door has not been
 * fitted yet. In production the same condition is a hard error instead — see
 * `assertAuthConfigured`.
 */
export const AuthUnavailable = () => (
  <AuthShell
    title="Accounts are not set up here"
    subtitle="This install has no database configured, so there is nothing to sign in to."
  >
    <div className="flex flex-col gap-4">
      <AuthNotice tone="info">
        Set <code className="font-mono">DATABASE_URL</code> and{' '}
        <code className="font-mono">BETTER_AUTH_SECRET</code>, then restart. See{' '}
        <code className="font-mono">.env.example</code>.
      </AuthNotice>

      <Link
        href={ROUTES.editor}
        className="tap-target text-fg text-ui-md text-center font-medium underline"
      >
        Back to the editor
      </Link>
    </div>
  </AuthShell>
);
