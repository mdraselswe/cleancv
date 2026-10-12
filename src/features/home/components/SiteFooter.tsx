import Link from 'next/link';

import { APP_NAME, AUTH_ROUTES, LEGAL_ROUTES, ROUTES } from '@/constants';

const LINKS = [
  { href: ROUTES.features, label: 'What’s included' },
  { href: LEGAL_ROUTES.privacy, label: 'Privacy' },
  { href: LEGAL_ROUTES.terms, label: 'Terms' },
  { href: AUTH_ROUTES.signIn, label: 'Sign in' },
  { href: AUTH_ROUTES.signUp, label: 'Create account' },
] as const;

/** Shared by the home and features pages: the legal and account links in one row. */
export const SiteFooter = () => (
  <footer className="border-border-base mt-8 border-t">
    <div className="text-fg-subtle text-ui-xs mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
      <span>
        {APP_NAME} · free to use · your CVs stay in this browser unless you sign in to sync them.
      </span>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-fg underline">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  </footer>
);
