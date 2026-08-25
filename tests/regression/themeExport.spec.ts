import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

import { FONT_SCALE } from '@/constants';
import { createSampleResume } from '@/features/resume';

import { requestPdf, startTestServer, type TestServer } from './helpers/server';

/**
 * The Design panel reaches the export.
 *
 * A theme control that moves the preview but not the PDF is invisible until
 * someone opens the downloaded file, and indistinguishable from the control
 * being ignored. The preview and the export share one component, so the risk is
 * not that they render differently — it is that a value is lost on the way to
 * the server, or that the range is too narrow for the change to be legible.
 * This measures the glyphs the PDF actually carries.
 */

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
}, 120_000);

afterAll(async () => {
  await server?.stop();
});

/** Median height of the text runs in a PDF, in points. */
const medianGlyphHeight = async (data: Uint8Array): Promise<number> => {
  const task = getDocument({ data, useSystemFonts: true });
  const document = await task.promise;
  const heights: number[] = [];

  for (let page = 1; page <= document.numPages; page += 1) {
    const content = await (await document.getPage(page)).getTextContent();

    for (const item of content.items) {
      if ('str' in item && (item as TextItem).str.trim()) heights.push((item as TextItem).height);
    }
  }

  await task.destroy();
  heights.sort((a, b) => a - b);

  return heights[Math.floor(heights.length / 2)] ?? 0;
};

const atScale = (fontScale: number) => {
  const resume = createSampleResume();
  resume.meta.theme.fontScale = fontScale;

  return resume;
};

describe('text size', () => {
  it.each(['design', 'ats'] as const)('scales the %s PDF across the slider range', async (mode) => {
    const smallest = await medianGlyphHeight(
      await requestPdf({ baseUrl: server.baseUrl, resume: atScale(FONT_SCALE.min), mode }),
    );
    const largest = await medianGlyphHeight(
      await requestPdf({ baseUrl: server.baseUrl, resume: atScale(FONT_SCALE.max), mode }),
    );

    // The two ends must differ by enough that a reader can see it on paper —
    // roughly a point and a half of body text at the sizes the templates use.
    expect(largest - smallest).toBeGreaterThan(1.5);
    expect(largest / smallest).toBeCloseTo(FONT_SCALE.max / FONT_SCALE.min, 1);
  }, 120_000);
});
