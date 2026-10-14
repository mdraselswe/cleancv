import type { Metadata } from 'next';

import { APP_NAME } from '@/constants';
import { PrivacyPolicy } from '@/features/legal';
import { isAiConfigured, isEmailAuthEnabled } from '@/server/env';

export const metadata: Metadata = {
  title: 'গোপনীয়তা নীতি',
  description: `${APP_NAME} আপনার CV, ঐচ্ছিক ক্লাউড সিঙ্ক আর অ্যাকাউন্ট কীভাবে সামলায়।`,
};

export default function PrivacyPage() {
  return <PrivacyPolicy emailAuth={isEmailAuthEnabled()} ai={isAiConfigured()} />;
}
