/**
 * Squeezing an uploaded picture down to something a document can carry.
 *
 * A photo and a signature live inside the resume JSON as data URLs, which is
 * what makes a document portable through export, import and backup with no
 * asset hosting anywhere. The price is that every byte of the picture is paid
 * for three times over: in IndexedDB, in the JSON backup, and again inside the
 * exported PDF, where the payload is embedded so the file can be imported back.
 *
 * Uploads used to be taken at their original size and merely refused above a
 * cap, which got both halves wrong. A phone portrait is several megabytes, so
 * the reader was told to go and shrink it themselves — using software we did
 * not name, for a reason we did not explain — and a picture that squeaked under
 * the cap was still two orders of magnitude larger than the thirty-millimetre
 * frame it renders into. Resizing is a thing the browser can do in a few
 * milliseconds, so it does it.
 *
 * WebP rather than JPEG, because a scanned signature is a PNG with a
 * transparent background and JPEG would paint that black.
 */

export interface ImageBudget {
  /** Bytes above which a file is refused before it is decoded. */
  uploadBytes: number;
  /** Longest side kept, in pixels. */
  maxEdge: number;
  /** What the encoded data URL is squeezed under, in bytes. */
  storedBytes: number;
}

export interface DownscaledImage {
  dataUrl: string;
  width: number;
  height: number;
  /**
   * Length of the data URL.
   *
   * The string is what storage and the export actually pay for, and it is all
   * ASCII, so its length is its size in bytes. Measuring the encoded blob
   * instead would under-report by the third that base64 adds.
   */
  bytes: number;
}

const WEBP = 'image/webp';
const PNG = 'image/png';

/** Full size, good quality: what almost every upload comes out as. */
const IDEAL = { edge: 1, quality: 0.82 };

/** Tried in turn, and only while the encoding is still over budget. */
const FALLBACKS = [
  { edge: 1, quality: 0.66 },
  { edge: 0.75, quality: 0.66 },
  { edge: 0.5, quality: 0.66 },
  { edge: 0.5, quality: 0.45 },
];

/**
 * How far to scale a picture of this size, given a longest side to fit within.
 *
 * Never above 1: a signature scanned at 200px is already the whole picture, and
 * enlarging it to the budget would spend four times the bytes on the same
 * information rendered blurrier.
 */
export const fitScale = (width: number, height: number, maxEdge: number): number => {
  const longest = Math.max(width, height);

  if (longest <= 0) return 1;

  return Math.min(1, maxEdge / longest);
};

/**
 * Decoded, and turned the right way up.
 *
 * `imageOrientation` applies the EXIF rotation a phone writes rather than
 * carrying it as metadata the canvas would ignore — without it a portrait taken
 * in landscape grip arrives on its side, and the reader has no control here
 * that could put it back.
 */
const decode = async (file: Blob): Promise<ImageBitmap> => {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      // Some browsers reject the options bag rather than ignoring what they do
      // not know. A picture the right way round beats no picture at all.
      return await createImageBitmap(file);
    } catch {
      // Every error this module throws is written to be shown to the reader, so
      // the browser's own wording does not escape into the interface.
      throw new Error('That file could not be read as an image.');
    }
  }
};

/**
 * Encoded, preferring WebP.
 *
 * A browser that cannot encode WebP does not fail: `toDataURL` quietly answers
 * with a PNG instead, so the format is read back off the result rather than
 * assumed. PNG is the right thing to fall back to — it is larger, and it keeps
 * the transparency that is the whole reason for not using JPEG.
 */
const encode = (canvas: HTMLCanvasElement, quality: number): string => {
  const webp = canvas.toDataURL(WEBP, quality);

  return webp.startsWith(`data:${WEBP}`) ? webp : canvas.toDataURL(PNG);
};

const render = (bitmap: ImageBitmap, scale: number, quality: number): DownscaledImage => {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not open a canvas to resize the image.');

  // The canvas starts transparent and stays that way where the source is, which
  // is what carries a signature's background through.
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);

  const dataUrl = encode(canvas, quality);

  return { dataUrl, width, height, bytes: dataUrl.length };
};

/**
 * The picture, resized and re-encoded to fit the budget.
 *
 * Walks down a fixed ladder and stops at the first rung that fits, so the
 * common case — a large photograph of an ordinary face — is one encode. If
 * nothing fits, the last rung is returned rather than an error: the reader
 * asked for their picture in their CV, and half a megabyte of it is a better
 * answer to that than a refusal they cannot act on.
 *
 * Throws only when the file is not a picture this browser can decode, or when
 * it is larger than `uploadBytes`, which is a mistake rather than a portrait.
 */
export const downscaleImage = async (file: Blob, budget: ImageBudget): Promise<DownscaledImage> => {
  if (file.size > budget.uploadBytes) {
    throw new Error(`Pick an image under ${Math.round(budget.uploadBytes / (1024 * 1024))} MB.`);
  }

  const bitmap = await decode(file);

  try {
    const fit = fitScale(bitmap.width, bitmap.height, budget.maxEdge);
    let result = render(bitmap, fit * IDEAL.edge, IDEAL.quality);

    for (const rung of FALLBACKS) {
      if (result.bytes <= budget.storedBytes) break;
      result = render(bitmap, fit * rung.edge, rung.quality);
    }

    return result;
  } finally {
    // Bitmaps hold decoded pixels outside the JS heap; a few unclosed portraits
    // is tens of megabytes the tab never gets back.
    bitmap.close();
  }
};
