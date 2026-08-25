import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

import { linesFromPdf, toDocument, type ExtractedDocument, type PdfLike } from '@/features/import';

/**
 * Reads the text layer out of a generated PDF.
 *
 * This is the only honest way to check ATS friendliness: it inspects what a
 * parser actually receives, not what the HTML said. A canvas-rendered PDF
 * returns nothing here, which is the point.
 */

export interface ExtractedPdf {
  pageCount: number;
  /** Text of each page, in the order the PDF stores its runs. */
  pages: string[];
  text: string;
}

export const extractPdfText = async (data: Uint8Array): Promise<ExtractedPdf> => {
  const loadingTask = getDocument({
    data,
    // Node has no DOM canvas and none is needed for text extraction.
    useSystemFonts: true,
  });
  const document = await loadingTask.promise;

  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();

    const line = content.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item) => (item.hasEOL ? `${item.str}\n` : item.str))
      .join('');

    pages.push(line);
  }

  const pageCount = document.numPages;
  await loadingTask.destroy();

  return { pageCount, pages, text: pages.join('\n') };
};

/** Index of `needle` in `haystack`, ignoring whitespace and case differences. */
export const looseIndexOf = (haystack: string, needle: string): number => {
  const flatten = (value: string) => value.replace(/\s+/g, ' ').toLowerCase();

  return flatten(haystack).indexOf(flatten(needle));
};

export const looseIncludes = (haystack: string, needle: string): boolean =>
  looseIndexOf(haystack, needle) !== -1;

/**
 * The same positioned-line view of a PDF that the import feature builds in the
 * browser, produced here with the legacy pdf.js build so the release gate can
 * run the real parser against a real rendered file.
 */
export const documentFromPdf = async (data: Uint8Array): Promise<ExtractedDocument> => {
  const loadingTask = getDocument({ data, useSystemFonts: true });
  const pdf = await loadingTask.promise;

  try {
    return toDocument('pdf', await linesFromPdf(pdf as unknown as PdfLike), pdf.numPages);
  } finally {
    await loadingTask.destroy();
  }
};
