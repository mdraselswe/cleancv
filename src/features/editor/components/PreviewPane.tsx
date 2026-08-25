'use client';

import { Maximize2, Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui';
import type { Resume } from '@/features/resume';
import { ResumePreview, useFitZoom } from '@/features/preview';
import type { ZoomMode } from '../hooks/useEditorLayout';

export interface PreviewPaneProps {
  resume: Resume;
  zoom: number;
  zoomMode: ZoomMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPageCountChange?: (pageCount: number) => void;
  onPageBreaksChange?: (anchors: number[]) => void;
}

/**
 * The preview column.
 *
 * In `fit` mode the sheet is scaled to the pane, which is what keeps a phone
 * from showing two-thirds of a page with the rest scrolled off. Touching either
 * zoom control switches to manual and leaves the scale alone.
 */
export const PreviewPane = ({
  resume,
  zoom,
  zoomMode,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPageCountChange,
  onPageBreaksChange,
}: PreviewPaneProps) => {
  const { containerRef, fitZoom } = useFitZoom();
  const effectiveZoom = zoomMode === 'fit' ? fitZoom : zoom;

  return (
    <div ref={containerRef} className="relative min-h-full bg-surface-2 px-4 py-6 sm:px-8">
      <ResumePreview
        resume={resume}
        zoom={effectiveZoom}
        onPageCountChange={onPageCountChange}
        onPageBreaksChange={onPageBreaksChange}
      />

      <div className="sticky bottom-4 mt-6 flex justify-center">
        <div className="inline-flex items-center gap-0.5 rounded-full border border-border-base bg-surface p-1 shadow-app">
          <Button size="icon" variant="ghost" onClick={onZoomOut} aria-label="Zoom out">
            <Minus size={15} />
          </Button>
          <span className="min-w-12 text-center text-[12px] tabular-nums text-fg-muted">
            {Math.round(effectiveZoom * 100)}%
          </span>
          <Button size="icon" variant="ghost" onClick={onZoomIn} aria-label="Zoom in">
            <Plus size={15} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onResetZoom}
            aria-label="Fit to width"
            title="Fit to width"
          >
            <Maximize2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};
