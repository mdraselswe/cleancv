'use client';

import { PAGE_SIZE_PX, PX_PER_MM, type TemplateId } from '@/constants';
import type { Resume } from '@/features/resume';
import { pageBleedBackground } from '@/lib/pageBleed';

import { getTemplate } from '../registry';
import { resolvePageBleed } from '../utils/theme';

export interface TemplatePreviewProps {
  /** The design to draw. Not necessarily the one the document is set to. */
  templateId: TemplateId;
  /** Drawn with the reader's own CV, so the choice is about *their* page. */
  resume: Resume;
  /** Rendered width in pixels; the height follows A4. */
  width: number;
}

/**
 * A design's first page, small.
 *
 * The picker used to be ten paragraphs of prose. Prose can say a design is
 * "two-column with a coloured rail" and still leave the reader guessing what
 * that looks like with their own name at the top of it — which is the entire
 * question they came to the picker with. Every builder worth the name answers
 * it with a picture, so this draws one.
 *
 * The real template at real page size, scaled down, rather than a hand-drawn
 * impression of it: an impression is a second thing to keep in step with the
 * design, and it is wrong the first time either changes. At this size the
 * words are illegible on purpose — the shape is the content.
 *
 * Off-screen thumbnails cost nothing to have: `content-visibility` lets the
 * browser skip laying out a full resume it is not showing, and ten of them
 * would otherwise be ten documents rendered on the way past.
 */
export const TemplatePreview = ({ templateId, resume, width }: TemplatePreviewProps) => {
  const { Template, meta } = getTemplate(templateId);
  /*
   * The design's own theme, not the document's. The picker is showing what
   * choosing this design *would* do, and choosing it replaces the theme
   * wholesale — previewing it under the outgoing design's margins and accent
   * would show a page that never exists.
   */
  const theme = { ...resume.meta.theme, ...meta.defaultTheme };
  const preview: Resume = { ...resume, meta: { ...resume.meta, templateId, theme } };

  const scale = width / PAGE_SIZE_PX.width;
  const bleed = resolvePageBleed(theme, meta);
  const marginPx = theme.marginMm * PX_PER_MM;

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden"
      style={{
        width,
        height: PAGE_SIZE_PX.height * scale,
        contentVisibility: 'auto',
        containIntrinsicSize: `${width}px ${PAGE_SIZE_PX.height * scale}px`,
      }}
    >
      <div
        style={{
          width: PAGE_SIZE_PX.width,
          height: PAGE_SIZE_PX.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          // A band reaches the paper's edge, so the sheet paints it and the
          // content insets itself — exactly as the page does. See ADR-036.
          padding: `${marginPx}px ${marginPx}px ${marginPx}px ${bleed ? 0 : marginPx}px`,
          background: bleed ? pageBleedBackground(bleed) : '#ffffff',
        }}
      >
        <Template resume={preview} />
      </div>
    </div>
  );
};
