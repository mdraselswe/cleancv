import { Heart } from 'lucide-react';
import Link from 'next/link';

import { MAX_DOCUMENTS, PDF_RATE_LIMIT, ROUTES } from '@/constants';

/**
 * The one line that says what this costs, and the only conditions.
 *
 * Every number is read from the constant that enforces it, so the claim and
 * the behaviour cannot drift apart. The conditions are stated beside the
 * promise rather than behind a link — a "free" with a footnote is how people
 * stop trusting the word.
 */
export const FreeBanner = () => (
  <div className="app-gradient-bg animate-gradient text-white">
    <p className="text-ui-xs mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-4 py-2 text-center font-medium sm:px-6">
      <Heart size={13} className="flex-none" aria-hidden="true" fill="currentColor" />
      <span>
        <strong className="font-extrabold">100% free</strong> — no account needed to edit or
        download. Only conditions: {MAX_DOCUMENTS} CVs per browser and{' '}
        {PDF_RATE_LIMIT.max} PDFs per {PDF_RATE_LIMIT.windowMs / 60000} minutes.
      </span>
      <Link href={ROUTES.features} className="font-bold underline underline-offset-2">
        See everything included
      </Link>
    </p>
  </div>
);
