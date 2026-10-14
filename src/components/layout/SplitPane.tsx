'use client';

import type { ReactNode } from 'react';

import { useResizablePane } from '@/hooks';
import { cn } from '@/lib/cn';

export interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  /** Share of the width the left pane starts at. */
  fraction?: number;
  min?: number;
  max?: number;
  className?: string;
}

/** Two panes with a draggable divider. Both panes own their own scrolling. */
export const SplitPane = ({
  left,
  right,
  fraction = 0.46,
  min = 320,
  max = 720,
  className,
}: SplitPaneProps) => {
  const { size, dragging, handleProps, containerRef } = useResizablePane({ fraction, min, max });

  return (
    <div ref={containerRef} className={cn('flex min-h-0 w-full', className)}>
      <div style={{ width: size }} className="flex min-h-0 min-w-0 flex-none">
        {left}
      </div>

      <div
        {...handleProps}
        aria-label="এডিটর প্যানের আকার বদলান"
        className={cn(
          'bg-border-base group relative w-0.5 flex-none cursor-col-resize transition',
          'hover:bg-primary focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          dragging && 'bg-primary',
        )}
      >
        {/* Widen the hit area without widening the visible rule. */}
        <span className="absolute inset-y-0 -right-1.5 -left-1.5 block" />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1">{right}</div>
    </div>
  );
};
