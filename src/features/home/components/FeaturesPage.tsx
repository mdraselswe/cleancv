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
  CLOUD_SYNC,
  LEGAL_ROUTES,
  MAX_DOCUMENTS,
  PDF_RATE_LIMIT,
  ROUTES,
  SECTION_KEYS,
} from '@/constants';
import { getAvailableTemplates } from '@/features/templates';
import { bn } from '@/lib/bn';

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
 * this page changes with it - there is no second copy to forget.
 */
const buildGroups = (): Group[] => {
  const templates = getAvailableTemplates().length;
  const rateMinutes = PDF_RATE_LIMIT.windowMs / 60000;

  return [
    {
      id: 'price',
      hue: 'rose',
      title: 'খরচ',
      lead: 'কেনার কিছু নেই, আনলক করারও কিছু নেই।',
      facts: [
        {
          icon: Heart,
          title: 'সম্পূর্ণ ফ্রি, আপগ্রেড করার কোনো প্ল্যান নেই',
          body: 'কোনো সাবস্ক্রিপশন নেই, ট্রায়াল নেই, ক্রেডিট কার্ড লাগে না, টাকা দিয়ে কেনার ডিজাইন নেই, আর ওয়াটারমার্ক নেই।',
        },
        {
          icon: UserRound,
          title: 'ডাউনলোডের জন্য একটি ফ্রি অ্যাকাউন্ট',
          body: 'লেখা, ডিজাইন, স্কোর দেখা আর ইমপোর্ট সাইন-ইন ছাড়াই করা যায়। PDF ডাউনলোডের জন্য একটি ফ্রি অ্যাকাউন্ট লাগে, যেখানে কয়েকটি CV-ও রাখা যায়।',
        },
      ],
    },
    {
      id: 'create',
      hue: 'indigo',
      title: 'CV বানানো',
      lead: 'একটি CV লেখার জন্য যা যা লাগে, আর যতগুলো চাকরি ততগুলো সংস্করণ।',
      facts: [
        {
          icon: Layers,
          title: `এক ব্রাউজারে ${bn(MAX_DOCUMENTS)}টি পর্যন্ত CV`,
          body: 'প্রতিটি চাকরির জন্য আলাদা একটি CV রাখুন। যেকোনো CV-র কপি বানিয়ে সেটি বদলে নিন; নাম বদলান, ক্রম ঠিক করুন, আর দরকার না হলে মুছে ফেলুন।',
        },
        {
          icon: LayoutTemplate,
          title: `${bn(templates)}টি ATS-পরীক্ষিত ডিজাইন`,
          body: 'যখন খুশি ডিজাইন বদলান। আপনার লেখা যেমন আছে তেমনই থাকে; শুধু লেআউট বদলায়।',
        },
        {
          icon: Palette,
          title: 'নিজের মতো করে সাজানো',
          body: 'প্রধান রং, ফন্ট, লেখার আকার, ফাঁকা জায়গা, পেজ মার্জিন, ছবির আকৃতি — আর নিজের বানানো সেকশন।',
        },
        {
          icon: Layers,
          title: `${bn(SECTION_KEYS.length)} ধরনের সেকশন`,
          body: 'অভিজ্ঞতা, শিক্ষা, দক্ষতা, প্রজেক্ট, সার্টিফিকেশন, প্রকাশনা, রেফারেন্স আরও অনেক। যা লাগে চালু করুন, টেনে ক্রম ঠিক করুন।',
        },
        {
          icon: Gauge,
          title: 'লাইভ ATS স্কোর',
          body: 'দেখুন ATS সফটওয়্যার কোথায় আটকাবে, সমস্যার জায়গায় সরাসরি যান, আর চাকরির বিবরণের কীওয়ার্ডের সঙ্গে মিলিয়ে নিন।',
        },
        {
          icon: FileUp,
          title: 'আগের CV ইমপোর্ট করুন',
          body: 'PDF, DOCX বা স্ক্রিনশট। আপনার CV-তে লেখার আগে সবকিছু আপনি দেখে নিতে পারেন।',
        },
        {
          icon: Undo2,
          title: 'অটোসেভ, আনডু ও রিডু',
          body: 'লেখার সঙ্গে সঙ্গে প্রতিটি পরিবর্তন সেভ করা হয়। Ctrl+Z দিয়ে ফিরিয়ে নিন ও আবার করুন।',
        },
      ],
    },
    {
      id: 'download',
      hue: 'emerald',
      title: 'ডাউনলোড',
      lead: 'ফাইল তৈরি হওয়ার মুহূর্ত থেকেই সেটি আপনার।',
      facts: [
        {
          icon: Download,
          title: 'ডিজাইন করা PDF ও ATS-সেফ PDF',
          body: 'একটি মানুষের পড়ার জন্য, আরেকটি জব পোর্টালের জন্য সাদামাটা এক-কলামের ফাইল। একই CV, দুটি আউটপুট।',
        },
        {
          icon: FileDown,
          title: 'কতবার ডাউনলোড করবেন তার কোনো সীমা নেই',
          body: `একবার সাইন-ইন করে যতবার দরকার ডাউনলোড করুন। একমাত্র নিয়ম হলো সবাই যেন ঠিকভাবে ব্যবহার করে: প্রতি অ্যাকাউন্টে প্রতি ${bn(rateMinutes)} মিনিটে ${bn(PDF_RATE_LIMIT.max)}টি পর্যন্ত PDF।`,
        },
        {
          icon: Database,
          title: 'সবকিছুর JSON ব্যাকআপ',
          body: 'একটি বা সবগুলো CV-র ব্যাকআপ নিন, আর অন্য যেকোনো ব্রাউজার বা কম্পিউটারে ফিরিয়ে আনুন।',
        },
      ],
    },
    {
      id: 'data',
      hue: 'amber',
      title: 'আপনার ডেটা কোথায় থাকে',
      lead: 'আগে আপনার ডিভাইসে। আপনি না চাইলে আমাদের সার্ভার কোনো CV দেখে না।',
      facts: [
        {
          icon: HardDrive,
          title: 'আপনার ব্রাউজারে সেভ করা',
          body: 'CV গুলো আপনার ব্রাউজারের নিজস্ব স্টোরেজে, আপনার ডিভাইসেই থাকে। সাইন-ইন ছাড়া থাকা CV কখনো আপলোড হয় না। ব্রাউজারের ডেটা মুছলে এগুলোও মুছে যেতে পারে, তাই ব্যাকআপ রাখুন।',
        },
        {
          icon: Lock,
          title: 'শুধু PDF তৈরির সময়ই আপলোড হয়',
          body: 'ডাউনলোড করলে CV-টি আঁকার জন্য আমাদের সার্ভারে যায়, আর ফাইল ফেরত দেওয়ার সঙ্গে সঙ্গে মুছে ফেলা হয়। কিছুই রাখা হয় না।',
        },
        {
          icon: Cloud,
          title: `অ্যাকাউন্টে ${bn(CLOUD_SYNC.maxDocuments)}টি পর্যন্ত CV — কোনগুলো তা আপনি ঠিক করেন`,
          body: `একটি CV সিঙ্ক চালু করলে সেটি অন্য ডিভাইসেও পাওয়া যায় (প্রতিটি সর্বোচ্চ ${bn(CLOUD_SYNC.maxBytes / 1024)} KB)। বাকি সব CV শুধু আপনার ডিভাইসেই থাকে, আর আপনি চালু না করলে কিছুই আপলোড হয় না।`,
        },
        {
          icon: Database,
          title: `${bn(CLOUD_SYNC.inactiveMonths)} মাস অব্যবহৃত থাকলে ক্লাউড কপি মুছে যেতে পারে`,
          body: 'কোনো অ্যাকাউন্ট ছয় মাস ব্যবহার না হলে তার সার্ভারের কপিগুলো মুছে ফেলা হতে পারে। এতে আপনার অ্যাকাউন্ট আর নিজের ডিভাইসের CV-র কিছু হয় না, আর যেকোনো সময় আবার সিঙ্ক করা যায়।',
        },
        {
          icon: HardDrive,
          title: 'ঐচ্ছিক ওয়ার্কস্পেস ফোল্ডার',
          body: 'Chrome ও Edge-এ প্রতিটি CV আপনার বেছে নেওয়া একটি ফোল্ডারে সেভ করা যায় — যেমন, যে ফোল্ডারটি আপনার Google Drive বা OneDrive আগে থেকেই সিঙ্ক করে।',
        },
        {
          icon: ShieldCheck,
          title: 'কোনো বিজ্ঞাপন নেই, বিজ্ঞাপনের প্রোফাইলও নেই',
          body: `শুধু বেনামী ভিজিট গণনা। কোনো অ্যাকাউন্ট মুছলে এর ডেটা ${bn(ACCOUNT_DELETION_DAYS)} দিনের মধ্যে সরিয়ে ফেলা হয়।`,
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
          <h1 className="app-gradient-text w-fit text-4xl font-extrabold sm:text-5xl">
            কী কী আছে
          </h1>
          <p className="text-fg-muted text-ui-lg max-w-2xl leading-relaxed">
            নিচের সবকিছুই ফ্রি। এই পেজে লেখা আছে আপনি কী পাচ্ছেন, কতটা পাচ্ছেন, আর আপনার ডেটা কোথায় যায় — যাতে পরে অবাক হওয়ার মতো কিছু না থাকে।
          </p>
          <nav aria-label="এই পেজে" className="flex flex-wrap gap-2 pt-1">
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
                <h2 className="text-fg text-2xl font-extrabold">{group.title}</h2>
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
            <h2 className="text-fg text-xl font-extrabold">শর্তগুলো পড়ে নিন</h2>
            <p className="text-fg-muted text-ui-md">
              সহজ ভাষায় লেখা ডকুমেন্ট; এখানে যা বলা আছে, অ্যাপ সত্যিই তা-ই করে কি না মিলিয়ে দেখা যায়।
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={LEGAL_ROUTES.privacy}
              className="border-border-strong bg-surface text-fg hover:border-primary/40 rounded-control text-ui-md inline-flex h-10 items-center border px-4 font-medium transition"
            >
              গোপনীয়তা নীতি
            </Link>
            <Link
              href={LEGAL_ROUTES.terms}
              className="border-border-strong bg-surface text-fg hover:border-primary/40 rounded-control text-ui-md inline-flex h-10 items-center border px-4 font-medium transition"
            >
              ব্যবহারের শর্তাবলি
            </Link>
            <Link
              href={AUTH_ROUTES.signIn}
              className="border-border-strong bg-surface text-fg hover:border-primary/40 rounded-control text-ui-md inline-flex h-10 items-center border px-4 font-medium transition"
            >
              সাইন-ইন
            </Link>
            <Link
              href={ROUTES.editor}
              className="app-button-primary glint rounded-control text-ui-md inline-flex h-10 items-center px-5 font-medium text-white"
            >
              CV শুরু করুন
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};
