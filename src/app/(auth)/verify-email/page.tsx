import { MailCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AUTH_ROUTES, ROUTES } from '@/constants';
import { AuthNotice, AuthShell, readParam, type SearchParams } from '@/features/auth';
import { getSessionUser } from '@/server/auth/session';
import { isAuthConfigured } from '@/server/env';

import { AuthUnavailable } from '../unavailable';

export const metadata: Metadata = { title: 'Email confirmed' };
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
  TOKEN_EXPIRED: 'That link has expired. They last an hour.',
  INVALID_TOKEN: 'That link is not valid any more. Confirmation links work once.',
  USER_NOT_FOUND: 'That link belongs to an account that no longer exists.',
  INVALID_USER: 'That link belongs to a different account than the one signed in here.',
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
      <AuthShell title="That link did not work">
        <div className="flex flex-col gap-4">
          <AuthNotice tone="error">
            {FAILURE_MESSAGE[error] ?? 'That confirmation link could not be used.'}
          </AuthNotice>
          <p className="text-fg-subtle text-ui-md leading-relaxed">
            Sign in with your email and password, and the page will offer to send a fresh link.
          </p>
          <Link
            href={AUTH_ROUTES.signIn}
            className="tap-target text-fg text-ui-md text-center font-medium underline"
          >
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (!user) {
    return (
      <AuthShell title="Check your inbox" subtitle="The confirmation link works for an hour.">
        <Link
          href={AUTH_ROUTES.signIn}
          className="tap-target text-fg text-ui-md text-center font-medium underline"
        >
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Email confirmed" subtitle={`You are signed in as ${user.email}.`}>
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted text-ui-md flex items-start gap-3 leading-relaxed">
          <span className="bg-success/12 text-success rounded-control flex h-9 w-9 flex-none items-center justify-center">
            <MailCheck size={17} aria-hidden="true" />
          </span>
          Downloads are open now. Everything you built is where you left it.
        </p>

        <Link
          href={ROUTES.editor}
          className="bg-primary text-primary-fg rounded-control tap-target text-ui-md flex h-11 items-center justify-center font-medium transition hover:brightness-110"
        >
          Back to my CV
        </Link>
      </div>
    </AuthShell>
  );
}
