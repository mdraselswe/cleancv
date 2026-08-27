'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-fg-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/12 text-warning',
  danger: 'bg-danger/12 text-danger',
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export const Badge = ({ tone = 'neutral', children, className }: BadgeProps) => (
  <span
    className={cn(
      'text-ui-2xs inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
      BADGE_TONE[tone],
      className,
    )}
  >
    {children}
  </span>
);

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      'border-border-base bg-surface-2/50 rounded-card flex flex-col items-center gap-2 border border-dashed px-6 py-10 text-center',
      className,
    )}
  >
    {icon ? (
      <div className="bg-surface text-fg-subtle border-border-base mb-1 flex h-11 w-11 items-center justify-center rounded-full border">
        {icon}
      </div>
    ) : null}
    <p className="text-fg text-ui-md font-medium">{title}</p>
    {description ? (
      <p className="text-fg-subtle text-ui max-w-sm leading-relaxed">{description}</p>
    ) : null}
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
);

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  id?: string;
  label: string;
  /** Right-aligned readout, e.g. `1.05x` or `14 mm`. */
  display: string;
}

export const Slider = ({ value, onChange, min, max, step, id, label, display }: SliderProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between">
      <label htmlFor={id} className="text-ui text-fg-muted font-medium">
        {label}
      </label>
      <span className="text-ui-xs text-fg-subtle tabular-nums">{display}</span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="bg-border-base h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[var(--app-primary)]"
    />
  </div>
);

export interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

export const SectionLabel = ({ children, className }: SectionLabelProps) => (
  <p
    className={cn(
      'text-ui-2xs text-fg-subtle font-semibold tracking-[0.08em] uppercase',
      className,
    )}
  >
    {children}
  </p>
);
