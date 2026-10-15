import { MailCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AUTH_ROUTES, ROUTES } from '@/constants';
import { AuthNotice, AuthShell, readParam, type SearchParams } from '@/features/auth';
import { getSessionUser } from '@/server/auth/session';
import { isAuthConfigured } from '@/server/env';

import { AuthUnavailable } from '../unavailable';

export const metadata: Metadata = { title: 'ইমেইল নিশ্চিত হয়েছে' };
export const dynamic = 'force-dynamic';

/**
 * Where a confirmation link lands, whichever way it went.
 *
 * Better Auth verifies the token in its own route and redirects here — with
 * `?error=` if the link was spent, expired or malformed, and with a session
 * cookie already set if it was good. So this page reports an outcome; it never
 * verifies anything itself.
 *
 * The failure state does not offer a "resend" button, because sending a link
 * needs an address and an expired link no longer proves which one. The sign-in
 * page asks for the address and offers the link from there.
 */
const FAILURE_MESSAGE: Record<string, string> = {
  TOKEN_EXPIRED: 'ওই লিংকের মেয়াদ শেষ। লিংক এক ঘণ্টা কাজ করে।',
  INVALID_TOKEN: 'ওই লিংকটি আর কাজ করে না। নিশ্চিত করার লিংক একবারই কাজ করে।',
  USER_NOT_FOUND: 'ওই লিংকটি এমন একটি অ্যাকাউন্টের, যা আর নেই।',
  INVALID_USER: 'ওই লিংকটি এখানে সাইন-ইন করা অ্যাকাউন্টের নয়, অন্য একটির।',
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isAuthConfigured()) return <AuthUnavailable />;

  const error = readParam(await searchParams, 'error');
  const user = await getSessionUser();

  if (error) {
    return (
      <AuthShell title="লিংকটি কাজ করেনি">
        <div className="flex flex-col gap-4">
          <AuthNotice tone="error">
            {FAILURE_MESSAGE[error] ?? 'নিশ্চিত করার লিংকটি ব্যবহার করা যায়নি।'}
          </AuthNotice>
          <p className="text-fg-subtle text-ui-md leading-relaxed">
            ইমেইল ও পাসওয়ার্ড দিয়ে সাইন-ইন করুন, তাহলে পেজটি নতুন লিংক পাঠানোর সুযোগ দেবে।
          </p>
          <Link
            href={AUTH_ROUTES.signIn}
            className="tap-target text-fg text-ui-md text-center font-medium underline"
          >
            সাইন-ইনে যান
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (!user) {
    return (
      <AuthShell title="আপনার ইনবক্স দেখুন" subtitle="নিশ্চিত করার লিংক এক ঘণ্টা কাজ করে।">
        <Link
          href={AUTH_ROUTES.signIn}
          className="tap-target text-fg text-ui-md text-center font-medium underline"
        >
          সাইন-ইনে ফিরে যান
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="ইমেইল নিশ্চিত হয়েছে" subtitle={`আপনি ${user.email} হিসেবে সাইন-ইন করা আছেন।`}>
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted text-ui-md flex items-start gap-3 leading-relaxed">
          <span className="bg-success/12 text-success rounded-control flex h-9 w-9 flex-none items-center justify-center">
            <MailCheck size={17} aria-hidden="true" />
          </span>
          ডাউনলোড এখন চালু। আপনার বানানো সবকিছু যেখানে রেখেছিলেন সেখানেই আছে।
        </p>

        <Link
          href={ROUTES.editor}
          className="bg-primary text-primary-fg rounded-control tap-target text-ui-md flex h-11 items-center justify-center font-medium transition hover:brightness-110"
        >
          আমার CV-তে ফিরে যান
        </Link>
      </div>
    </AuthShell>
  );
}
