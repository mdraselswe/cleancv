import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ATS_EXPORT_TEMPLATE_ID,
  PUA_PATTERN,
  REPLACEMENT_CHAR_PATTERN,
  isRecognisedHeading,
} from '@/constants';
import { customSlot } from '@/constants';
import { estimatePages } from '@/features/ats';
import { parseHeuristically } from '@/features/import';
import { createCustomSection, createSampleResume, getSectionHeading } from '@/features/resume';
import { getAvailableTemplates } from '@/features/templates';

import { documentFromPdf, extractPdfText, looseIncludes, looseIndexOf } from './helpers/pdfText';
import { requestPdf, startTestServer, type TestServer } from './helpers/server';

/**
 * The release gate.
 *
 * Every template renders the sample resume to a real PDF, and the assertions run
 * against the extracted text layer — what an ATS actually reads. A template that
 * fails here does not ship, however good it looks.
 */

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
}, 120_000);

afterAll(async () => {
  await server?.stop();
});

const templates = getAvailableTemplates();

/**
 * One render per template, shared by that template's assertions. Rendering per
 * assertion would mean forty-eight headless Chrome passes for no extra coverage.
 */
const renders = new Map<string, Awaited<ReturnType<typeof extractPdfText>>>();

describe.each(templates.map(({ meta }) => meta))('$name ($id)', (meta) => {
  const render = async () => {
    const cached = renders.get(meta.id);
    if (cached) return cached;

    const resume = createSampleResume();
    resume.meta.templateId = meta.id;
    Object.assign(resume.meta.theme, meta.defaultTheme);

    const extracted = extractPdfText(await requestPdf({ baseUrl: server.baseUrl, resume }));
    renders.set(meta.id, await extracted);

    return renders.get(meta.id)!;
  };

  it('is within a page of the content-based estimate', async () => {
    const { pageCount } = await render();

    // The estimate stands in for the measured page count wherever the preview is
    // not mounted, so a drift of more than a page means the length rule would
    // mislead exactly the reader who cannot see the preview.
    const resume = createSampleResume();
    resume.meta.templateId = meta.id;
    Object.assign(resume.meta.theme, meta.defaultTheme);

    expect(Math.abs(estimatePages(resume) - pageCount)).toBeLessThanOrEqual(1);
  }, 90_000);

  it('produces a text layer rather than an image', async () => {
    const { text } = await render();

    expect(text.length).toBeGreaterThan(800);
    expect(looseIncludes(text, 'Muhammad Rasel')).toBe(true);
  }, 90_000);

  it('contains no Private Use Area or replacement characters', async () => {
    const { text } = await render();

    // Icon fonts land here, and they take the surrounding text down with them.
    expect(PUA_PATTERN.test(text)).toBe(false);
    expect(REPLACEMENT_CHAR_PATTERN.test(text)).toBe(false);
  }, 90_000);

  it('keeps contact details intact', async () => {
    const { text } = await render();

    expect(looseIncludes(text, 'mdraselswe@gmail.com')).toBe(true);
    expect(looseIncludes(text, '+8801781182143')).toBe(true);
    expect(looseIncludes(text, 'linkedin.com/in/mdraselswe')).toBe(true);
  }, 90_000);

  it('uses section headings a parser recognises', async () => {
    const { text } = await render();
    const resume = createSampleResume();

    /*
     * The heading the document actually prints has to reach the text layer,
     * and it has to be one parsers match on. Asserting the *default* string
     * would be wrong: renaming "Work Experience" to "Professional Experience"
     * is not a defect, and the engine scores it as safe for the same reason.
     */
    for (const key of ['summary', 'experience', 'skills', 'education'] as const) {
      const heading = getSectionHeading(resume, key);

      expect(isRecognisedHeading(key, heading)).toBe(true);
      expect(looseIncludes(text, heading)).toBe(true);
    }
  }, 90_000);

  it('renders bullets as U+2022, not a substituted glyph', async () => {
    const { text } = await render();

    expect(text).toContain('•');
    expect(looseIncludes(text, 'Spearheaded Bohubrihi development')).toBe(true);
  }, 90_000);

  it('reads in reverse-chronological order', async () => {
    const { text } = await render();

    const newest = looseIndexOf(text, 'Shikho Technologies Bangladesh Ltd');
    const older = looseIndexOf(text, 'Shohoz Ltd.');
    const oldest = looseIndexOf(text, 'Shimahin Limited');

    expect(newest).toBeGreaterThan(-1);
    expect(older).toBeGreaterThan(newest);
    expect(oldest).toBeGreaterThan(older);
  }, 90_000);

  it('keeps each role next to its own bullets', async () => {
    const { text } = await render();

    // A bullet that belongs to Shikho must not surface after the next employer.
    const shikho = looseIndexOf(text, 'Shikho Technologies Bangladesh Ltd');
    const shikhoBullet = looseIndexOf(text, 'Mentored 3+ junior engineers');
    const grameen = looseIndexOf(text, 'Grameen Digital Health');

    expect(shikhoBullet).toBeGreaterThan(shikho);
    expect(shikhoBullet).toBeLessThan(grameen);
  }, 90_000);

  it('stays within a sensible page count', async () => {
    const { pageCount } = await render();

    expect(pageCount).toBeGreaterThan(0);
    expect(pageCount).toBeLessThanOrEqual(3);
  }, 90_000);
});

