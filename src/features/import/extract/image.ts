import type { ExtractedDocument, TextLine } from '../types';
import { toDocument } from './lines';

/**
 * OCR for screenshots and scans.
 *
 * Honest about what this is: tesseract reads a clean screenshot of a digital
 * document well and a photograph of a printed page badly. It also fetches its
 * language data on first use, so this is the one path here that is not fully
 * offline — the download is cached by the browser afterwards.
 *
 * Word-level boxes are kept rather than tesseract's own line grouping, because
 * the same column logic that rescues a two-column PDF rescues a screenshot of
 * one.
 */

export interface OcrProgress {
  /** 0–1, or -1 while the language data is still downloading. */
  ratio: number;
  label: string;
}

export const extractImage = async (
  file: File,
  onProgress?: (progress: OcrProgress) => void,
): Promise<ExtractedDocument> => {
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker('eng', undefined, {
    logger: (message: { status: string; progress: number }) => {
      onProgress?.({
        ratio: message.status === 'recognizing text' ? message.progress : -1,
        label: message.status === 'recognizing text' ? 'Reading the image' : 'Preparing OCR',
      });
    },
  });

  try {
    const { data } = await worker.recognize(file, undefined, { blocks: true });

    const lines: TextLine[] = (data.blocks ?? [])
      .flatMap((block) => block.paragraphs ?? [])
      .flatMap((paragraph) => paragraph.lines ?? [])
      .filter((line) => line.confidence > 40)
      .map((line) => ({
        text: line.text,
        x: line.bbox.x0,
        y: line.bbox.y0,
        page: 1,
        size: Math.max(1, line.bbox.y1 - line.bbox.y0),
      }));

    return toDocument('image', lines, 1);
  } finally {
    await worker.terminate();
  }
};
