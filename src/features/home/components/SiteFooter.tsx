import Link from 'next/link';

import {
  APP_NAME,
  AUTHOR_LINKEDIN_URL,
  AUTH_ROUTES,
  CLOUD_SYNC,
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY,
  LEGAL_ROUTES,
  ROUTES,
} from '@/constants';
import { bn } from '@/lib/bn';

const LINKS = [
  { href: ROUTES.features, label: 'কী কী আছে' },
  { href: LEGAL_ROUTES.privacy, label: 'গোপনীয়তা' },
  { href: LEGAL_ROUTES.terms, label: 'শর্তাবলি' },
  { href: AUTH_ROUTES.signIn, label: 'সাইন-ইন' },
  { href: AUTH_ROUTES.signUp, label: 'অ্যাকাউন্ট খুলুন' },
] as const;

/** Shared by the home and features pages: the legal and account links in one row. */
export const SiteFooter = () => (
  <footer className="border-border-base mt-8 border-t">
    <div className="text-fg-subtle text-ui-xs mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
      <span className="flex flex-col gap-1">
        <span>
          {APP_NAME} · ব্যবহার ফ্রি · আপনার CV এই ব্রাউজারেই থাকে; আপনার বেছে নেওয়া{' '}
          {bn(CLOUD_SYNC.maxDocuments)}টি পর্যন্ত অ্যাকাউন্টে সিঙ্ক করা যায়।
        </span>
        <span>
          তৈরি করেছেন{' '}
          <a
            href={AUTHOR_LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg hover:text-primary font-semibold underline"
          >
            {LEGAL_ENTITY}
          </a>{' '}
          ·{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="hover:text-fg underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
        </span>
      </span>
      <nav aria-label="ফুটার" className="flex flex-wrap gap-x-4 gap-y-1">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-fg underline">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  </footer>
);
