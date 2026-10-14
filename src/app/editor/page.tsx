import type { Metadata } from 'next';

import { EditorScreen } from '@/features/editor';

export const metadata: Metadata = { title: 'এডিটর' };

export default function Page() {
  return <EditorScreen />;
}
