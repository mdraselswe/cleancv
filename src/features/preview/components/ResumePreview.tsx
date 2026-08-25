'use client';

import { useEffect } from 'react';

import { PAGE_SIZE_PX, PX_PER_MM } from '@/constants';
import type { Resume } from '@/features/resume';
import { getTemplate } from '@/features/templates';

import { usePreviewMetrics } from '../hooks/usePreviewMetrics';

export interface ResumePreviewProps {
  resume: Resume;
  /** Display scale. Each sheet keeps its true A4 dimensions underneath. */
  zoom: number;
  /** Numbers each sheet. Off for anything that renders the preview decoratively. */
  showPageNumbers?: boolean;
  /** Reports measured pagination so the length rule can score a real number. */
  onPageCountChange?: (pageCount: number) => void;
  /**
   * Reports where the pages begin, so the export can reproduce these breaks
   * rather than letting Chrome find its own. See ADR-021.
   */
  onPageBreaksChange?: (anchors: number[]) => void;
}

/** Space between one sheet and the next, in unscaled pixels. */
const SHEET_GAP = 26;

/**
 * The document, as separate A4 sheets.
 *
 * One sheet per page rather than a single tall strip with a dashed line across
 * it: a guide line asks the reader to imagine the break, and the thing they
 * most need to see — what actually lands on page two, and how much white space
 * is left behind on page one — is exactly what it hides.
 *
 * Each sheet renders the whole document and shows its own slice of it, clipped
 * and shifted to that page's offset. The document is therefore rendered once
 * per page; at the two or three pages a resume runs to, that is cheaper than
 * the alternatives and keeps every sheet identical to the one the PDF prints.
 *
 * Zoom is a CSS transform, which does not affect layout, so the outer box is
 * sized to the scaled result to keep the scroll container honest.
 */
export const ResumePreview = ({
  resume,
  zoom,
  showPageNumbers = true,
  onPageCountChange,
  onPageBreaksChange,
}: ResumePreviewProps) => {
  const { Template, meta } = getTemplate(resume.meta.templateId);
  const { marginMm } = resume.meta.theme;
  const { contentRef, contentHeight, pageContentHeight, pageCount, pageOffsets, pageBreakAnchors } =
    usePreviewMetrics(marginMm);

  useEffect(() => {
    onPageCountChange?.(pageCount);
  }, [pageCount, onPageCountChange]);

  /*
   * Only a single-column design has page breaks worth forcing. In one column a
   * break is a point in the document, and naming the element that starts each
   * page describes it exactly. In two columns it is not a point — the columns
   * cross the boundary independently — so `break-before` on one element would
   * describe something the preview never showed. Those designs are left to
   * Chrome, which paginates them the way the preview already measures. See
   * ADR-021.
   */
  const forceable = meta.supports.columns === 1;

  useEffect(() => {
    onPageBreaksChange?.(forceable ? pageBreakAnchors : []);
  }, [forceable, pageBreakAnchors, onPageBreaksChange]);

  const marginPx = marginMm * PX_PER_MM;
  const sheetWidth = PAGE_SIZE_PX.width;
  const sheetHeight = PAGE_SIZE_PX.height;
  const stackHeight = sheetHeight * pageCount + SHEET_GAP * (pageCount - 1);

  return (
    <div
      className="relative mx-auto"
      style={{ width: sheetWidth * zoom, height: stackHeight * zoom }}
    >
      <div
        className="absolute left-0 top-0 flex flex-col"
        style={{
          width: sheetWidth,
          gap: SHEET_GAP,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {pageOffsets.map((offset, index) => (
          <div key={offset} className="relative">
            <div
              className="bg-white shadow-app"
              style={{ width: sheetWidth, height: sheetHeight, padding: marginPx }}
            >
              {/*
                The window onto this page. `overflow: hidden` is what makes the
                sheet show its own slice; the flow inside is the full document
                every time, shifted up to this page's starting offset.

                The window stops where the *next* page begins rather than after
                a full page's height. Those differ whenever an entry was moved
                down to keep it whole, and the difference is the white space at
                the foot of the page — which is the thing worth seeing.
              */}
              <div
                style={{
                  height: Math.max(
                    0,
                    Math.min(pageContentHeight, (pageOffsets[index + 1] ?? contentHeight) - offset),
                  ),
                  overflow: 'hidden',
                }}
              >
                <div style={{ transform: `translateY(${-offset}px)` }}>
                  {/* Only the first copy is measured; they are all identical. */}
                  <div ref={index === 0 ? contentRef : undefined}>
                    <Template resume={resume} />
                  </div>
                </div>
              </div>
            </div>

            {showPageNumbers ? (
              <span
                aria-hidden="true"
                className="text-fg-subtle absolute -bottom-5 right-0 text-[11px] tabular-nums"
              >
                Page {index + 1} of {pageCount}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
