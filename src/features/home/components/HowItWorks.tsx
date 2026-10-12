import { Download, Gauge, PencilLine } from 'lucide-react';

const STEPS = [
  {
    icon: PencilLine,
    hue: 'indigo',
    title: 'Fill in the story',
    body: 'One section at a time. Add roles, schooling and skills; the page builds itself beside you.',
  },
  {
    icon: Gauge,
    hue: 'emerald',
    title: 'Watch the score',
    body: 'A live ATS score names what a parser would trip on and takes you straight to the fix.',
  },
  {
    icon: Download,
    hue: 'pink',
    title: 'Download two PDFs',
    body: 'A designed one for people, a plain single-column one for job portals.',
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
          {index + 1}
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
