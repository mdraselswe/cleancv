'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ResizablePaneOptions {
  initial: number;
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
export const useResizablePane = ({ initial, min, max }: ResizablePaneOptions): ResizablePane => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(initial);
  const [dragging, setDragging] = useState(false);

  const clamp = useCallback(
    (value: number) => {
      const width = containerRef.current?.getBoundingClientRect().width ?? Infinity;

      return Math.max(min, Math.min(value, Math.min(max, width - min)));
    },
    [min, max],
  );

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSize((current) => clamp(current - KEYBOARD_STEP));
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
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
