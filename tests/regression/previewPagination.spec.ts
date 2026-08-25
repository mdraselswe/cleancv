import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BREAK_ANCHOR_SELECTOR } from '@/constants';
import { getAvailableTemplates } from '@/features/templates';

import { requestPdf, startTestServer, type TestServer } from './helpers/server';

/**
 * The downloaded file breaks its pages where the preview said it would.
 *
 * The preview cannot ask Chrome where it would break a page, so it measures the
 * same rules Chrome applies and works the breaks out itself; the export then
 * carries those breaks to the print route so the PDF reproduces them. Both
 * halves are checked here against a real render, because a disagreement is
 * invisible until someone opens the file. See ADR-020 and ADR-021.
 *
 * The breaks are not recomputed by this test. It captures the body the editor's
 * own Download button posts, so what is exercised is the production payload.
 */

let server: TestServer;
let browser: Browser;
let page: Page;

/** Records the editor's PDF requests and answers them, so nothing downloads. */
const CAPTURE_EXPORTS = `
  window.__exports = [];
  const original = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.includes('/api/pdf') && init && typeof init.body === 'string') {
      window.__exports.push(JSON.parse(init.body));
      return new Response('{}', { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    return original.apply(this, arguments);
  };
`;

beforeAll(async () => {
  server = await startTestServer();
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  page = await browser.newPage();
  await page.goto(server.baseUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
  await page.waitForSelector('.resume-root', { timeout: 30_000 });

  // A fresh profile boots an empty document; the sample is the shared fixture.
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(
      (element) => (element.textContent ?? '').trim() === 'Load the sample',
    );
    button?.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await page.evaluate(CAPTURE_EXPORTS);
}, 180_000);

afterAll(async () => {
  await browser?.close();
  await server?.stop();
});

interface PreviewState {
  pages: number;
  /** Text of the element the preview puts at the top of page two. */
  startsPage2: string | null;
}

const showTemplate = async (id: string): Promise<PreviewState> => {
  await page.evaluate((templateId) => {
    const select = document.querySelector('select');
    if (!select) return;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value',
    )?.set;
    setter?.call(select, templateId);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, id);
  await new Promise((resolve) => setTimeout(resolve, 2500));

  return page.evaluate((selector) => {
    const root = document.querySelector('.resume-root') as HTMLElement | null;
    if (!root) return { pages: 0, startsPage2: null };

    // Each sheet renders the whole document, shifted to its own page offset.
    const sheets = [...document.querySelectorAll('.resume-root')].map(
      (element) => element.parentElement?.parentElement as HTMLElement,
    );
    const offset = sheets[1]
      ? Math.abs(Number.parseFloat(sheets[1].style.transform.match(/-?[\d.]+/)?.[0] ?? '0'))
      : null;
    if (offset === null) return { pages: sheets.length, startsPage2: null };

    const box = root.getBoundingClientRect();
    const scale = root.offsetWidth > 0 ? box.width / root.offsetWidth : 1;
    const first = [...root.querySelectorAll<HTMLElement>(selector)]
      .map((element) => ({
        top: (element.getBoundingClientRect().top - box.top) / scale,
        text: (element.textContent ?? '').trim(),
      }))
      .filter((item) => item.top >= offset - 1)
      .sort((a, b) => a.top - b.top)[0];

    return { pages: sheets.length, startsPage2: first?.text ?? null };
  }, BREAK_ANCHOR_SELECTOR);
};

/** Clicks Download and returns the body the editor posted. */
const captureExport = async (): Promise<{ resume: unknown; pageBreaks: number[] }> => {
  await page.evaluate(() => {
    (window as unknown as { __exports: unknown[] }).__exports = [];
    const button = [...document.querySelectorAll('button')].find(
      (element) => (element.textContent ?? '').trim() === 'Download',
    );
    (button as HTMLButtonElement | undefined)?.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return page.evaluate(
    () =>
      (window as unknown as { __exports: { resume: unknown; pageBreaks: number[] }[] })
        .__exports[0],
  );
};

const pdfPages = async (data: Uint8Array): Promise<string[]> => {
  const task = getDocument({ data, useSystemFonts: true });
  const document = await task.promise;
  const pages: string[] = [];

  for (let number = 1; number <= document.numPages; number += 1) {
    const content = await (await document.getPage(number)).getTextContent();
    pages.push(
      content.items
        .filter((item): item is TextItem => 'str' in item && item.str.trim().length > 0)
        .map((item) => item.str)
        .join(' '),
    );
  }

  await task.destroy();

  return pages;
};

const flatten = (value: string) => value.replace(/[^a-z0-9]/gi, '').toLowerCase();

describe.each(getAvailableTemplates().map(({ meta }) => meta))('$name ($id)', (meta) => {
  it('breaks the downloaded pages where the preview did', async () => {
    const preview = await showTemplate(meta.id);
    const exported = await captureExport();

    expect(exported).toBeTruthy();

    const pages = await pdfPages(
      await requestPdf({
        baseUrl: server.baseUrl,
        resume: exported.resume,
        pageBreaks: exported.pageBreaks,
      }),
    );

    expect(preview.pages).toBe(pages.length);

    if (pages.length < 2) return;

    /*
     * Whatever the preview puts at the top of page two is what the PDF's page
     * two opens with. Compared on letters alone: the PDF's text layer spaces
     * runs differently from the DOM's, and neither spelling is the point.
     */
    expect(preview.startsPage2).toBeTruthy();
    expect(flatten(pages[1])).toMatch(new RegExp(`^${flatten(preview.startsPage2!).slice(0, 20)}`));
  }, 180_000);
});
