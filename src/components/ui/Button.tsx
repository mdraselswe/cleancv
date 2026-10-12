'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'app-button-primary glint bg-primary text-primary-fg hover:brightness-105 active:translate-y-0 active:scale-[0.98] active:brightness-95',
  secondary: 'border border-transparent bg-surface-2 text-fg hover:border-primary/20 hover:bg-primary-soft',
  ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-danger text-white hover:brightness-110',
  outline: 'border border-border-strong bg-surface/80 text-fg shadow-sm hover:border-primary/40 hover:bg-primary-soft',
};

/*
 * Heights step by 4px and every one of them is even, so a row of mixed sizes
 * centres on the same line. `icon` is square at the `sm` height; the thumb-sized
 * hit area comes from `tap-target`, which grows outwards and moves nothing.
 */
const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-ui',
  md: 'h-9 gap-2 px-3.5 text-ui-md',
  lg: 'h-11 gap-2 px-5 text-ui-lg',
  icon: 'h-9 w-9 justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Rendered before the label; keep it to a 16px icon. */
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', leading, trailing, className, children, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(
        'tap-target rounded-control inline-flex items-center font-medium transition select-none active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
});
