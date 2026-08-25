'use client';

import type { ReactNode } from 'react';

import { useResizablePane } from '@/hooks';
import { cn } from '@/lib/cn';

export interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  initial?: number;
  min?: number;
  max?: number;
  className?: string;
}

/** Two panes with a draggable divider. Both panes own their own scrolling. */
export const SplitPane = ({
  left,
  right,
  initial = 520,
  min = 380,
  max = 760,
  className,
}: SplitPaneProps) => {
  const { size, dragging, handleProps, containerRef } = useResizablePane({ initial, min, max });

  return (
    <div ref={containerRef} className={cn('flex min-h-0 w-full', className)}>
      <div style={{ width: size }} className="flex min-h-0 min-w-0 flex-none">
        {left}
      </div>

      <div
        {...handleProps}
        aria-label="Resize editor pane"
        className={cn(
          'group relative w-px flex-none cursor-col-resize bg-border-base transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          dragging && 'bg-primary',
        )}
      >
        {/* Widen the hit area without widening the visible rule. */}
        <span className="absolute inset-y-0 -left-1.5 -right-1.5 block" />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1">{right}</div>
    </div>
  );
};
