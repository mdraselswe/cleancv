import { IMPORT_MAX_BYTES, IMPORT_MIME } from '@/constants';

import type { ExtractedDocument, SourceKind } from '../types';
import { extractDocx } from './docx';
import { extractImage, type OcrProgress } from './image';
import { extractPdf } from './pdf';

/** Dispatches a file to the right reader. Every reader is loaded on demand. */

export const detectKind = (file: File): SourceKind | null => {
  if (file.type === IMPORT_MIME.pdf || /\.pdf$/i.test(file.name)) return 'pdf';
  if (file.type === IMPORT_MIME.docx || /\.docx$/i.test(file.name)) return 'docx';
  if (file.type.startsWith('image/')) return 'image';

  return null;
};

export interface ExtractOptions {
  onProgress?: (progress: OcrProgress) => void;
}

export const extractDocument = async (
  file: File,
  options: ExtractOptions = {},
): Promise<ExtractedDocument> => {
  if (file.size > IMPORT_MAX_BYTES) {
    throw new Error(
      `That file is ${Math.round(file.size / 1024 / 1024)} MB. Import handles files up to ${IMPORT_MAX_BYTES / 1024 / 1024} MB.`,
    );
  }

  const kind = detectKind(file);

  switch (kind) {
    case 'pdf':
      return extractPdf(file);
    case 'docx':
      return extractDocx(file);
    case 'image':
      return extractImage(file, options.onProgress);
    default:
      throw new Error('Import reads PDF, DOCX and image files. A .doc file needs saving as .docx.');
  }
};

export { isTwoColumn } from './lines';
export type { OcrProgress };
