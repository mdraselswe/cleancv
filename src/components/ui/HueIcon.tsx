import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type Hue = 'indigo' | 'violet' | 'pink' | 'rose' | 'amber' | 'emerald' | 'teal' | 'sky';

export interface HueIconProps {
  hue: Hue;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** A solid tile rather than a tinted one. */
  solid?: boolean;
  className?: string;
}

const SIZE_CLASS = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-9 w-9 rounded-control',
  lg: 'h-12 w-12 rounded-card',
} as const;

/** A glyph on a tile in one of the app's hue families. */
export const HueIcon = ({ hue, children, size = 'md', solid, className }: HueIconProps) => (
  <span
    aria-hidden="true"
    className={cn(
      `hue-${hue} inline-flex flex-none items-center justify-center`,
      solid ? 'bg-hue text-white shadow-sm' : 'bg-hue-soft text-hue-strong',
      SIZE_CLASS[size],
      className,
    )}
  >
    {children}
  </span>
);
