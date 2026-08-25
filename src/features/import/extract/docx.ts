import type { ExtractedDocument, TextLine } from '../types';
import { toDocument } from './lines';

/**
 * DOCX extraction.
 *
 * The most accurate source of the three by a distance: a Word file still knows
 * what a paragraph and a list item are, so nothing has to be inferred from
 * pixel positions. Anyone who still has the .docx their CV came from should be
 * pointed at it rather than at the PDF they exported.
 */

/** Heading levels map to a nominal size so the parser can spot the name. */
const HEADING_SIZE: Record<string, number> = {
  h1: 22,
  h2: 18,
  h3: 15,
  li: 11,
  p: 11,
};

export const extractDocx = async (file: File): Promise<ExtractedDocument> => {
  const mammoth = await import('mammoth');
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });

  const container = document.createElement('div');
  container.innerHTML = html;

  const lines: TextLine[] = [];
  let order = 0;

  for (const element of container.querySelectorAll('h1, h2, h3, h4, p, li')) {
    const text = element.textContent ?? '';
    if (!text.trim()) continue;

    const tag = element.tagName.toLowerCase();

    lines.push({
      // A list item keeps its marker, which is how the parser recognises bullets.
      text: tag === 'li' ? `• ${text}` : text,
      x: 0,
      y: order,
      page: 1,
      size: HEADING_SIZE[tag] ?? 11,
    });

    order += 1;
  }

  return toDocument('docx', lines, 1);
};
