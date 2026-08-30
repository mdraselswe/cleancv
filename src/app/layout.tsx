import type { Metadata, Viewport } from 'next';
import { Inter, PT_Sans, Rubik, Source_Serif_4, Space_Grotesk, Volkhov } from 'next/font/google';

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

/** The picker's humanist sans, and the body face Formal Centered defaults to. */
const resumeHumanist = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-resume-humanist',
  display: 'block',
});

const resumeSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-resume-serif',
  display: 'block',
});

/*
 * Display faces: headings, not body text, and not offered in the picker — a
 * design reaches for one by name. Formal Centered sets its name and section
 * headings in Volkhov over a PT Sans body; Right Panel sets its titles in Rubik
 * over an Inter body. See ADR-031.
 */
const displaySerif = Volkhov({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display-serif',
  display: 'block',
});

const displaySans = Rubik({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display-sans',
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
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  /*
   * Lets the page draw under the notch and the home indicator, which is what
   * makes `env(safe-area-inset-*)` report anything but zero. The bottom bar
   * pads itself back out of the way; without this it had nothing to pad by.
   */
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#161a21' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${appSans.variable} ${resumeSans.variable} ${resumeHumanist.variable} ${resumeSerif.variable} ${displaySerif.variable} ${displaySans.variable} ${resumeGrotesk.variable}`}
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
