import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import type { IllustrationProps } from './HeroIllustration';

export type SectionScene = 'profile' | 'work' | 'learn' | 'skills' | 'story' | 'design' | 'sections';

export interface SectionIllustrationProps extends IllustrationProps {
  scene: SectionScene;
}

const SceneFrame = ({ children }: { children: ReactNode }) => (
  <>
    <circle cx="60" cy="52" r="40" fill="var(--hue)" fillOpacity="0.14" />
    <circle cx="96" cy="26" r="5" fill="var(--hue)" fillOpacity="0.5" className="animate-float" />
    <circle
      cx="20"
      cy="72"
      r="3.5"
      fill="var(--hue)"
      fillOpacity="0.4"
      className="animate-float-slow"
    />
    {children}
  </>
);

/**
 * A small spot illustration for a form's header, one scene per kind of
 * content. Drawn in the hue of whoever places it (`hue-*` class on an
 * ancestor), so the section's colour reaches its picture without a prop.
 */
export const SectionIllustration = ({ scene, className }: SectionIllustrationProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 120 104"
    fill="none"
    className={cn('h-auto w-full', className)}
  >
    <SceneFrame>
      {scene === 'profile' ? (
        <g className="animate-float">
          <rect
            x="28"
            y="20"
            width="64"
            height="70"
            rx="10"
            fill="var(--app-surface)"
            stroke="var(--hue)"
            strokeWidth="2"
          />
          <circle cx="60" cy="46" r="13" fill="var(--hue)" />
          <path d="M40 80c3-12 11-17 20-17s17 5 20 17Z" fill="var(--hue)" fillOpacity="0.3" />
        </g>
      ) : null}

      {scene === 'work' ? (
        <g className="animate-float">
          <rect
            x="24"
            y="36"
            width="72"
            height="50"
            rx="9"
            fill="var(--app-surface)"
            stroke="var(--hue)"
            strokeWidth="2"
          />
          <path d="M46 36v-6a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v6" stroke="var(--hue)" strokeWidth="2" />
          <path d="M24 58h72" stroke="var(--hue)" strokeWidth="2" />
          <rect x="52" y="53" width="16" height="12" rx="3" fill="var(--hue)" />
        </g>
      ) : null}

      {scene === 'learn' ? (
        <g className="animate-float">
          <path d="m60 24 40 18-40 18-40-18Z" fill="var(--hue)" />
          <path
            d="M38 52v16c0 6 10 12 22 12s22-6 22-12V52"
            stroke="var(--hue)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="var(--hue)"
            fillOpacity="0.2"
          />
          <path d="M100 42v22" stroke="var(--hue)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="100" cy="68" r="4" fill="var(--hue)" />
        </g>
      ) : null}

      {scene === 'skills' ? (
        <g className="animate-float">
          <rect x="22" y="32" width="46" height="22" rx="11" fill="var(--hue)" />
          <rect
            x="52"
            y="58"
            width="48"
            height="22"
            rx="11"
            fill="var(--app-surface)"
            stroke="var(--hue)"
            strokeWidth="2"
          />
          <rect x="26" y="62" width="20" height="14" rx="7" fill="var(--hue)" fillOpacity="0.3" />
          <path d="m88 26 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="var(--hue)" />
        </g>
      ) : null}

      {scene === 'story' ? (
        <g className="animate-float">
          <path
            d="M26 30a8 8 0 0 1 8-8h52a8 8 0 0 1 8 8v36a8 8 0 0 1-8 8H56l-16 14V74h-6a8 8 0 0 1-8-8Z"
            fill="var(--app-surface)"
            stroke="var(--hue)"
            strokeWidth="2"
          />
          <rect x="38" y="36" width="44" height="5" rx="2.5" fill="var(--hue)" />
          <rect x="38" y="48" width="36" height="5" rx="2.5" fill="var(--hue)" fillOpacity="0.5" />
          <rect x="38" y="60" width="28" height="5" rx="2.5" fill="var(--hue)" fillOpacity="0.3" />
        </g>
      ) : null}

      {scene === 'design' ? (
        <g className="animate-float">
          <path
            d="M60 22c20 0 36 14 36 30 0 10-8 12-16 12h-8c-5 0-6 5-4 8 3 5 0 12-8 12-18 0-36-14-36-32S38 22 60 22Z"
            fill="var(--app-surface)"
            stroke="var(--hue)"
            strokeWidth="2"
          />
          <circle cx="44" cy="46" r="6" fill="var(--hue-pink)" />
          <circle cx="62" cy="36" r="6" fill="var(--hue-amber)" />
          <circle cx="80" cy="48" r="6" fill="var(--hue-emerald)" />
          <circle cx="50" cy="66" r="6" fill="var(--hue-sky)" />
        </g>
      ) : null}

      {scene === 'sections' ? (
        <g className="animate-float">
          <rect x="26" y="24" width="68" height="16" rx="6" fill="var(--hue)" />
          <rect
            x="34"
            y="46"
            width="68"
            height="16"
            rx="6"
            fill="var(--app-surface)"
            stroke="var(--hue)"
            strokeWidth="2"
          />
          <rect x="26" y="68" width="68" height="16" rx="6" fill="var(--hue)" fillOpacity="0.3" />
          <circle cx="36" cy="32" r="3" fill="#fff" />
        </g>
      ) : null}
    </SceneFrame>
  </svg>
);
