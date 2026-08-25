'use client';

import { useCallback, useState } from 'react';

import { ZOOM } from '@/constants';
import { useIsDesktop } from '@/hooks';

export type EditorTab = 'edit' | 'preview' | 'score';

export type ZoomMode = 'fit' | 'manual';

export interface EditorLayout {
  isDesktop: boolean;
  tab: EditorTab;
  setTab: (tab: EditorTab) => void;
  /** Meaningful only in manual mode; in fit mode the pane decides. */
  zoom: number;
  zoomMode: ZoomMode;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  scorePanelOpen: boolean;
  setScorePanelOpen: (open: boolean) => void;
  /**
   * The reader answered the first-run prompt by choosing to fill the form in
   * themselves.
   *
   * Held here rather than in the pane because the pane unmounts every time the
   * phone layout switches tabs, and an answered question should stay answered.
   * It is not resume data either: an empty document is empty whoever opens it.
   */
  startedBlank: boolean;
  startBlank: () => void;
}

const clampZoom = (value: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, value));

/**
 * Layout state for the editor shell: which pane is showing on small screens,
 * how far the preview is zoomed, and whether the score drawer is open.
 * Kept out of the resume store — none of it belongs in a saved document.
 */
export const useEditorLayout = (documentId?: string): EditorLayout => {
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState<EditorTab>('edit');
  const [zoom, setZoomValue] = useState<number>(ZOOM.default);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const [scorePanelOpen, setScorePanelOpen] = useState(true);
  /*
   * Which document the reader answered the prompt for, rather than a boolean
   * reset by an effect. Opening another one makes the comparison false on its
   * own — its emptiness is its own question.
   */
  const [blankStartedFor, setBlankStartedFor] = useState<string | null>(null);

  const setZoom = useCallback((value: number) => {
    setZoomMode('manual');
    setZoomValue(clampZoom(value));
  }, []);

  return {
    isDesktop,
    tab,
    setTab,
    zoom,
    zoomMode,
    setZoom,
    zoomIn: useCallback(() => {
      setZoomMode('manual');
      setZoomValue((current) => clampZoom(current + ZOOM.step));
    }, []),
    zoomOut: useCallback(() => {
      setZoomMode('manual');
      setZoomValue((current) => clampZoom(current - ZOOM.step));
    }, []),
    // Reset means "fit the pane again", not "go back to 75%".
    resetZoom: useCallback(() => setZoomMode('fit'), []),
    scorePanelOpen,
    setScorePanelOpen,
    startedBlank: blankStartedFor !== null && blankStartedFor === (documentId ?? ''),
    startBlank: useCallback(() => setBlankStartedFor(documentId ?? ''), [documentId]),
  };
};
