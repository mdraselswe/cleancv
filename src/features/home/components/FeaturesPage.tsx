import {
  Cloud,
  Database,
  Download,
  FileDown,
  FileUp,
  Gauge,
  HardDrive,
  Heart,
  Layers,
  LayoutTemplate,
  Lock,
  Palette,
  ShieldCheck,
  Undo2,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import type { Hue } from '@/components/ui';
import {
  ACCOUNT_DELETION_DAYS,
  AUTH_ROUTES,
  LEGAL_ROUTES,
  MAX_DOCUMENTS,
  PDF_RATE_LIMIT,
  ROUTES,
  SECTION_KEYS,
} from '@/constants';
import { getAvailableTemplates } from '@/features/templates';

import { FreeBanner } from './FreeBanner';
import { HomeHeader } from './HomeHeader';
import { SiteFooter } from './SiteFooter';

interface Fact {
  icon: LucideIcon;
  title: string;
  body: string;
}

interface Group {
  id: string;
  hue: Hue;
  title: string;
  lead: string;
  facts: Fact[];
}

/**
 * Every number here is read from the constant that enforces it, and every claim
 * is one the code or the published policy already makes. If a limit changes,
 * this page changes with it — there is no second copy to forget.
 */
const buildGroups = (): Group[] => {
  const templates = getAvailableTemplates().length;
  const rateMinutes = PDF_RATE_LIMIT.windowMs / 60000;

  return [
    {
      id: 'price',
      hue: 'rose',
      title: 'Price',
      lead: 'There is nothing to buy and nothing to unlock.',
      facts: [
        {
          icon: Heart,
          title: 'Free, with no plan to upgrade to',
          body: 'No subscription, no trial period, no credit card, no paid templates and no watermark.',
        },
        {
          icon: UserRound,
          title: 'A free account to download',
          body: 'Write, design, score and import without signing in. Downloading a PDF needs a free account, which also syncs your CVs across devices.',
        },
      ],
    },
    {
      id: 'create',
      hue: 'indigo',
      title: 'Creating CVs',
      lead: 'Everything you need to write one, and as many versions as you have jobs.',
      facts: [
        {
          icon: Layers,
          title: `Up to ${MAX_DOCUMENTS} CVs in one browser`,
          body: 'Keep one per job application. Duplicate any CV to tailor a copy; rename, reorder and delete freely.',
        },
        {
          icon: LayoutTemplate,
          title: `${templates} ATS-tested designs`,
          body: 'Switch between them at any time. Your content stays; only the layout changes.',
        },
        {
          icon: Palette,
          title: 'Your own look',
          body: 'Accent colour, font, text size, spacing, page margin, photo shape — and your own custom sections.',
        },
        {
          icon: Layers,
          title: `${SECTION_KEYS.length} section types`,
          body: 'Experience, education, skills, projects, certifications, publications, references and more. Turn on what you need, drag to reorder.',
        },
        {
          icon: Gauge,
          title: 'Live ATS score',
          body: 'See what a parser would trip on, jump straight to the fix, and match against a job description’s keywords.',
        },
        {
          icon: FileUp,
          title: 'Import an existing CV',
          body: 'PDF, DOCX or a screenshot. You review everything before it is written into your CV.',
        },
        {
          icon: Undo2,
          title: 'Autosave, undo and redo',
          body: 'Every change is saved as you type. Undo and redo with Ctrl+Z.',
        },
      ],
    },
    {
      id: 'download',
      hue: 'emerald',
      title: 'Downloading',
      lead: 'The file is yours the moment it is made.',
      facts: [
        {
          icon: Download,
          title: 'Designed PDF and ATS-safe PDF',
          body: 'One for people to read, one plain single-column file for job portals. Same CV, two outputs.',
        },
        {
          icon: FileDown,
          title: 'No limit on how many you download',
          body: `Sign in once and download as often as you need. The only guard is fair use: up to ${PDF_RATE_LIMIT.max} PDFs every ${rateMinutes} minutes from one connection.`,
        },
        {
          icon: Database,
          title: 'JSON backup of everything',
          body: 'Back up one CV or all of them, and restore on any other browser or machine.',
        },
      ],
    },
    {
      id: 'data',
      hue: 'amber',
      title: 'Where your data lives',
      lead: 'On your device first. Our server only sees a CV when you ask it to.',
      facts: [
        {
          icon: HardDrive,
          title: 'Saved in your browser',
          body: 'CVs are stored in your browser’s own storage, on your device. Signed-out CVs are never uploaded. Clearing browser data can erase them, so keep a backup.',
        },
        {
          icon: Lock,
          title: 'PDF rendering is the one upload',
          body: 'Downloading sends the CV to our server to be drawn, then it is discarded as soon as the file is returned. Nothing is kept.',
        },
        {
          icon: Cloud,
          title: 'Free cloud sync with your account',
          body: 'Once you are signed in, your CVs are copied to your account so they follow you to other devices. The copy in your browser stays either way.',
        },
        {
          icon: HardDrive,
          title: 'Optional workspace folder',
          body: 'On browsers that support it (Chrome, Edge) every CV can be written into a folder you choose — for example one your cloud drive already syncs.',
        },
        {
          icon: ShieldCheck,
          title: 'No ads, no advertising profiles',
          body: `Only anonymous visit counts. If you delete an account, its data is removed within ${ACCOUNT_DELETION_DAYS} days.`,
        },
      ],
    },
  ];
};

/** One page that lists everything the app gives you, and every limit it has. */
export const FeaturesPage = () => {
  const groups = buildGroups();

  return (
    <div className="bg-bg min-h-dvh">
      <FreeBanner />
      <HomeHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-10 flex flex-col gap-3">
          <h1 className="app-gradient-text w-fit text-4xl font-extrabold tracking-tight sm:text-5xl">
            What’s included
          </h1>
          <p className="text-fg-muted text-ui-lg max-w-2xl leading-relaxed">
            Everything below is free. This page lists what you get, how much of it, and where your
            data goes — so there are no surprises.
          </p>
          <nav aria-label="On this page" className="flex flex-wrap gap-2 pt-1">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className={`hue-${group.hue} bg-hue-soft text-hue-strong text-ui rounded-full px-3 py-1 font-semibold transition hover:brightness-95`}
              >
                {group.title}
              </a>
            ))}
          </nav>
        </header>

        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-24">
              <div className={`hue-${group.hue} mb-4 border-l-4 border-hue pl-3`}>
                <h2 className="text-fg text-2xl font-extrabold tracking-tight">{group.title}</h2>
                <p className="text-fg-subtle text-ui-md">{group.lead}</p>
              </div>

              <ul className="stagger grid gap-3 sm:grid-cols-2">
                {group.facts.map(({ icon: Icon, title, body }) => (
                  <li
                    key={title}
                    className={`hue-${group.hue} card-lift border-border-base bg-surface rounded-card flex gap-3 border p-4`}
                  >
                    <span className="bg-hue-soft text-hue-strong flex h-10 w-10 flex-none items-center justify-center rounded-control">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-fg text-ui-md font-bold">{title}</h3>
                      <p className="text-fg-muted text-ui mt-1 leading-relaxed">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="border-primary/20 bg-primary-soft/50 rounded-panel mt-12 flex flex-wrap items-center justify-between gap-4 border p-6">
          <div>
            <h2 className="text-fg text-xl font-extrabold">Read the fine print</h2>
            <p className="text-fg-muted text-ui-md">
              Plain-language documents, each claim checkable against what the app does.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={LEGAL_ROUTES.privacy}
              className="border-border-strong bg-surface text-fg hover:border-primary/40 rounded-control text-ui-md inline-flex h-10 items-center border px-4 font-medium transition"
            >
              Privacy policy
            </Link>
            <Link
              href={LEGAL_ROUTES.terms}
              className="border-border-strong bg-surface text-fg hover:border-primary/40 rounded-control text-ui-md inline-flex h-10 items-center border px-4 font-medium transition"
            >
              Terms of service
            </Link>
            <Link
              href={AUTH_ROUTES.signIn}
              className="border-border-strong bg-surface text-fg hover:border-primary/40 rounded-control text-ui-md inline-flex h-10 items-center border px-4 font-medium transition"
            >
              Sign in
            </Link>
            <Link
              href={ROUTES.editor}
              className="app-button-primary glint rounded-control text-ui-md inline-flex h-10 items-center px-5 font-medium text-white"
            >
              Start a CV
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};
