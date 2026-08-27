'use client';

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '@/lib/cn';

const CONTROL_BASE =
  'w-full rounded-control border bg-surface px-3 text-ui-md text-fg transition placeholder:text-fg-subtle ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  invalid?: boolean;
  /** Inline leading affordance, e.g. a small icon or a `+880` prefix. */
  leadingAddon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leadingAddon, className, ...rest },
  ref,
) {
  const control = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        'h-9',
        invalid ? 'border-danger' : 'border-border-base',
        leadingAddon ? 'rounded-l-none border-l-0 pl-0' : null,
        className,
      )}
      {...rest}
    />
  );

  if (!leadingAddon) return control;

  return (
    <div className="flex">
      <span
        className={cn(
          'rounded-l-control bg-surface-2 text-ui-md text-fg-subtle inline-flex h-9 items-center border border-r-0 px-2.5',
          invalid ? 'border-danger' : 'border-border-base',
        )}
      >
        {leadingAddon}
      </span>
      {control}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        'resize-y py-2 leading-relaxed',
        invalid ? 'border-danger' : 'border-border-base',
        className,
      )}
      {...rest}
    />
  );
});
