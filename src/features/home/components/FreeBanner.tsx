import { Heart } from 'lucide-react';
import Link from 'next/link';

import { CLOUD_SYNC, MAX_DOCUMENTS, PDF_RATE_LIMIT, ROUTES } from '@/constants';
import { bn } from '@/lib/bn';
import { Lang } from '@/i18n';

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
    {/*
      One run of inline text, so the heart and the link sit in the sentence
      instead of each taking a row of their own - as flex items they did, which
      made a two-line banner three lines tall.
    */}
    <p className="text-ui mx-auto w-full max-w-6xl px-4 py-1.5 text-center font-medium sm:px-6">
      <Heart
        size={13}
        className="mr-1.5 inline-block align-[-0.1em]"
        aria-hidden="true"
        fill="currentColor"
      />
      <Lang
        bn={
          <span>
            <strong className="font-extrabold">১০০% ফ্রি</strong> — সম্পাদনায় অ্যাকাউন্ট লাগে না;
            শুধু ডাউনলোডের জন্য একটি ফ্রি অ্যাকাউন্ট দরকার। সীমা: প্রতি ব্রাউজারে{' '}
            {bn(MAX_DOCUMENTS)}টি CV (এর মধ্যে {bn(CLOUD_SYNC.maxDocuments)}টি পর্যন্ত অ্যাকাউন্টে সিঙ্ক
            করা যায়), প্রতি {bn(PDF_RATE_LIMIT.windowMs / 60000)} মিনিটে {bn(PDF_RATE_LIMIT.max)}টি PDF।
          </span>
        }
        en={
          <span>
            <strong className="font-extrabold">100% free</strong> — edit with no account; a free
            account is needed only to download. Limits: {MAX_DOCUMENTS} CVs per browser (up to{' '}
            {CLOUD_SYNC.maxDocuments} sync to your account), {PDF_RATE_LIMIT.max} PDFs per{' '}
            {PDF_RATE_LIMIT.windowMs / 60000} minutes.
          </span>
        }
      />
      {' '}
      <Link href={ROUTES.features} className="font-bold whitespace-nowrap underline underline-offset-2">
        কী কী আছে সব দেখুন
      </Link>
    </p>
  </div>
);
