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
  onBodyPointsChange?: (points: number) => void;
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
  onBodyPointsChange,
}: PreviewPaneProps) => {
  const { containerRef, fitZoom } = useFitZoom();
  const effectiveZoom = zoomMode === 'fit' ? fitZoom : zoom;

  return (
    <div ref={containerRef} className="app-preview-canvas relative min-h-full px-4 py-6 sm:px-8">
      <ResumePreview
        resume={resume}
        zoom={effectiveZoom}
        onPageCountChange={onPageCountChange}
        onPageBreaksChange={onPageBreaksChange}
        onBodyPointsChange={onBodyPointsChange}
      />

      {/*
        The controls ride the foot of the pane rather than the foot of the
        document: a three-page CV would otherwise put them three pages down
        from the reader who wants to zoom out to see it. The row itself takes
        no pointer events, so the page behind the pill stays scrollable.
      */}
      <div className="pointer-events-none sticky bottom-3 z-10 mt-6 flex justify-center">
        <div className="border-primary/15 bg-surface/90 shadow-pop pointer-events-auto inline-flex items-center gap-0.5 rounded-full border p-1 backdrop-blur-xl">
          <Button size="icon" variant="ghost" onClick={onZoomOut} aria-label="Zoom out">
            <Minus size={15} />
          </Button>
          <span className="text-fg-muted text-ui-xs min-w-12 text-center tabular-nums">
            {Math.round(effectiveZoom * 100)}%
          </span>
          <Button size="icon" variant="ghost" onClick={onZoomIn} aria-label="Zoom in">
            <Plus size={15} />
          </Button>
          <span aria-hidden="true" className="bg-border-base mx-0.5 h-5 w-px" />
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
