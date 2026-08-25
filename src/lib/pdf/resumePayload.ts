import { RESUME_PAYLOAD } from '@/constants';

/**
 * The resume, carried inside the PDF it produced.
 *
 * Re-importing a generated CV used to mean reading the page back — and a design
 * with two columns emits its text runs in build order, not reading order, so
 * the pairing between a heading and its body is simply not in the file. No
 * heuristic recovers what was never written down.
 *
 * So it gets written down. The document travels as an attached file inside the
 * PDF, which changes nothing about how the PDF renders or what its text layer
 * says — an ATS reads exactly what it read before. Coming back in is then a
 * read rather than a guess. See ADR-023.
 */

export interface ResumeEnvelope<T = unknown> {
  /** Identifies the payload as ours before anything tries to parse it. */
  app: typeof RESUME_PAYLOAD.app;
  /** Schema version of the resume inside, for `normalizeResume` to reconcile. */
  schemaVersion: number;
  exportedAt: string;
  resume: T;
}

const GZIP = 'gzip';

const collect = async (stream: ReadableStream): Promise<Uint8Array> => {
  const chunks: Uint8Array[] = [];
  const reader = (stream as ReadableStream<Uint8Array>).getReader();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;

  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }

  return out;
};

const fromStream = (bytes: Uint8Array): ReadableStream =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

/**
 * Gzipped where the platform offers it, plain JSON where it does not.
 *
 * A CV with a photo carries that photo twice — once as the image the PDF draws
 * and once as the data URL in this payload — and gzip is what keeps the second
 * copy from doubling the file. The reader detects which it got, so an engine
 * without compression streams still round-trips.
 */
export const encodeResumePayload = async (envelope: ResumeEnvelope): Promise<Uint8Array> => {
  const json = new TextEncoder().encode(JSON.stringify(envelope));
  if (typeof CompressionStream === 'undefined') return json;

  try {
    return await collect(fromStream(json).pipeThrough(new CompressionStream(GZIP)));
  } catch {
    return json;
  }
};

/** Gzip's magic number. Cheaper and surer than trying a parse and catching. */
const isGzip = (bytes: Uint8Array): boolean =>
  bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

export const decodeResumePayload = async (
  bytes: Uint8Array,
): Promise<ResumeEnvelope | null> => {
  try {
    const json = isGzip(bytes)
      ? await collect(fromStream(bytes).pipeThrough(new DecompressionStream(GZIP)))
      : bytes;
    const parsed: unknown = JSON.parse(new TextDecoder().decode(json));

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      (parsed as ResumeEnvelope).app !== RESUME_PAYLOAD.app ||
      !(parsed as ResumeEnvelope).resume
    ) {
      return null;
    }

    return parsed as ResumeEnvelope;
  } catch {
    // A stripped, truncated or foreign attachment is not an error: the caller
    // falls back to reading the page, which is what it did before this existed.
    return null;
  }
};
