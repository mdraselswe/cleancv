'use client';

import { cn } from '@/lib/cn';

export interface MonthInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  describedBy?: string;
  invalid?: boolean;
  className?: string;
}

/**
 * A native month picker. Dates are stored as `YYYY-MM` precisely so this control
 * needs no parsing — inconsistent date formats are an ATS formatting failure,
 * and free-text entry is where they come from.
 */
export const MonthInput = ({
  value,
  onChange,
  id,
  disabled,
  describedBy,
  invalid,
  className,
}: MonthInputProps) => (
  <input
    id={id}
    type="month"
    value={value}
    disabled={disabled}
    aria-describedby={describedBy}
    aria-invalid={invalid || undefined}
    onChange={(event) => onChange(event.target.value)}
    className={cn(
      'h-9 w-full rounded-lg border bg-surface px-3 text-sm text-fg transition',
      'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50',
      invalid ? 'border-danger' : 'border-border-base',
      className,
    )}
  />
);
