import Link from 'next/link';

import { BrandMark } from '@/components/brand';
import { EmptyIllustration } from '@/components/illustrations';
import { APP_NAME, LEGAL_ROUTES, ROUTES } from '@/constants';

/**
 * The page around a sign-in form.
 *
 * One column, centred, capped at a readable width — the same at 390px and at
 * 1440px, because a login form has four fields and nothing useful to do with a
 * second column. The brand links back to the editor rather than to a marketing
 * page: somebody who landed here by clicking Download and changed their mind
 * needs the way back to be obvious.
 */
export interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Sits under the card — the "no account yet?" line. */
  footer?: React.ReactNode;
}

export const AuthShell = ({ title, subtitle, children, footer }: AuthShellProps) => (
  <main className="bg-canvas relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="bg-hue-indigo/20 animate-drift absolute -top-20 -left-20 h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-hue-pink/20 animate-drift absolute -right-16 bottom-0 h-72 w-72 rounded-full blur-3xl [animation-delay:-6s]" />
      <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
    </div>

    <div className="animate-rise flex w-full max-w-[400px] flex-col gap-5">
      <Link
        href={ROUTES.editor}
        className="tap-target text-fg-muted hover:text-fg text-ui-md mx-auto inline-flex items-center gap-2 font-semibold transition"
      >
        <BrandMark className="h-8 w-8" />
        <span className="app-gradient-text text-ui-lg font-extrabold ">{APP_NAME}</span>
      </Link>

      <div className="mx-auto -mb-2 w-28">
        <EmptyIllustration />
      </div>

      <div className="border-border-base bg-surface rounded-panel shadow-pop flex flex-col gap-4 border p-5 backdrop-blur sm:p-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-fg text-lg font-semibold">{title}</h1>
          {subtitle ? (
            <p className="text-fg-subtle text-ui-md leading-relaxed">{subtitle}</p>
          ) : null}
        </header>

        {children}
      </div>

      {footer ? <div className="text-fg-subtle text-ui-md text-center">{footer}</div> : null}

      {/*
        On every sign-in page, not only on sign-up. Somebody deciding whether to
        hand over an email address is exactly the reader who wants to know what
        happens to it, and Google's consent screen links here too.
      */}
      <nav className="text-fg-subtle text-ui-xs flex items-center justify-center gap-4">
        <Link href={LEGAL_ROUTES.privacy} className="tap-target hover:text-fg underline">
          গোপনীয়তা
        </Link>
        <Link href={LEGAL_ROUTES.terms} className="tap-target hover:text-fg underline">
          শর্তাবলি
        </Link>
      </nav>
    </div>
  </main>
);
