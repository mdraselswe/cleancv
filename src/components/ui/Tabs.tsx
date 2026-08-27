'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Small count or status pill after the label. */
  badge?: ReactNode;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `segmented` for a compact control, `bar` for the mobile bottom bar. */
  variant?: 'segmented' | 'bar';
  className?: string;
  ariaLabel: string;
}

export const Tabs = <T extends string>({
  items,
  value,
  onChange,
  variant = 'segmented',
  className,
  ariaLabel,
}: TabsProps<T>) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className={cn(
      variant === 'segmented'
        ? 'bg-surface-2 rounded-control inline-flex gap-0.5 p-0.5'
        : 'border-border-base bg-surface grid w-full grid-flow-col border-t',
      className,
    )}
  >
    {items.map((item) => {
      const active = item.value === value;

      return (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.value)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 font-medium transition select-none',
            variant === 'segmented'
              ? cn(
                  'text-ui h-7 rounded-lg px-3',
                  active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
                )
              : cn(
                  // A thumb-sized row, and the label under the glyph rather
                  // than beside it so three of them fit a 320px phone.
                  'text-ui-2xs min-h-12 flex-col gap-1 py-2',
                  active ? 'text-primary' : 'text-fg-subtle hover:text-fg-muted',
                ),
          )}
        >
          {item.icon}
          {item.label}
          {item.badge}
        </button>
      );
    })}
  </div>
);
