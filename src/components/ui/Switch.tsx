'use client';

import { cn } from '@/lib/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hides the visible label but keeps it for screen readers. */
  hideLabel?: boolean;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch = ({
  checked,
  onChange,
  label,
  hideLabel,
  description,
  disabled,
  className,
}: SwitchProps) => (
  <label
    className={cn(
      'flex items-center gap-3',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      className,
    )}
  >
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 flex-none rounded-full transition',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        checked ? 'bg-primary' : 'bg-border-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
          checked ? 'left-[1.125rem]' : 'left-0.5',
        )}
      />
    </button>

    {!hideLabel ? (
      <span className="min-w-0">
        <span className="text-ui-md text-fg block">{label}</span>
        {description ? (
          <span className="text-ui-xs text-fg-subtle block leading-snug">{description}</span>
        ) : null}
      </span>
    ) : null}
  </label>
);
