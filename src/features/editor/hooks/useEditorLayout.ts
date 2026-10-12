'use client';

import { useCallback, useState } from 'react';

import { ZOOM } from '@/constants';
import { useIsDesktop, useIsSplit } from '@/hooks';

export type EditorTab = 'edit' | 'preview' | 'score';

export type ZoomMode = 'fit' | 'manual';

/**
 * How much of the editor fits on screen at once.
 *
 * Three shapes rather than two. The middle one is the tablet, which used to be
 * given the phone's layout the moment the window dropped below 1024px and so
 * lost the preview to a tab despite having room for it. What changes between
 * them is only where the score panel lives — beside the work, behind a drawer,
 * or on a tab of its own.
 */
export type LayoutMode = 'compact' | 'split' | 'full';

export interface EditorLayout {
  mode: LayoutMode;
  /** True in `split` and `full`: the form and the page are both on screen. */
  isSplit: boolean;
  tab: EditorTab;
  setTab: (tab: EditorTab) => void;
  /** Meaningful only in manual mode; in fit mode the pane decides. */
  zoom: number;
  zoomMode: ZoomMode;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  /**
   * Whether the score is showing, on whichever surface this mode gives it.
   *
   * One flag over two surfaces would have to be both open by default (so the
   * desktop column is there on load) and closed by default (so a tablet does
   * not open a drawer over the work nobody asked to cover). They are two
   * pieces of state; this is the answer to the one question a caller has.
   */
  scoreOpen: boolean;
  toggleScore: () => void;
  closeScore: () => void;
  /**
   * Closes the score only where it is covering something.
   *
   * Following a "Fix it" link has to get the drawer off the form it is sending
   * the reader to. On a desktop the score has a column of its own and is
   * covering nothing, so closing it there takes away a panel the reader put
   * on screen and did not ask to lose.
   */
  dismissScoreOverlay: () => void;
  /** The keyboard shortcut sheet. */
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
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
  const isSplit = useIsSplit();
  const [tab, setTab] = useState<EditorTab>('edit');
  const [zoom, setZoomValue] = useState<number>(ZOOM.default);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  // The score is a drawer at every width that has room for two panes: the
  // number lives in the top bar all the time, and the breakdown is a visit.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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
    mode: isDesktop ? 'full' : isSplit ? 'split' : 'compact',
    isSplit,
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
    scoreOpen: drawerOpen,
    toggleScore: useCallback(() => setDrawerOpen((open) => !open), []),
    closeScore: useCallback(() => setDrawerOpen(false), []),
    dismissScoreOverlay: useCallback(() => setDrawerOpen(false), []),
    shortcutsOpen,
    setShortcutsOpen,
    startedBlank: blankStartedFor !== null && blankStartedFor === (documentId ?? ''),
    startBlank: useCallback(() => setBlankStartedFor(documentId ?? ''), [documentId]),
  };
};
