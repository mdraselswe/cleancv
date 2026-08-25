'use client';

import { useCallback, useEffect, useState, useRef } from 'react';

import {
  BREAK_ANCHOR_SELECTOR,
  HEADING_SELECTOR,
  PAGE_SIZE_PX,
  PX_PER_MM,
  UNBREAKABLE_SELECTOR,
} from '@/constants';

export interface PreviewMetrics {
  /** Attach to the element wrapping the rendered document. */
  contentRef: React.RefObject<HTMLDivElement | null>;
  /** Rendered height of the document flow, in CSS pixels. */
  contentHeight: number;
  /** Usable height of one page after margins, in CSS pixels. */
  pageContentHeight: number;
  pageCount: number;
  /**
   * Offset into the flow at which each page begins, in pixels. Always starts
   * at 0, so `pageOffsets.length` is the page count.
   */
  pageOffsets: number[];
  /**
   * For every page after the first, the index of the element that starts it in
   * document order over `BREAK_ANCHOR_SELECTOR`. The export sends these so the PDF
   * breaks exactly where the preview said it would. See ADR-021.
   */
  pageBreakAnchors: number[];
}

interface Atom {
  top: number;
  bottom: number;
  /** Position in `BREAK_ANCHOR_SELECTOR`, or -1 for an element that is not one. */
  anchor: number;
}

/**
 * The bottom of the first piece of `element` that Chrome keeps with the heading
 * above it.
 *
 * `break-after: avoid` binds a heading to the *start* of what follows, not to
 * all of it: a skills section three hundred pixels tall may still begin at the
 * foot of a page, as long as its first group comes down with the heading.
 * Measuring the whole block instead made the preview drop a whole section to
 * the next page where the PDF split it, and the two then disagreed about where
 * page two began — which is the one thing separate sheets exist to show. See
 * ADR-020.
 */
const firstFragmentBottom = (element: HTMLElement): number => {
  const top = element.getBoundingClientRect().top;

  // A block that leads with something unbreakable is bound to the whole of it.
  const unbreakable = element.matches(UNBREAKABLE_SELECTOR)
    ? element
    : element.querySelector<HTMLElement>(UNBREAKABLE_SELECTOR);

  if (unbreakable && unbreakable.getBoundingClientRect().top <= top + 1) {
    return unbreakable.getBoundingClientRect().bottom;
  }

  /*
   * Otherwise Chrome may split it, and only its first line comes along. A
   * Range's client rects are line boxes, which is the one way to measure a
   * single line without reading font metrics back.
   */
  const range = document.createRange();
  range.selectNodeContents(element);
  const lines = range.getClientRects();

  return lines.length > 0 ? lines[0].bottom : element.getBoundingClientRect().bottom;
};

/**
 * Where the document's pages actually begin.
 *
 * Not `contentHeight / pageHeight`: that assumes content can be cut anywhere,
 * and the templates tell Chrome the opposite — an entry is kept whole, so one
 * that would straddle a boundary starts the next page instead and leaves white
 * space behind it. Measuring the same rules here is what lets the preview show
 * the pages the PDF will actually have, rather than a guess that drifts from it.
 */
interface Pagination {
  offsets: number[];
  /** Index into `BREAK_ANCHOR_SELECTOR` of the element starting each page after the first. */
  anchors: number[];
}

