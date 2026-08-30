import type { Metadata } from 'next';

import { APP_NAME } from '@/constants';
import { PrivacyPolicy } from '@/features/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${APP_NAME} handles your CV, optional cloud sync, and your account.`,
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
