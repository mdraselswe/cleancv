import type { Metadata } from 'next';

import { FeaturesPage } from '@/features/home';

export const metadata: Metadata = {
  title: 'What’s included',
  description: 'Everything CleanCV gives you for free, with every limit and where your data lives.',
};

export default function Page() {
  return <FeaturesPage />;
}
