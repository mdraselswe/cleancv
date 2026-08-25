import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4, Space_Grotesk } from 'next/font/google';

import { APP_NAME, APP_TAGLINE } from '@/constants';
import { THEME_BOOTSTRAP_SCRIPT } from '@/hooks';

import './globals.css';
import '@/styles/resume.css';

/**
 * Fonts are self-hosted by next/font so Chrome embeds real, subsettable faces
 * in the PDF. A web font that fails to load falls back to a metric-different
 * system face and silently changes pagination.
 */
const appSans = Inter({
  subsets: ['latin'],
  variable: '--font-app-sans',
  display: 'swap',
});

const resumeSans = Inter({
  subsets: ['latin'],
  variable: '--font-resume-sans',
  display: 'block',
});

const resumeSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-resume-serif',
  display: 'block',
});

const resumeGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-resume-grotesk',
  display: 'block',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${appSans.variable} ${resumeSans.variable} ${resumeSerif.variable} ${resumeGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the stored theme before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      {/*
        Extensions write their own attributes onto `body` before React
        hydrates — ColorZilla's `cz-shortcut-listen` is the common one — and
        React reports each as a hydration mismatch the app cannot fix or
        prevent. Suppressing it here covers this element's own attributes and
        nothing deeper: a real mismatch anywhere inside the app still surfaces,
        which is the point of leaving the warning switched on everywhere else.

        On `html` above it is ours: the theme script sets `data-theme` before
        hydration on purpose.
      */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
