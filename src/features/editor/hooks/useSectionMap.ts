'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { PAGE_SIZE_PX, PX_PER_MM, type SectionColumn, type SectionSlot } from '@/constants';
import { usePreviewMetrics } from '@/features/preview';
import { useResume } from '@/features/resume';
import { getTemplate, resolveSectionColumn } from '@/features/templates';

/**
 * Where every section actually lands on the page.
 *
 * Measured off a real rendering of the document rather than estimated from the
 * section list: a two-column design puts half its sections in a panel, a long
 * one runs over a page boundary, and a list of names in order says nothing
 * about either. The map draws what the reader will hold.
 *
 * The rendering is a hidden copy at true page width, not the preview pane —
 * the map has to be right whether or not the preview is on screen, and at the
 * preview's zoom every measurement would need dividing back out. See ADR-042.
 */

export interface SectionBox {
  key: string;
  slot: SectionSlot;
  /** Fractions of the page's content box. */
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * False for the part of a section that ran on from the page before. Only the
   * first piece carries the drag handle: the same section cannot be two things
   * to drop onto.
   */
  head: boolean;
  /** Read from the same resolver the template lays out with. See ADR-043. */
  column: SectionColumn;
}

export interface SectionMapPage {
  boxes: SectionBox[];
}

export interface SectionMap {
  /** Attach to the element the hidden copy renders into. */
  measureRef: React.RefObject<HTMLDivElement | null>;
  /** Width the hidden copy must be laid out at, in pixels. */
  flowWidth: number;
  /** Page margin as a fraction of the paper, for drawing the content box. */
  margin: { x: number; y: number };
  pages: SectionMapPage[];
  /** Whether dropping into the other column means anything on this design. */
  twoColumn: boolean;
  /**
   * The band above the first section of each column, where a design leaves one.
   *
   * Per column rather than one across the page: a two-column design stands its
   * name over the narrative and starts the panel at the very top, so a single
   * band measured from the topmost section anywhere would be nothing at all.
   */
  headers: Array<{ x: number; width: number; height: number }>;
}

interface Measured {
  slot: SectionSlot;
  top: number;
  bottom: number;
  left: number;
  width: number;
}

export const useSectionMap = (): SectionMap => {
  const resume = useResume();
  const { meta: templateMeta } = getTemplate(resume.meta.templateId);
  const { marginMm } = resume.meta.theme;
  const { contentRef, pageContentHeight, pageOffsets } = usePreviewMetrics(marginMm);

  const measureRef = contentRef as React.RefObject<HTMLDivElement | null>;
  const [sections, setSections] = useState<Measured[]>([]);
  const frame = useRef(0);

  const flowWidth = PAGE_SIZE_PX.width - marginMm * PX_PER_MM * 2;

  const measure = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;

    const box = root.getBoundingClientRect();
    const found = [...root.querySelectorAll<HTMLElement>('[data-section]')].map((element) => {
      const rect = element.getBoundingClientRect();

      return {
        slot: element.dataset.section as SectionSlot,
        top: rect.top - box.top,
        bottom: rect.bottom - box.top,
        left: rect.left - box.left,
        width: rect.width,
      };
    });

    setSections(found);
  }, [measureRef]);

  /*
   * One frame after layout, and again whenever the pagination the preview hook
   * reports changes — which is what changes when the document does.
   */
  useEffect(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);

    return () => cancelAnimationFrame(frame.current);
  }, [measure, resume, pageOffsets, pageContentHeight]);

  const pages: SectionMapPage[] = pageOffsets.map((offset, index) => {
    /*
     * A page ends a page's height down, or where the next one begins if an
     * entry was moved down to stay whole and left white space behind.
     */
    const foot = Math.min(offset + pageContentHeight, pageOffsets[index + 1] ?? Number.MAX_VALUE);
    const boxes: SectionBox[] = [];

    for (const section of sections) {
      const top = Math.max(section.top, offset);
      const bottom = Math.min(section.bottom, foot);
      if (bottom - top < 3) continue;

      boxes.push({
        key: `${section.slot}:${index}`,
        slot: section.slot,
        column: resolveSectionColumn(resume, templateMeta, section.slot),
        x: section.left / flowWidth,
        y: (top - offset) / pageContentHeight,
        width: section.width / flowWidth,
        height: (bottom - top) / pageContentHeight,
        head: section.top >= offset - 1,
      });
    }

    return { boxes };
  });

  /*
   * One band per column, above whatever that column starts with. Columns are
   * recognised by where their sections begin, which is the only thing every
   * design agrees on — nothing in the markup says "this is a column".
   */
  const columns = new Map<number, Measured[]>();
  for (const section of sections) {
    const key = Math.round(section.left);
    columns.set(key, [...(columns.get(key) ?? []), section]);
  }

  const headers = [...columns.values()]
    .map((group) => {
      const top = Math.min(...group.map((item) => item.top));

      return {
        x: group[0].left / flowWidth,
        width: Math.max(...group.map((item) => item.width)) / flowWidth,
        height: top / pageContentHeight,
        top,
      };
    })
    .filter((band) => band.top > 6)
    .map(({ x, width, height }) => ({ x, width, height }));

  return {
    measureRef,
    flowWidth,
    margin: {
      x: (marginMm * PX_PER_MM) / PAGE_SIZE_PX.width,
      y: (marginMm * PX_PER_MM) / PAGE_SIZE_PX.height,
    },
    pages,
    twoColumn: templateMeta.supports.columns === 2,
    headers,
  };
};
