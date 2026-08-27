'use client';

import { useCallback, useEffect, useState } from 'react';

export interface ScrollEdges {
  /**
   * Attach to the scrolling element.
   *
   * A callback ref rather than a `useRef` object, because the element does not
   * exist when this hook first runs. An effect keyed on `[measure]` reads
   * `ref.current`, finds `null` on the mount where the pane is still showing
   * its empty state, returns — and never runs again, because nothing in its
   * dependency list changes when the strip finally appears. The strip then
   * scrolls with no fade, no arrows and no scrollbar: three affordances, all
   * of them switched off by one silent early return.
   */
  ref: (node: HTMLDivElement | null) => void;
  /** Spread onto the same element; drives the `.scroll-fade` mask. */
  edgeProps: { 'data-overflow-start': boolean; 'data-overflow-end': boolean };
  /** True when this end is as far as the strip goes. */
  atStart: boolean;
  atEnd: boolean;
  scrollBy: (amount: number) => void;
  /** Brings a child fully into view, e.g. the tab that has just been selected. */
  scrollIntoView: (child: HTMLElement | null) => void;
}

/**
 * Which ends of a horizontally scrolling strip have more behind them.
 *
 * A strip that scrolls and does not say so reads as a strip that ends. The
 * editor's section tabs run to twelve entries and the last three were simply
 * not there as far as anyone could tell. The fade is driven from measurement
 * rather than applied unconditionally, because a strip that fits has nothing
 * to fade and dimming its first word is a lie about the content.
 */
export const useScrollEdges = (): ScrollEdges => {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const ref = useCallback((next: HTMLDivElement | null) => setNode(next), []);

  useEffect(() => {
    if (!node) return;

    const measure = () => {
      const max = node.scrollWidth - node.clientWidth;

      setEdges({
        // A pixel of slack: fractional scroll positions never reach the ends exactly.
        start: node.scrollLeft > 1,
        end: max > 1 && node.scrollLeft < max - 1,
      });
    };

    measure();
    node.addEventListener('scroll', measure, { passive: true });

    // The strip's own content changes with the document, not only the window.
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);

    return () => {
      node.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [node]);

  return {
    ref,
    edgeProps: { 'data-overflow-start': edges.start, 'data-overflow-end': edges.end },
    atStart: !edges.start,
    atEnd: !edges.end,
    scrollBy: useCallback(
      (amount: number) => node?.scrollBy({ left: amount, behavior: 'smooth' }),
      [node],
    ),
    scrollIntoView: useCallback(
      (child: HTMLElement | null) => {
        if (!node || !child) return;

        const strip = node.getBoundingClientRect();
        const box = child.getBoundingClientRect();
        // A margin either side, so the tab does not land flush against the
        // fade that is drawn over the edge it just scrolled in from.
        const pad = 32;
        const under = box.left - strip.left - pad;
        const over = box.right - strip.right + pad;

        if (under < 0) node.scrollBy({ left: under, behavior: 'smooth' });
        else if (over > 0) node.scrollBy({ left: over, behavior: 'smooth' });
      },
      [node],
    ),
  };
};
