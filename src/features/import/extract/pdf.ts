import { RESUME_PAYLOAD } from '@/constants';
import { decodeResumePayload } from '@/lib/pdf/resumePayload';

import type { ExtractedDocument, TextLine } from '../types';
import { toDocument } from './lines';

/**
 * The subset of pdf.js this module needs.
 *
 * Declared structurally so the line builder can be handed a document loaded by
 * any pdf.js build — the browser one here, the legacy one the release gate uses
 * in Node — without either import leaking into the other's environment.
 */
export interface PdfLike {
  numPages: number;
  /**
   * Files embedded in the PDF.
   *
   * A `Map` keyed by filename on pdf.js 5+, a plain object on older builds, and
   * absent on ones older still — all three are handled, because the release
   * gate loads its own build and the browser loads another.
   */
  getAttachments?: () => Promise<unknown>;
  /** Bytes of one attachment. Separate from the listing since pdf.js 5. */
  getAttachmentContent?: (name: string) => Promise<Uint8Array | undefined>;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => { height: number };
    getTextContent: () => Promise<{ items: unknown[] }>;
  }>;
}

/**
 * PDF text extraction with geometry.
 *
 * pdf.js hands back positioned runs, not lines, and the difference matters: a
 * two-column CV concatenates into interleaved nonsense if the runs are simply
 * joined. Keeping x, y and glyph height lets the line builder rebuild reading
 * order — and lets the parser notice that the biggest text on page one is
 * almost certainly the person's name.
 */

/** Runs closer together than this vertically belong to the same line. */
const LINE_TOLERANCE = 2.5;

/**
 * Positioned lines from an already-loaded PDF.
 *
 * Split out from `extractPdf` so the same code that reads a user's upload also
 * runs against a PDF this app rendered — which is what lets the release gate
 * assert that an exported CV can be imported back.
 */
export const linesFromPdf = async (pdf: PdfLike): Promise<TextLine[]> => {
  const lines: TextLine[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    /** Runs on this page, in PDF space where y grows upwards. */
    const runs = content.items
      .filter((item): item is { str: string; transform: number[] } =>
        typeof item === 'object' && item !== null && 'str' in item,
      )
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        // Flipped so that "smaller y" means "higher on the page".
        y: viewport.height - item.transform[5],
        size: Math.abs(item.transform[3]) || Math.abs(item.transform[0]),
      }))
      .filter((run) => run.text.trim().length > 0);

    /*
     * Deliberately not sorted. The order pdf.js reports is the order the page
     * was built, which is the reading order for any CV whose markup follows it
     * — see the note in `lines.ts`.
     */
    for (const run of runs) {
      const previous = lines.at(-1);
      // Same line when the run sits at the same height as the one before it.
      const sameLine =
        previous?.page === pageNumber && Math.abs(previous.y - run.y) <= LINE_TOLERANCE;

      if (sameLine && previous) {
        // A gap wider than a space is a tab stop or a column break, not a word join.
        previous.text += `${Math.abs(run.x - previous.x) > previous.size * 8 ? '   ' : ' '}${run.text}`;
        previous.size = Math.max(previous.size, run.size);
        continue;
      }

      lines.push({ text: run.text, x: run.x, y: run.y, page: pageNumber, size: run.size });
    }
  }

  return lines;
};

/**
 * The resume this PDF was made from, if it is one of ours.
 *
 * Split from `extractPdf` because the answer makes the rest unnecessary: with
 * the document in hand there is nothing to parse and nothing to guess. Returns
 * null for every other PDF, and the caller reads the page as before.
 *
 * Structural, not exact: any pdf.js build with `getAttachments` will do, which
 * is what lets the release gate run the same code in Node. See ADR-023.
 */
export const readEmbeddedResume = async (pdf: PdfLike): Promise<unknown | null> => {
  if (typeof pdf.getAttachments !== 'function') return null;

  const listing = await pdf.getAttachments().catch(() => null);
  if (!listing || typeof listing !== 'object') return null;

  const names =
    listing instanceof Map
      ? [...listing.keys()].map(String)
      : Object.keys(listing as Record<string, unknown>);
  const name = names.find((candidate) => candidate.endsWith(RESUME_PAYLOAD.name));
  if (!name) return null;

  /*
   * pdf.js 5 split the listing from the bytes: the map carries names and
   * descriptions, and content is fetched by name. Older builds put `content`
   * straight on the entry, so both are read.
   */
  const entry = (listing instanceof Map ? listing.get(name) : (listing as Record<string, unknown>)[name]) as
    | { content?: Uint8Array }
    | undefined;
  const content =
    entry?.content ??
    (typeof pdf.getAttachmentContent === 'function'
      ? await pdf.getAttachmentContent(name).catch(() => undefined)
      : undefined);

  if (!content) return null;

  return (await decodeResumePayload(new Uint8Array(content)))?.resume ?? null;
};

export const extractPdf = async (file: File): Promise<ExtractedDocument> => {
  // Loaded on demand: pdf.js is over a megabyte and most sessions never import.
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');

  /*
   * The worker is bundled with the app rather than pulled from a CDN, so
   * extraction keeps working offline and behind a firewall. `new URL(...,
   * import.meta.url)` is the form bundlers recognise as "emit this as an
   * asset and give me its final path".
   */
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const task = getDocument({ data: await file.arrayBuffer(), useSystemFonts: true });
  const pdf = await task.promise;

  try {
    const like = pdf as unknown as PdfLike;
    // Asked first, and the answer usually makes the rest moot — but the lines
    // are read anyway, so a payload that fails to validate still leaves a
    // normal import behind rather than an error.
    const embedded = await readEmbeddedResume(like);

    return { ...toDocument('pdf', await linesFromPdf(like), pdf.numPages), embedded };
  } finally {
    await task.destroy();
  }
};
