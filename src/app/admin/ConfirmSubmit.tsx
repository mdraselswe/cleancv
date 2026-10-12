'use client';

import type { ReactNode } from 'react';

export interface ConfirmSubmitProps {
  message: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/** A submit button that asks first. The action it submits is destructive and cannot be undone. */
export const ConfirmSubmit = ({ message, children, className, disabled }: ConfirmSubmitProps) => (
  <button
    type="submit"
    disabled={disabled}
    className={className}
    onClick={(event) => {
      if (!window.confirm(message)) event.preventDefault();
    }}
  >
    {children}
  </button>
);
