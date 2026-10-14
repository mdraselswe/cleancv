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
    title="এখানে সাইন-ইন চালু নেই"
    subtitle="এই ইনস্টলে সাইন-ইনের কোনো ব্যবস্থা ঠিক করা নেই, তাই সাইন-ইন করার মতো কিছু নেই।"
  >
    <div className="flex flex-col gap-4">
      <AuthNotice tone="info">
        <code className="font-mono">DATABASE_URL</code>,{' '}
        <code className="font-mono">BETTER_AUTH_SECRET</code> আর Google-এর তথ্য সেট করে আবার চালু করুন।
        <code className="font-mono">.env.example</code> দেখুন।
      </AuthNotice>

      <Link
        href={ROUTES.editor}
        className="tap-target text-fg text-ui-md text-center font-medium underline"
      >
        এডিটরে ফিরে যান
      </Link>
    </div>
  </AuthShell>
);
