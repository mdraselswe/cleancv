import Link from 'next/link';

import { EmptyIllustration } from '@/components/illustrations';
import { ROUTES } from '@/constants';

export default function NotFound() {
  return (
    <main className="bg-bg flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="w-56">
        <EmptyIllustration />
      </div>
      <h1 className="text-fg text-3xl font-extrabold tracking-tight">পেজটি পাওয়া যায়নি</h1>
      <p className="text-fg-muted text-ui-md max-w-sm">
        ওই পেজটি নেই। আপনার CV নিরাপদ আছে — ফিরে যান আর যেখানে ছেড়েছিলেন সেখান থেকে শুরু করুন।
      </p>
      <Link
        href={ROUTES.home}
        className="app-button-primary glint rounded-control text-ui-md inline-flex h-10 items-center px-5 font-medium text-white"
      >
        হোমে ফিরে যান
      </Link>
    </main>
  );
}
