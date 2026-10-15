import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { APP_NAME, LEGAL_ROUTES, LEGAL_UPDATED, ROUTES } from '@/constants';

export interface LegalShellProps {
  title: string;
  /** One line under the heading saying what this document is for. */
  summary: string;
  children: React.ReactNode;
}

/**
 * The page around a published document.
 *
 * One column at a reading measure, not the app's two panes: this is prose
 * somebody reads top to bottom, usually once, often because a consent screen
 * sent them here. The way back to the editor is at the top, because the most
 * likely reason anyone is on this page is that they were part-way through a CV.
 *
 * Every heading carries an `id`, so the paragraph a support reply points at can
 * be linked to rather than described.
 */
export const LegalShell = ({ title, summary, children }: LegalShellProps) => (
  <main className="bg-canvas relative isolate min-h-dvh overflow-hidden">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72">
      <div className="bg-hue-indigo/15 animate-drift absolute -top-24 left-1/4 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-hue-pink/15 animate-drift absolute -top-16 right-1/4 h-56 w-56 rounded-full blur-3xl [animation-delay:-5s]" />
    </div>
    <div className="animate-rise mx-auto flex w-full max-w-[680px] flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={ROUTES.editor}
        className="tap-target text-fg-muted hover:text-fg text-ui-md inline-flex w-fit items-center gap-1.5 font-medium transition"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        {`${APP_NAME}-এ ফিরে যান`}
      </Link>

      <header className="flex flex-col gap-2">
        <span className="hue-indigo bg-hue-soft text-hue-strong flex h-11 w-11 items-center justify-center rounded-card">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <h1 className="app-gradient-text w-fit text-3xl font-extrabold sm:text-4xl">
          {title}
        </h1>
        <p className="text-fg-muted text-ui-lg leading-relaxed">{summary}</p>
        <p className="text-fg-subtle text-ui-xs">
          সর্বশেষ আপডেট{' '}
          <time dateTime={LEGAL_UPDATED}>
            {new Date(LEGAL_UPDATED).toLocaleDateString('bn-BD', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
        </p>
      </header>

      <article className="border-border-base bg-surface rounded-panel flex flex-col gap-6 border p-5 sm:p-7">
        {children}
      </article>

      <footer className="text-fg-subtle text-ui-md flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={LEGAL_ROUTES.privacy} className="tap-target hover:text-fg underline">
          গোপনীয়তা
        </Link>
        <Link href={LEGAL_ROUTES.terms} className="tap-target hover:text-fg underline">
          শর্তাবলি
        </Link>
        <Link href={ROUTES.editor} className="tap-target hover:text-fg underline">
          {APP_NAME}
        </Link>
      </footer>
    </div>
  </main>
);

export interface LegalSectionProps {
  id: string;
  heading: string;
  children: React.ReactNode;
}

/** One numbered part of a document, linkable by its own `id`. */
export const LegalSection = ({ id, heading, children }: LegalSectionProps) => (
  <section id={id} className="flex scroll-mt-6 flex-col gap-2.5">
    <h2 className="text-fg text-ui-lg border-primary/40 border-l-4 pl-3 font-bold">{heading}</h2>
    <div className="text-fg-muted text-ui-md flex flex-col gap-2.5 leading-relaxed">{children}</div>
  </section>
);

/**
 * A list inside a document.
 *
 * The bullet is a real character in a span rather than `list-style`, for the
 * same reason the resume templates do it: a marker drawn by CSS is on the page
 * and not in the text, so it does not survive being copied or read aloud.
 */
export const LegalList = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="flex flex-col gap-1.5">
    {items.map((item, index) => (
      <li key={index} className="flex gap-2.5">
        <span aria-hidden="true" className="text-fg-subtle flex-none">
          •
        </span>
        <span className="min-w-0">{item}</span>
      </li>
    ))}
  </ul>
);
