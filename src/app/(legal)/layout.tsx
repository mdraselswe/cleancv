import type { Metadata } from 'next';

import { APP_NAME } from '@/constants';

/**
 * The published documents.
 *
 * Indexed, unlike the sign-in pages: a consent screen links here, and somebody
 * checking what a tool does with their CV should be able to find the answer by
 * searching for it.
 */
export const metadata: Metadata = {
  title: { template: `%s — ${APP_NAME}`, default: APP_NAME },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
