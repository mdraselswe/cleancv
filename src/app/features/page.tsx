import type { Metadata } from 'next';

import { FeaturesPage } from '@/features/home';

export const metadata: Metadata = {
  title: 'কী কী আছে',
  description: 'CleanCV আপনাকে বিনা খরচে যা যা দেয়, প্রতিটি সীমা, আর আপনার ডেটা কোথায় থাকে।',
};

export default function Page() {
  return <FeaturesPage />;
}
