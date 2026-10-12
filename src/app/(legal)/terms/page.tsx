import type { Metadata } from 'next';

import { APP_NAME } from '@/constants';
import { TermsOfService } from '@/features/legal';
import { isEmailAuthEnabled } from '@/server/env';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The rules for using ${APP_NAME}.`,
};

export default function TermsPage() {
  return <TermsOfService emailAuth={isEmailAuthEnabled()} />;
}
