import { Download, Gauge, PencilLine } from 'lucide-react';

import { bn } from '@/lib/bn';

const STEPS = [
  {
    icon: PencilLine,
    hue: 'indigo',
    title: 'আপনার গল্প লিখুন',
    body: 'একটি একটি করে সেকশন পূরণ করুন। পদ, পড়াশোনা আর দক্ষতা যোগ করুন; পাশেই পেজ নিজে থেকে তৈরি হবে।',
  },
  {
    icon: Gauge,
    hue: 'emerald',
    title: 'স্কোরের দিকে নজর রাখুন',
    body: 'লাইভ ATS স্কোর বলে দেয় ATS সফটওয়্যার কোথায় আটকাবে, আর যেখানে ঠিক করতে হবে ঠিক সেখানে আপনাকে নিয়ে যায়।',
  },
  {
    icon: Download,
    hue: 'pink',
    title: 'দুটি PDF ডাউনলোড করুন',
    body: 'মানুষের জন্য ডিজাইন করা একটি, আর জব পোর্টালের জন্য সাদামাটা এক-কলামের একটি।',
  },
] as const;

/** Three steps, numbered, each with its own hue. */
export const HowItWorks = () => (
  <ol className="stagger grid gap-4 md:grid-cols-3">
    {STEPS.map(({ icon: Icon, hue, title, body }, index) => (
      <li
        key={title}
        className={`hue-${hue} card-lift border-border-base bg-surface rounded-panel relative overflow-hidden border p-5`}
      >
        <span
          aria-hidden="true"
          className="text-hue/10 absolute -top-3 right-3 text-[84px] leading-none font-black"
        >
          {bn(index + 1)}
        </span>
        <span className="bg-hue text-white mb-4 flex h-11 w-11 items-center justify-center rounded-card shadow-sm">
          <Icon size={20} />
        </span>
        <h3 className="text-fg text-ui-lg font-bold">{title}</h3>
        <p className="text-fg-muted text-ui mt-1.5 leading-relaxed">{body}</p>
      </li>
    ))}
  </ol>
);
