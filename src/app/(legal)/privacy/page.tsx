import type { Metadata } from 'next';

import { APP_NAME } from '@/constants';
import { PrivacyPolicy } from '@/features/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${APP_NAME} handles your CV and your account: the CV stays in your browser, and the account is a name and an email address.`,
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
