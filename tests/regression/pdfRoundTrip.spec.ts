import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createCustomSection, createSampleResume, normalizeResume } from '@/features/resume';
import { readEmbeddedResume, type PdfLike } from '@/features/import';
import { getAvailableTemplates } from '@/features/templates';

import { requestPdf, startTestServer, type TestServer } from './helpers/server';

/**
 * A CV this app exported comes back into it exactly.
 *
 * Reading a generated PDF back off the page cannot work for every design: a
 * two-column layout emits its runs in build order, so the pairing between a
 * heading and its body is not in the file at all. The document is therefore
 * attached to the PDF, and this asserts the whole loop — export, attach, read,
 * normalise — against a real render, on every template. See ADR-023.
 */

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
}, 180_000);

afterAll(async () => {
  await server?.stop();
});

const restored = async (data: Uint8Array): Promise<unknown | null> => {
  const task = getDocument({ data, useSystemFonts: true });
  const document = await task.promise;

  try {
    return await readEmbeddedResume(document as unknown as PdfLike);
  } finally {
    await task.destroy();
  }
};

describe.each(getAvailableTemplates().map(({ meta }) => meta))('$name ($id)', (meta) => {
  it('carries its own resume, byte for byte', async () => {
    const resume = createSampleResume();
    resume.meta.templateId = meta.id;
    Object.assign(resume.meta.theme, meta.defaultTheme);

    const sent = normalizeResume(resume);
    const back = await restored(await requestPdf({ baseUrl: server.baseUrl, resume: sent }));

    expect(back).not.toBeNull();
    expect(normalizeResume(back)).toEqual(sent);
  }, 120_000);
});

describe('what a parse could never recover', () => {
  it('brings back the parts a ParsedResume has no room for', async () => {
    const resume = createSampleResume();
    resume.customSections = [
      { ...createCustomSection(), heading: 'Military Service', layout: 'paragraph', text: 'Two years.' },
    ];
    resume.meta.sectionOrder = ['contact', 'skills', 'summary', ...resume.meta.sectionOrder.slice(3)];
    resume.meta.theme.accent = '#8b1d3f';
    resume.meta.sections.education = { ...resume.meta.sections.education!, showIcons: false };
    resume.declaration.showDate = false;

    const sent = normalizeResume(resume);
    const back = normalizeResume(await restored(await requestPdf({ baseUrl: server.baseUrl, resume: sent })));

    // The heuristic path models none of these: they are not on the page as
    // anything a parser could name.
    expect(back.customSections[0]?.heading).toBe('Military Service');
    expect(back.meta.sectionOrder).toEqual(sent.meta.sectionOrder);
    expect(back.meta.theme.accent).toBe('#8b1d3f');
    expect(back.meta.sections.education?.showIcons).toBe(false);
    expect(back.declaration.showDate).toBe(false);
    expect(back).toEqual(sent);
  }, 120_000);
});
