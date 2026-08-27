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
      'rounded-control bg-surface text-ui-md text-fg h-9 w-full border px-3 transition',
      'focus:ring-ring focus:ring-2 focus:outline-none disabled:opacity-50',
      invalid ? 'border-danger' : 'border-border-base',
      className,
    )}
  />
);
