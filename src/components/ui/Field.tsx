'use client';

import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface FieldProps {
  label: string;
  /** Sits under the control; use for guidance, not for errors. */
  hint?: string;
  error?: string;
  /** Right-aligned in the label row — character counters live here. */
  adornment?: ReactNode;
  required?: boolean;
  className?: string;
  /** Receives the generated id so the label points at the real control. */
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/**
 * Label + hint + error shell. Controls stay unaware of layout, and every field
 * in the editor gets the same accessible wiring.
 */
export const Field = ({
  label,
  hint,
  error,
  adornment,
  required,
  className,
  children,
}: FieldProps) => {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-ui text-fg-muted font-medium">
          {label}
          {required ? <span className="text-danger ml-0.5">*</span> : null}
        </label>
        {adornment ? <span className="text-ui-2xs text-fg-subtle">{adornment}</span> : null}
      </div>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error ? (
        <p id={errorId} className="text-ui-xs text-danger">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-ui-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
};
