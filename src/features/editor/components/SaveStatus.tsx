'use client';

import { Check, CloudOff, Loader2 } from 'lucide-react';

import type { SaveState } from '@/features/library';
import { cn } from '@/lib/cn';

export interface SaveStatusProps {
  state: SaveState;
  className?: string;
}

/**
 * What the autosave is doing, in one line.
 *
 * An app that saves silently is indistinguishable from one that does not save
 * at all, and this one keeps everything in the browser — the reader has no
 * server to fall back on and no reason to assume it worked. Saying so costs a
 * dozen pixels.
 *
 * `idle` renders nothing: before the first edit there is nothing to report,
 * and a permanent "Saved" that predates any change is a claim about a write
 * that never happened.
 */
export const SaveStatus = ({ state, className }: SaveStatusProps) => {
  if (state === 'idle') return null;

  const failed = state === 'failed';
  const busy = state === 'pending' || state === 'saving';

  return (
    <span
      role="status"
      className={cn(
        'text-ui-xs inline-flex items-center gap-1.5 whitespace-nowrap',
        failed ? 'text-danger' : 'text-fg-subtle',
        className,
      )}
    >
      {failed ? (
        <CloudOff size={13} className="flex-none" aria-hidden="true" />
      ) : busy ? (
        <Loader2 size={13} className="flex-none animate-spin" aria-hidden="true" />
      ) : (
        <Check size={13} className="text-success flex-none" aria-hidden="true" />
      )}
      {failed ? 'সংরক্ষণ হয়নি' : busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষিত'}
    </span>
  );
};
