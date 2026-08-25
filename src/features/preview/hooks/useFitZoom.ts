'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { PAGE_SIZE_PX, ZOOM } from '@/constants';

const SHEET_WIDTH_PX = PAGE_SIZE_PX.width;

export interface FitZoom {
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Scale that makes an A4 sheet exactly fill the container. */
  fitZoom: number;
}

/**
 * Measures the pane so the sheet can be scaled to fit it.
 *
 * Without this a phone shows the left two-thirds of an A4 page and the rest
 * scrolls off, which reads as broken rather than as zoomed in.
 */
export const useFitZoom = (horizontalPadding = 32): FitZoom => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  const measure = useCallback(() => {
    const element = containerRef.current;
    if (element) setWidth(element.getBoundingClientRect().width);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [measure]);

  const available = Math.max(0, width - horizontalPadding);
  const raw = available > 0 ? available / SHEET_WIDTH_PX : ZOOM.default;

  // Never magnify past actual size: a wide pane should show an A4 page, not a poster.
  return { containerRef, fitZoom: Math.min(1, Math.max(ZOOM.min, raw)) };
};
