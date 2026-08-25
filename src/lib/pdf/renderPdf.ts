import type { Browser, PDFOptions } from 'puppeteer-core';

import { BREAK_ANCHOR_SELECTOR, ROUTES } from '@/constants';

/**
 * Headless Chrome rendering.
 *
 * The PDF comes from the same React components and the same stylesheet the user
 * sees in the preview, so the two cannot drift — and, unlike a canvas-based
 * export, it carries a real text layer. See ADR-001.
 *
 * The browser loads an empty shell from this app, which brings the stylesheets
 * and font faces with it, and the resume markup is then injected into that
 * page. Nothing is passed between routes, which is what lets this work where
 * each route runs as its own instance. See ADR-029.
 */

let browserPromise: Promise<Browser> | null = null;

/**
 * Chrome, wherever it happens to live.
 *
 * A serverless bundle has no Chrome in it and no room to download one, so the
 * deployed build uses a Lambda-sized build of Chromium; a developer's machine
 * has the full browser puppeteer installs. Both drive the same `puppeteer-core`
 * API, so only the binary and its flags differ.
 */
const launch = async (): Promise<Browser> => {
  const puppeteer = (await import('puppeteer-core')).default;

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;

    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Browser;
  }

  // The full `puppeteer` package is a dev dependency, and it knows where it put
  // the browser it downloaded.
  const local = await import('puppeteer');

  return puppeteer.launch({
    headless: true,
    executablePath: await local.default.executablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  }) as unknown as Browser;
};

/** One browser per process, reused across requests; relaunched if it dies. */
const getBrowser = async (): Promise<Browser> => {
  if (!browserPromise) browserPromise = launch();

  const browser = await browserPromise;
  if (browser.connected) return browser;

  browserPromise = launch();

  return browserPromise;
};

export const closeBrowser = async (): Promise<void> => {
  if (!browserPromise) return;

  const browser = await browserPromise;
  browserPromise = null;
  await browser.close();
};

export interface RenderPdfOptions {
  /** Where this app is served from, so the shell brings its own styles. */
  origin: string;
  /** The resume, already rendered to markup. */
  markup: string;
  /** Page margin in millimetres, from the resume theme. */
  marginMm: number;
  /** Indices of the elements each page after the first should start at. */
  pageBreaks?: number[];
  /** Milliseconds to wait for the shell to settle. */
  timeout?: number;
}

/**
 * Margins are applied here rather than as CSS padding on the document, so every
 * page gets them — padding on a continuous flow only indents the first and last.
 */
const pdfOptions = (marginMm: number): PDFOptions => {
  const margin = `${marginMm}mm`;

  return {
    format: 'a4',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: margin, right: margin, bottom: margin, left: margin },
  };
};

export const renderPdf = async ({
  origin,
  markup,
  marginMm,
  pageBreaks = [],
  timeout = 30_000,
}: RenderPdfOptions): Promise<Uint8Array> => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.emulateMediaType('print');
    await page.goto(`${origin}${ROUTES.print}`, { waitUntil: 'networkidle0', timeout });

    await page.evaluate(
      (html: string, selector: string, breaks: number[]) => {
        document.body.innerHTML = html;

        /*
         * The breaks the reader was shown, reproduced rather than predicted:
         * Chrome's print pass measures text about two parts in a thousand
         * narrower than the screen layout does, so a line sitting within a pixel
         * of the column edge wraps in one and not the other. See ADR-021.
         */
        const anchors = document.querySelectorAll<HTMLElement>(selector);
        for (const index of breaks) anchors[index]?.style.setProperty('break-before', 'page');
      },
      markup,
      BREAK_ANCHOR_SELECTOR,
      pageBreaks,
    );

    // Web fonts must be resolved before layout is measured, or metrics shift —
    // and the injected markup may be the first thing to ask for some of them.
    await page.evaluate(() => document.fonts.ready);

    return await page.pdf(pdfOptions(marginMm));
  } finally {
    await page.close();
  }
};
