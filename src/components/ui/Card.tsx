'use client';

import { ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface CollapsibleCardProps {
  title: ReactNode;
  /** Right-aligned in the header row; drag handles and row actions go here. */
  actions?: ReactNode;
  subtitle?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

/**
 * The repeatable-entry shell: one card per role, degree, project or referee.
 * Collapsing keeps a ten-entry section navigable.
 */
export const CollapsibleCard = ({
  title,
  subtitle,
  actions,
  open,
  onOpenChange,
  children,
  className,
}: CollapsibleCardProps) => {
  const panelId = useId();

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border-base bg-surface transition',
        open && 'shadow-app',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpenChange(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-surface-2"
        >
          <ChevronDown
            size={16}
            className={cn('flex-none text-fg-subtle transition-transform', !open && '-rotate-90')}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-fg">{title}</span>
            {subtitle ? (
              <span className="block truncate text-[12px] text-fg-subtle">{subtitle}</span>
            ) : null}
          </span>
        </button>

        {actions ? <div className="flex flex-none items-center gap-0.5">{actions}</div> : null}
      </div>

      {open ? (
        <div id={panelId} className="border-t border-border-base px-3.5 py-4">
          {children}
        </div>
      ) : null}
    </div>
  );
};
