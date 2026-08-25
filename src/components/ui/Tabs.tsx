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
        ? 'inline-flex gap-0.5 rounded-lg bg-surface-2 p-0.5'
        : 'grid w-full grid-flow-col border-t border-border-base bg-surface',
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
            'inline-flex items-center justify-center gap-1.5 font-medium transition',
            variant === 'segmented'
              ? cn(
                  'h-7 rounded-md px-3 text-[13px]',
                  active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
                )
              : cn(
                  'flex-col gap-0.5 py-2.5 text-[11px]',
                  active ? 'text-primary' : 'text-fg-subtle',
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
