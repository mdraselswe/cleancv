import { createElement } from 'react';

import { ATS_EXPORT_TEMPLATE_ID, SIGN_IN_REQUIRED, type TemplateId } from '@/constants';
import { normalizeResume } from '@/features/resume';
import { getTemplate, resolvePageBleed } from '@/features/templates';
import { attachResume } from '@/lib/pdf/attachResume';
import { renderPdf } from '@/lib/pdf/renderPdf';
import { toFileStem } from '@/lib/text';
import { getSessionUser } from '@/server/auth/session';
import { isAuthConfigured, isProduction } from '@/server/env';

/**
 * POST a resume, get a PDF back.
 *
 * `mode: 'ats'` renders the same data through the plain single-column template
 * instead of the chosen design, which is how one document produces both a
 * presentable PDF and a portal-safe one. See ADR-002.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface PdfRequestBody {
  resume?: unknown;
  mode?: 'design' | 'ats';
  /** Break points measured by the preview. See ADR-021. */
  pageBreaks?: unknown;
}

/**
 * Indices of the elements each page should start at.
 *
 * Sanitised rather than trusted: this arrives from the client and ends up in a
 * selector loop against the rendered document, so anything that is not a small
 * non-negative integer is dropped. A malformed list costs a PDF that Chrome
 * paginates itself, which is the same as not sending one.
 */
const readPageBreaks = (value: unknown): number[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((n): n is number => Number.isInteger(n) && n > 0 && n < 5000))]
        .sort((a, b) => a - b)
        .slice(0, 50)
    : [];

const badRequest = (message: string) => Response.json({ error: message }, { status: 400 });

/**
 * The gate.
 *
 * Here rather than on the button, because a hidden button is a suggestion. The
 * request that renders the PDF is the thing worth an account, and this is the
 * only place that request is served — so this is the only place the check
 * belongs. Everything else the app does stays open. See ADR-048.
 *
 * A deployment with no auth configured is refused rather than waved through:
 * in development that is a machine with no database, and the gate opens; in
 * production it is a misconfiguration, and opening would quietly turn the gate
 * off for everyone.
 */
const requireDownloadAccess = async (request: Request): Promise<Response | null> => {
  if (!isAuthConfigured()) {
    if (!isProduction()) return null;

    return Response.json(
      { error: 'Downloads are unavailable: this deployment has no auth configured.' },
      { status: 503 },
    );
  }

  /*
   * "Nobody is signed in" and "the session could not be checked" are different
   * answers and get different ones back. Reporting a database outage as
   * `sign_in_required` would send somebody who *is* signed in to a sign-in page
   * that works, to come back and be refused again.
   */
  let user: Awaited<ReturnType<typeof getSessionUser>>;

  try {
    /*
     * From the database, not from the cached copy in the cookie. This is the
     * one check in the app that gates work rather than decorating a menu, and
     * a revoked session must stop working the moment it is revoked.
     */
    user = await getSessionUser(request.headers, { fresh: true });
  } catch (error) {
    console.error('[pdf] session lookup failed', error);

    return Response.json(
      { error: 'Could not check your sign-in just now. Try again in a moment.' },
      { status: 503 },
    );
  }

  if (user) return null;

  return Response.json(
    { error: SIGN_IN_REQUIRED.message, code: SIGN_IN_REQUIRED.code },
    { status: 401 },
  );
};

export async function POST(request: Request) {
  const denied = await requireDownloadAccess(request);
  if (denied) return denied;

  let body: PdfRequestBody;

  try {
    body = (await request.json()) as PdfRequestBody;
  } catch {
    return badRequest('Request body must be JSON.');
  }

  if (!body.resume || typeof body.resume !== 'object') {
    return badRequest('Missing resume payload.');
  }

  const resume = normalizeResume(body.resume);
  const mode = body.mode === 'ats' ? 'ats' : 'design';
  const templateId: TemplateId = mode === 'ats' ? ATS_EXPORT_TEMPLATE_ID : resume.meta.templateId;

  // The ATS export renders through a different template, so breaks measured
  // against the design on screen do not describe it.
  const pageBreaks = mode === 'ats' ? [] : readPageBreaks(body.pageBreaks);

  /*
   * Rendered here, in the same instance that drives the browser, and injected
   * into the print shell. Nothing is handed between routes, because on a
   * serverless deployment there is nothing to hand it through. See ADR-029.
   */
  const { Template, meta: templateMeta } = getTemplate(templateId);
  /*
   * Imported here rather than at the top: the App Router refuses a static
   * `react-dom/server` import, on the assumption that anything reaching for it
   * is a component that should have been a server component. This is a route
   * handler producing a string for a browser to swallow, which is the one case
   * the rule is not about.
   */
  const { renderToStaticMarkup } = await import('react-dom/server');
  const markup = renderToStaticMarkup(createElement(Template, { resume, print: true }));

  // Puppeteer talks to this same app, so the request's own origin is the right
  // base — no env var to keep in sync across environments.
  const origin = new URL(request.url).origin;

  try {
    const rendered = await renderPdf({
      origin,
      markup,
      marginMm: resume.meta.theme.marginMm,
      pageBreaks,
      // The band the preview painted on its sheets. See ADR-036.
      pageBleed: resolvePageBleed(resume.meta.theme, templateMeta),
    });
    /*
     * The document travels inside its own PDF, so importing this file back is a
     * read rather than a guess — including on a machine that has never seen it.
     * Both exports carry it: the ATS one is the file most likely to be the only
     * copy someone kept. See ADR-023.
     */
    const pdf = await attachResume(rendered, resume);
    const stem = toFileStem(resume.meta.documentName || resume.basics.fullName || 'resume');
    const filename = mode === 'ats' ? `${stem}-ATS.pdf` : `${stem}.pdf`;

    return new Response(pdf as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[pdf] render failed', error);

    return Response.json(
      {
        error:
          'Could not render the PDF. If this is a fresh install, run `npm run chrome` to download the browser puppeteer needs.',
      },
      { status: 500 },
    );
  }
}
