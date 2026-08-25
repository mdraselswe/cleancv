import { RESUME_PAYLOAD, RESUME_SCHEMA_VERSION } from '@/constants';

import { encodeResumePayload } from './resumePayload';

/**
 * Puts the resume inside the PDF as an attached file.
 *
 * An attachment rather than metadata or hidden text: metadata is what
 * "compress this PDF" tools strip first, and hidden text would land in the
 * extracted text layer — the one thing this project exists to keep clean. An
 * embedded file is a first-class PDF object that viewers list, copy and email
 * along with the document, and that changes nothing about what is drawn or
 * what a parser reads. See ADR-003 and ADR-023.
 *
 * Failing to attach is not failing to export. The PDF is already correct at
 * this point; losing the payload costs the round trip, not the document.
 */
export const attachResume = async (pdf: Uint8Array, resume: unknown): Promise<Uint8Array> => {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const document = await PDFDocument.load(pdf);

    await document.attach(
      await encodeResumePayload({
        app: RESUME_PAYLOAD.app,
        schemaVersion: RESUME_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        resume,
      }),
      RESUME_PAYLOAD.name,
      {
        mimeType: 'application/gzip',
        description: RESUME_PAYLOAD.description,
        creationDate: new Date(),
        modificationDate: new Date(),
      },
    );

    return await document.save();
  } catch (error) {
    console.error('[pdf] could not attach the resume payload', error);

    return pdf;
  }
};