describe('ATS export mode', () => {
  it('renders through the plain template whatever design is selected', async () => {
    const resume = createSampleResume();
    resume.meta.templateId = 'classic-dc';

    const { text } = await extractPdfText(
      await requestPdf({ baseUrl: server.baseUrl, resume, mode: 'ats' }),
    );

    expect(looseIncludes(text, 'Muhammad Rasel')).toBe(true);
    expect(PUA_PATTERN.test(text)).toBe(false);
    // The plain template joins contact details with pipes.
    expect(text).toContain('|');
  }, 90_000);
});

describe('custom sections', () => {
  it("reaches the text layer in the user's chosen position", async () => {
    const resume = createSampleResume();
    const section = {
      ...createCustomSection(),
      heading: 'Open Source',
      bullets: ['Maintained a component library used by 12 teams.'],
    };
    resume.customSections = [section];

    // Directly after Skills, to prove a custom slot is ordered like any other.
    const order = resume.meta.sectionOrder.filter((slot) => slot !== customSlot(section.id));
    order.splice(order.indexOf('skills') + 1, 0, customSlot(section.id));
    resume.meta.sectionOrder = order;

    const { text } = await extractPdfText(await requestPdf({ baseUrl: server.baseUrl, resume }));

    expect(looseIncludes(text, 'Open Source')).toBe(true);
    expect(looseIncludes(text, 'Maintained a component library used by 12 teams.')).toBe(true);
    expect(PUA_PATTERN.test(text)).toBe(false);
    expect(REPLACEMENT_CHAR_PATTERN.test(text)).toBe(false);

    const skills = looseIndexOf(text, 'SKILLS');
    const custom = looseIndexOf(text, 'Open Source');
    const education = looseIndexOf(text, 'EDUCATION');

    expect(custom).toBeGreaterThan(skills);
    expect(custom).toBeLessThan(education);
  }, 90_000);
});

describe('round trip', () => {
  const imported = async (meta: (typeof templates)[number]['meta']) => {
    const resume = createSampleResume();
    resume.meta.templateId = meta.id;
    Object.assign(resume.meta.theme, meta.defaultTheme);

    const data = await requestPdf({ baseUrl: server.baseUrl, resume });

    return { resume, parsed: parseHeuristically(await documentFromPdf(data)) };
  };

  /**
   * Full structural recovery is asserted against the plain template only, and
   * that is not a lowered bar — it is the honest one.
   *
   * A grid-based design emits its text runs in build order, not reading order:
   * `classic-dc` puts `SKILLS` and `EDUCATION` next to each other in the PDF
   * and both bodies after them. No offline heuristic recovers the pairing from
   * that, because the pairing is not in the file. It is the same defect this
   * whole project exists to warn about, seen from the other side — and it is
   * why Smart import and the review screen exist.
   */
  it('recovers a plain CV completely', async () => {
    const plain = templates.find(({ meta }) => meta.id === ATS_EXPORT_TEMPLATE_ID)!.meta;
    const { resume, parsed } = await imported(plain);

    expect(parsed.basics?.fullName).toBe(resume.basics.fullName);
    expect(parsed.contact?.email).toBe(resume.contact.email);
    expect(parsed.summary?.text).toContain('Senior Frontend Engineer');

    expect(parsed.experience?.length).toBe(resume.experience.length);
    expect(parsed.experience?.[0].role).toBe(resume.experience[0].role);
    expect(parsed.experience?.[0].company).toBe(resume.experience[0].company);
    expect(parsed.experience?.[0].dates.start).toBe(resume.experience[0].dates.start);
    expect(parsed.experience?.[0].dates.current).toBe(true);
    expect(parsed.experience?.[0].bullets.length).toBe(resume.experience[0].bullets.length);

    expect(parsed.education?.[0].institute).toBe(resume.education[0].institute);
    expect(parsed.skills?.map((group) => group.category)).toEqual(
      resume.skills.map((group) => group.category),
    );
    // The printed proficiency comes back as data, not as part of the group name.
    expect(parsed.skills?.map((group) => group.level)).toEqual(
      resume.skills.map((group) => group.level),
    );
  }, 90_000);

  /**
   * What every design must still manage. Whoever the CV belongs to and how to
   * reach them is the part an import cannot be allowed to lose, whatever the
   * layout did to the rest.
   */
  describe.each(templates.map(({ meta }) => meta))('$name ($id)', (meta) => {
    it('recovers the person and their contact details', async () => {
      const { resume, parsed } = await imported(meta);

      expect(parsed.basics?.fullName).toBe(resume.basics.fullName);
      expect(parsed.contact?.email).toBe(resume.contact.email);
      expect(parsed.contact?.phone).toContain('1781182143');
      expect(parsed.summary?.text).toContain('Senior Frontend Engineer');
    }, 90_000);

    it('degrades without inventing anything', async () => {
      const { parsed } = await imported(meta);

      // A design this parser cannot follow must yield less, never something
      // made up: no entry may appear with neither a role nor a company.
      for (const entry of parsed.experience ?? []) {
        expect(entry.role || entry.company).toBeTruthy();
      }
      for (const entry of parsed.education ?? []) {
        expect(entry.degree || entry.institute).toBeTruthy();
      }
    }, 90_000);
  });
});
