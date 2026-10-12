import Link from 'next/link';

import { EmptyIllustration } from '@/components/illustrations';
import { ROUTES } from '@/constants';

export default function NotFound() {
  return (
    <main className="bg-bg flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="w-56">
        <EmptyIllustration />
      </div>
      <h1 className="text-fg text-3xl font-extrabold tracking-tight">Page not found</h1>
      <p className="text-fg-muted text-ui-md max-w-sm">
        That page does not exist. Your CVs are safe — head back and pick up where you left off.
      </p>
      <Link
        href={ROUTES.home}
        className="app-button-primary glint rounded-control text-ui-md inline-flex h-10 items-center px-5 font-medium text-white"
      >
        Back to home
      </Link>
    </main>
  );
}
