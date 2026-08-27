'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ResizablePaneOptions {
  /**
   * Share of the container the left pane takes until someone drags it.
   *
   * A fraction rather than a pixel width, because the same split has to work
   * in a 1080px gap on a desktop and a 768px one on a tablet. A fixed 520px
   * left the tablet's preview 248 pixels wide — a page at forty per cent,
   * beside a form that had more room than it could use.
   */
  fraction: number;
  min: number;
  max: number;
}

export interface ResizablePane {
  /** Width of the left pane in pixels. */
  size: number;
  dragging: boolean;
  /** Spread onto the divider element. */
  handleProps: {
    onPointerDown: (event: React.PointerEvent) => void;
    role: 'separator';
    'aria-orientation': 'vertical';
    tabIndex: 0;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const KEYBOARD_STEP = 24;

/**
 * Pointer-driven split divider, measured against the container so the pane keeps
 * its proportion when the window resizes. Arrow keys move it too — a divider
 * that only responds to a mouse is a keyboard trap for the panes behind it.
 */
export const useResizablePane = ({ fraction, min, max }: ResizablePaneOptions): ResizablePane => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Starts at the floor and is corrected the moment the container reports a
  // width. Starting at zero would paint one frame with no left pane at all.
  const [size, setSize] = useState(min);
  const [dragging, setDragging] = useState(false);
  /*
   * Once the divider has been moved the proportion is the reader's, not the
   * layout's, and resizing the window must not throw their choice away.
   */
  const moved = useRef(false);

  const clamp = useCallback(
    (value: number) => {
      const width = containerRef.current?.getBoundingClientRect().width ?? Infinity;

      return Math.max(min, Math.min(value, Math.min(max, width - min)));
    },
    [min, max],
  );

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    moved.current = true;
    setDragging(true);
  }, []);

  // Re-derives the width whenever the gap the panes live in changes.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const fit = () => {
      const width = node.getBoundingClientRect().width;
      if (width === 0) return;

      setSize((current) => clamp(moved.current ? current : width * fraction));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);

    return () => observer.disconnect();
  }, [clamp, fraction]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moved.current = true;
        setSize((current) => clamp(current - KEYBOARD_STEP));
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moved.current = true;
        setSize((current) => clamp(current + KEYBOARD_STEP));
      }
    },
    [clamp],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const left = containerRef.current?.getBoundingClientRect().left ?? 0;
      setSize(clamp(event.clientX - left));
    };
    const onUp = () => setDragging(false);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, clamp]);

  return {
    size,
    dragging,
    containerRef,
    handleProps: {
      onPointerDown,
      onKeyDown,
      role: 'separator',
      'aria-orientation': 'vertical',
      tabIndex: 0,
    },
  };
};
