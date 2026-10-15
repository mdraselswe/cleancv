'use client';

import { FileUp, Gauge, Layers, Lock, Plus, Sparkles, Wand2 } from 'lucide-react';

import { HeroIllustration } from '@/components/illustrations';
import { Button } from '@/components/ui';
import { Lang } from '@/i18n';

export interface HeroSectionProps {
  onCreate: () => void;
  onSample: () => void;
  onImport: () => void;
  disabled?: boolean;
}

const PERKS = [
  { icon: Gauge, label: 'লাইভ ATS স্কোর', hue: 'emerald' },
  { icon: Layers, label: 'ডিজাইন করা + ATS-সেফ PDF', hue: 'violet' },
  { icon: Lock, label: 'ব্রাউজারেই সেভ করা', hue: 'amber' },
] as const;

/** The first screen: what this is, the three ways in, and a picture of the result. */
export const HeroSection = ({ onCreate, onSample, onImport, disabled }: HeroSectionProps) => (
  <section className="relative isolate overflow-hidden">
    {/* Backdrop: two soft blobs and a dotted field that fades out downwards. */}
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="bg-hue-indigo/20 animate-drift absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl" />
      <div className="bg-hue-pink/20 animate-drift absolute -right-16 top-10 h-72 w-72 rounded-full blur-3xl [animation-delay:-5s]" />
      <div className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
    </div>

    <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pt-10 pb-12 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pt-16 md:pb-20">
      <div className="stagger flex flex-col items-start gap-5">
        <span className="border-primary/20 bg-primary-soft text-primary text-ui-xs inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold">
          <Sparkles size={13} className="animate-wiggle" />
          ফ্রি CV স্টুডিও
        </span>

        <h1 className="text-fg text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl">
          <Lang
            bn={
              <>
                এমন একটি CV বানান, যা <span className="app-gradient-text animate-gradient">মানুষ</span>{' '}
                আর <span className="app-gradient-text animate-gradient">ATS</span> দুজনেই পড়তে পারে।
              </>
            }
            en={
              <>
                Build a CV that <span className="app-gradient-text animate-gradient">people</span> and{' '}
                <span className="app-gradient-text animate-gradient">parsers</span> both read.
              </>
            }
          />
        </h1>

        <p className="text-fg-muted text-ui-lg max-w-xl leading-relaxed">
          সহজ একটি ফর্ম পূরণ করুন, পাশেই পেজ তৈরি হতে দেখুন, আর লিখতে লিখতেই ATS স্কোর যাচাই
          করুন। মানুষের জন্য ডিজাইন করা PDF আর জব পোর্টালের জন্য সাদামাটা PDF, দুটোই এক্সপোর্ট
          করা যায়।
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="lg"
            onClick={onCreate}
            disabled={disabled}
            leading={<Plus size={18} />}
          >
            নতুন CV বানান
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onImport}
            disabled={disabled}
            leading={<FileUp size={17} />}
          >
            CV ইমপোর্ট করুন
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={onSample}
            disabled={disabled}
            leading={<Wand2 size={17} />}
          >
            একটি উদাহরণ CV দেখুন
          </Button>
        </div>

        <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
          {PERKS.map(({ icon: Icon, label, hue }) => (
            <li key={label} className="text-fg-muted text-ui flex items-center gap-2">
              <span
                className={`hue-${hue} bg-hue-soft text-hue-strong flex h-6 w-6 items-center justify-center rounded-full`}
              >
                <Icon size={13} />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="animate-rise mx-auto w-full max-w-[520px] [animation-delay:150ms]">
        <HeroIllustration />
      </div>
    </div>
  </section>
);