const findPageOffsets = (root: HTMLElement, pageHeight: number, scale: number): Pagination => {
  const offsets = [0];
  const anchors: number[] = [];
  if (pageHeight <= 0) return { offsets, anchors };

  const rootTop = root.getBoundingClientRect().top;
  const toFlow = (value: number) => (value - rootTop) / scale;
  const span = (element: HTMLElement) => {
    const box = element.getBoundingClientRect();

    return { top: toFlow(box.top), bottom: toFlow(box.bottom) };
  };

  // Index in this list is the address a break is sent to the print route as.
  const anchorElements = [...root.querySelectorAll<HTMLElement>(BREAK_ANCHOR_SELECTOR)];
  const indexOf = (element: HTMLElement) => anchorElements.indexOf(element);

  const atoms: Atom[] = [
    ...[...root.querySelectorAll<HTMLElement>(UNBREAKABLE_SELECTOR)].map((element) => ({
      ...span(element),
      anchor: indexOf(element),
    })),
    ...[...root.querySelectorAll<HTMLElement>(HEADING_SELECTOR)].map((element) => {
      const next = element.nextElementSibling as HTMLElement | null;
      const anchor = indexOf(element);
      if (!next) return { ...span(element), anchor };

      return { top: span(element).top, bottom: toFlow(firstFragmentBottom(next)), anchor };
    }),
  ]
    // A nested atom is already covered by its parent; keeping both would let an
    // inner one re-break a page its parent has already moved.
    .filter(
      (atom, index, all) =>
        !all.some(
          (other, i) =>
            i !== index &&
            other.top <= atom.top &&
            other.bottom >= atom.bottom &&
            other.bottom - other.top > atom.bottom - atom.top,
        ),
    )
    .sort((a, b) => a.top - b.top);

  let pageStart = 0;

  for (const atom of atoms) {
    // Taller than a page: nothing can keep it whole, so let it split.
    if (atom.bottom - atom.top >= pageHeight) continue;

    if (atom.bottom - pageStart > pageHeight && atom.top > pageStart) {
      pageStart = atom.top;
      offsets.push(pageStart);
      if (atom.anchor >= 0) anchors.push(atom.anchor);
    }
  }

  return { offsets, anchors };
};

/**
 * Measures the document so the preview can lay it out as real pages.
 *
 * Re-measured on every resize of the flow, which covers a font change, a
 * density change and every keystroke that adds a line.
 */
export const usePreviewMetrics = (marginMm: number): PreviewMetrics => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [pageOffsets, setPageOffsets] = useState<number[]>([0]);
  const [pageBreakAnchors, setPageBreakAnchors] = useState<number[]>([]);

  const pageContentHeight = Math.max(1, PAGE_SIZE_PX.height - marginMm * PX_PER_MM * 2);

  const measure = useCallback(() => {
    const element = contentRef.current;
    if (!element) return;

    /*
     * `getBoundingClientRect` reports the *painted* box, so the preview's zoom
     * transform scales everything it returns. `offsetWidth` is the layout box
     * and ignores transforms, so their ratio recovers the scale — without it a
     * two-page document reads as one at any zoom below 100%, and the ATS length
     * rule scores whatever the reader happened to have the slider set to.
     */
    const box = element.getBoundingClientRect();
    const scale = element.offsetWidth > 0 ? box.width / element.offsetWidth : 1;

    setContentHeight(box.height / (scale || 1));

    const next = findPageOffsets(element, pageContentHeight, scale || 1);
    // Replacing an equal array on every resize would re-render the whole preview.
    const keepIfSame = (current: number[], incoming: number[]) =>
      current.length === incoming.length && current.every((value, i) => value === incoming[i])
        ? current
        : incoming;

    setPageOffsets((current) => keepIfSame(current, next.offsets));
    setPageBreakAnchors((current) => keepIfSame(current, next.anchors));
  }, [pageContentHeight]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();

    return () => observer.disconnect();
  }, [measure]);

  /*
   * The last page has to be long enough for whatever follows the final break,
   * which the offsets alone do not say.
   */
  const lastStart = pageOffsets.at(-1) ?? 0;
  const overflowPages = Math.max(0, Math.ceil((contentHeight - lastStart) / pageContentHeight) - 1);

  const allOffsets = [
    ...pageOffsets,
    ...Array.from(
      { length: overflowPages },
      (_, index) => lastStart + (index + 1) * pageContentHeight,
    ),
  ];

  return {
    contentRef,
    contentHeight,
    pageContentHeight,
    pageCount: allOffsets.length,
    pageOffsets: allOffsets,
    pageBreakAnchors,
  };
};
