import { cn } from '@/lib/cn';

import type { IllustrationProps } from './HeroIllustration';

/** A small trophy for a score with nothing left to fix. */
export const TrophyIllustration = ({ className }: IllustrationProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 120 110"
    fill="none"
    className={cn('h-auto w-full', className)}
  >
    <circle cx="60" cy="54" r="44" fill="var(--hue-amber)" fillOpacity="0.16" />
    <g className="animate-float">
      <path d="M40 24h40v22c0 12-9 22-20 22S40 58 40 46Z" fill="var(--hue-amber)" />
      <path
        d="M40 30H28v8c0 8 6 14 14 14M80 30h12v8c0 8-6 14-14 14"
        stroke="var(--hue-amber)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="54" y="68" width="12" height="14" rx="2" fill="var(--hue-amber)" fillOpacity="0.7" />
      <rect x="42" y="82" width="36" height="9" rx="4.5" fill="var(--hue-amber)" />
      <path
        d="m52 42 6 6 11-13"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <path className="animate-float-slow" d="M96 18l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="var(--hue-pink)" />
    <path className="animate-float" d="M20 28l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="var(--hue-violet)" />
  </svg>
);
