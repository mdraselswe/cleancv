import type { Metadata } from 'next';

import { APP_NAME } from '@/constants';

/**
 * The sign-in pages.
 *
 * `noindex`: these are five near-identical forms with no content of their own,
 * and a search result pointing at a password reset page helps nobody. The
 * editor at `/` is the page worth indexing.
 */
export const metadata: Metadata = {
  title: { template: `%s — ${APP_NAME}`, default: APP_NAME },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
