import { cn } from '@/lib/cn';

import type { IllustrationProps } from './HeroIllustration';

/** A blank page waiting for a first line — used wherever a list has nothing in it yet. */
export const EmptyIllustration = ({ className }: IllustrationProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 240 180"
    fill="none"
    className={cn('h-auto w-full', className)}
  >
    <ellipse cx="120" cy="160" rx="78" ry="9" fill="var(--hue-indigo)" fillOpacity="0.14" />
    <circle cx="120" cy="84" r="66" fill="var(--hue-violet)" fillOpacity="0.1" />

    <g className="animate-float">
      <rect
        x="72"
        y="26"
        width="96"
        height="122"
        rx="10"
        fill="var(--app-surface)"
        stroke="var(--app-border-strong)"
        strokeWidth="1.5"
      />
      <rect x="86" y="44" width="40" height="7" rx="3.5" fill="var(--hue-indigo)" />
      <rect x="86" y="62" width="68" height="5" rx="2.5" fill="var(--app-border-strong)" />
      <rect x="86" y="74" width="58" height="5" rx="2.5" fill="var(--app-border-strong)" />
      <rect x="86" y="86" width="64" height="5" rx="2.5" fill="var(--app-border-strong)" />
      <rect x="86" y="108" width="30" height="7" rx="3.5" fill="var(--hue-pink)" />
      <rect x="86" y="124" width="52" height="5" rx="2.5" fill="var(--app-border-strong)" />
    </g>

    <g className="animate-float-slow" style={{ animationDelay: '-2s' }}>
      <circle cx="176" cy="46" r="18" fill="var(--hue-pink)" />
      <path d="M176 38v16M168 46h16" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </g>

    <path className="animate-float" d="M50 62l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="var(--hue-amber)" />
  </svg>
);
