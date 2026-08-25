import type { SVGProps } from 'react';

/**
 * Inline SVG contact glyphs.
 *
 * Never an icon font: icon fonts map glyphs into the Unicode Private Use Area,
 * which lands in the PDF text layer as garbage and is exactly the defect this
 * project exists to avoid. `aria-hidden` keeps them out of the accessibility
 * tree, and SVG paths contribute nothing to extracted text. See ADR-003.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = ({ className, ...props }: IconProps) => ({
  viewBox: '0 0 24 24',
  'aria-hidden': true as const,
  focusable: 'false' as const,
  ...props,
  /*
   * Merged, not overwritten. `rz-icon` carries the stroke and fill that make
   * these read as outlines; a caller passing its own sizing class used to drop
   * it and get solid black blobs.
   */
  className: `rz-icon ${className ?? ''}`.trim(),
});

export const PhoneIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

export const MailIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 6 10-6" />
  </svg>
);

export const PinIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const LinkIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);

export const LinkedInIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7.5 10v7M7.5 7.2v.1M11.5 17v-4a2.5 2.5 0 0 1 5 0v4" />
  </svg>
);

export const GithubIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 19c-4.3 1.4-4.3-2.2-6-2.6m12 4.6v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.8 5.8 3.1 5.8 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  </svg>
);

export const GlobeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
  </svg>
);

export const CalendarIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

/* --- Category marks ------------------------------------------------------- */

/**
 * Glyphs for skill groups and achievements. Same rule as the contact icons:
 * inline SVG only, so nothing reaches the extracted text.
 */

export const MonitorIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

export const DatabaseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
  </svg>
);

export const PieIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M21.2 15.9A10 10 0 1 1 8.1 2.8" />
    <path d="M22 12A10 10 0 0 0 12 2v10Z" />
  </svg>
);

export const BrainIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="5" y="7" width="14" height="12" rx="3" />
    <path d="M12 7V4M9 12h.01M15 12h.01M9.5 16h5M2 12h3M19 12h3" />
  </svg>
);

export const WrenchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-2-2-6.5-6.5a4 4 0 0 1 5-5L11 9l3-3Z" />
  </svg>
);

export const CloudIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6.5 19h11Z" />
  </svg>
);

export const PaletteIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 1.6-3.2 2 2 0 0 1 1.6-3.2H18a4 4 0 0 0 4-4 10 10 0 0 0-10-9.6Z" />
    <path d="M7.5 11h.01M11 7.5h.01M15.5 8.5h.01" />
  </svg>
);

export const DiamondIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
    <path d="M2 9h20M12 21 8 9l3-6M12 21l4-12-3-6" />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 2 4 5.5V11c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5.5L12 2Z" />
  </svg>
);

export const BoltIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);

export const TrophyIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4v1a4 4 0 0 0 3 3.9M17 6h3v1a4 4 0 0 1-3 3.9M9 20h6M12 14v6" />
  </svg>
);

export const CrownIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7Z" />
    <path d="M5 20h14" />
  </svg>
);

export const HeartIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z" />
  </svg>
);

export const PlugIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v5" />
  </svg>
);

export const PersonIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const StarIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3Z" />
  </svg>
);

export const TargetIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </svg>
);

export const RocketIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M13 2c4 1 8 5 9 9l-5 5-9-9 5-5Z" />
    <path d="M8 16l-3 3M6 12l-3 1 2 5 5 2 1-3" />
  </svg>
);

export const BookIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z" />
    <path d="M4 17a3 3 0 0 1 3-3h13" />
  </svg>
);

/* --- Entry markers -------------------------------------------------------- */

export const BriefcaseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="2" y="7" width="20" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 12h20" />
  </svg>
);

export const GraduationIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 4 2 9l10 5 10-5-10-5Z" />
    <path d="M6 11.5V17c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5.5" />
  </svg>
);

export const CertificateIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="9" r="6" />
    <path d="m8.5 14.5-1 7 4.5-2.5 4.5 2.5-1-7" />
  </svg>
);

export const FlaskIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 3h6M10 3v6l-5.5 9A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 9V3" />
    <path d="M7.5 15h9" />
  </svg>
);

export const MicIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
  </svg>
);

export const HandshakeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m11 17-2.5-2.5M2 11l4-4 4 2 2-2 2 2 4-2 4 4-4 6-3-2-3 3-3-3-3 2-4-6Z" />
  </svg>
);
