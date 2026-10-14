import type { Metadata } from 'next';

import { APP_NAME } from '@/constants';
import { TermsOfService } from '@/features/legal';
import { isEmailAuthEnabled } from '@/server/env';

export const metadata: Metadata = {
  title: 'ব্যবহারের শর্তাবলি',
  description: `${APP_NAME} ব্যবহারের নিয়মকানুন।`,
};

export default function TermsPage() {
  return <TermsOfService emailAuth={isEmailAuthEnabled()} />;
}
