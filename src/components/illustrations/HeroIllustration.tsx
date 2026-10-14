import { cn } from '@/lib/cn';

export interface IllustrationProps {
  className?: string;
}

/**
 * The home page's scene: a CV taking shape, with the things that make it good
 * — a score, a few skills, a handful of sparkles — floating around it.
 *
 * Drawn from the app's own hue variables so it follows the theme, and from
 * plain SVG so it costs nothing to load. Decoration only: hidden from
 * assistive technology.
 */
export const HeroIllustration = ({ className }: IllustrationProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 480 400"
    fill="none"
    className={cn('h-auto w-full', className)}
  >
    <defs>
      <linearGradient id="hero-blob" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--hue-indigo)" stopOpacity="0.28" />
        <stop offset="0.55" stopColor="var(--hue-violet)" stopOpacity="0.2" />
        <stop offset="1" stopColor="var(--hue-pink)" stopOpacity="0.26" />
      </linearGradient>
      <linearGradient id="hero-avatar" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--hue-violet)" />
        <stop offset="1" stopColor="var(--hue-pink)" />
      </linearGradient>
      <linearGradient id="hero-head" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="var(--hue-indigo)" />
        <stop offset="1" stopColor="var(--hue-violet)" />
      </linearGradient>
    </defs>

    <path
      d="M64 188c-10-70 44-138 128-150 78-12 118 28 186 34 64 6 94 52 84 118-10 66-60 114-142 132-84 18-150 4-196-40-30-28-52-56-60-94Z"
      fill="url(#hero-blob)"
    />

    {/* Back page, tilted */}
    <g className="animate-float-slow">
      <rect
        x="112"
        y="66"
        width="214"
        height="276"
        rx="14"
        transform="rotate(-7 219 204)"
        fill="var(--app-surface)"
        stroke="var(--app-border-strong)"
        strokeWidth="1.5"
      />
      <g transform="rotate(-7 219 204)" opacity="0.55">
        <rect x="134" y="92" width="88" height="8" rx="4" fill="var(--hue-sky)" />
        <rect x="134" y="112" width="150" height="6" rx="3" fill="var(--app-border-strong)" />
        <rect x="134" y="126" width="128" height="6" rx="3" fill="var(--app-border-strong)" />
      </g>
    </g>

    {/* Front page */}
    <g className="animate-float">
      <rect
        x="150"
        y="54"
        width="222"
        height="290"
        rx="16"
        fill="var(--app-surface)"
        stroke="var(--app-border-strong)"
        strokeWidth="1.5"
      />
      <rect x="150" y="54" width="222" height="62" rx="16" fill="url(#hero-head)" />
      <rect x="150" y="96" width="222" height="20" fill="url(#hero-head)" />
      <circle cx="190" cy="85" r="19" fill="url(#hero-avatar)" stroke="#fff" strokeWidth="3" />
      <circle cx="190" cy="80" r="6.5" fill="#fff" fillOpacity="0.92" />
      <path
        d="M177 98c2-8 8-11 13-11s11 3 13 11"
        stroke="#fff"
        strokeOpacity="0.92"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="220" y="73" width="94" height="9" rx="4.5" fill="#fff" />
      <rect x="220" y="90" width="64" height="6" rx="3" fill="#fff" fillOpacity="0.7" />

      <rect x="170" y="136" width="62" height="7" rx="3.5" fill="var(--hue-indigo)" />
      <rect x="170" y="152" width="170" height="5" rx="2.5" fill="var(--app-border-strong)" />
      <rect x="170" y="164" width="150" height="5" rx="2.5" fill="var(--app-border-strong)" />
      <rect x="170" y="176" width="160" height="5" rx="2.5" fill="var(--app-border-strong)" />

      <rect x="170" y="200" width="78" height="7" rx="3.5" fill="var(--hue-pink)" />
      <circle cx="175" cy="221" r="2.5" fill="var(--hue-pink)" />
      <rect x="184" y="218" width="140" height="5" rx="2.5" fill="var(--app-border-strong)" />
      <circle cx="175" cy="235" r="2.5" fill="var(--hue-pink)" />
      <rect x="184" y="232" width="118" height="5" rx="2.5" fill="var(--app-border-strong)" />
      <circle cx="175" cy="249" r="2.5" fill="var(--hue-pink)" />
      <rect x="184" y="246" width="132" height="5" rx="2.5" fill="var(--app-border-strong)" />

      <rect x="170" y="274" width="54" height="7" rx="3.5" fill="var(--hue-emerald)" />
      <rect x="170" y="292" width="48" height="16" rx="8" fill="var(--hue-emerald)" fillOpacity="0.16" />
      <rect x="226" y="292" width="58" height="16" rx="8" fill="var(--hue-amber)" fillOpacity="0.2" />
      <rect x="292" y="292" width="44" height="16" rx="8" fill="var(--hue-sky)" fillOpacity="0.2" />
    </g>

    {/* Score badge */}
    <g className="animate-float" style={{ animationDelay: '-2s' }}>
      <rect
        x="326"
        y="34"
        width="112"
        height="46"
        rx="23"
        fill="var(--app-surface)"
        stroke="var(--app-border-strong)"
        strokeWidth="1.5"
      />
      <circle cx="350" cy="57" r="14" fill="var(--hue-emerald)" />
      <path
        d="m343.5 57 4.5 4.5 8-9"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="372" y="53" fontSize="9" fontWeight="600" fill="var(--app-fg-subtle)" fontFamily="inherit">
        ATS স্কোর
      </text>
      <text x="372" y="69" fontSize="15" fontWeight="800" fill="var(--app-fg)" fontFamily="inherit">
        ৯৪ / ১০০
      </text>
    </g>

    {/* Skill chips */}
    <g className="animate-drift" style={{ animationDelay: '-4s' }}>
      <rect
        x="60"
        y="262"
        width="92"
        height="34"
        rx="17"
        fill="var(--app-surface)"
        stroke="var(--app-border-strong)"
        strokeWidth="1.5"
      />
      <circle cx="80" cy="279" r="7" fill="var(--hue-amber)" />
      <rect x="94" y="274" width="46" height="10" rx="5" fill="var(--app-border-strong)" />
    </g>
    <g className="animate-drift" style={{ animationDelay: '-7s' }}>
      <rect
        x="352"
        y="238"
        width="86"
        height="34"
        rx="17"
        fill="var(--app-surface)"
        stroke="var(--app-border-strong)"
        strokeWidth="1.5"
      />
      <circle cx="372" cy="255" r="7" fill="var(--hue-sky)" />
      <rect x="386" y="250" width="40" height="10" rx="5" fill="var(--app-border-strong)" />
    </g>

    {/* Sparkles */}
    <path
      className="animate-float"
      d="M92 112l4 11 11 4-11 4-4 11-4-11-11-4 11-4Z"
      fill="var(--hue-amber)"
    />
    <path
      className="animate-float-slow"
      d="M424 160l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"
      fill="var(--hue-pink)"
    />
    <path
      className="animate-float"
      style={{ animationDelay: '-3s' }}
      d="M118 330l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"
      fill="var(--hue-violet)"
    />
  </svg>
);
