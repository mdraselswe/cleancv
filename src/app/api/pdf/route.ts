import { createElement } from 'react';
import { eq } from 'drizzle-orm';

import {
  ATS_EXPORT_TEMPLATE_ID,
  PDF_RATE_LIMIT,
  SIGN_IN_REQUIRED,
  type TemplateId,
} from '@/constants';
import { normalizeResume, withoutHiddenEntries } from '@/features/resume';
import { getTemplate, resolvePageBleed } from '@/features/templates';
import { attachResume } from '@/lib/pdf/attachResume';
import { renderPdf } from '@/lib/pdf/renderPdf';
import { toFileStem } from '@/lib/text';
import { db } from '@/server/db';
import { rateLimit } from '@/server/db/schema';
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
 * only place that request is served. See ADR-048.
 *
 * A deployment with no auth configured is refused rather than waved through:
 * in development that is a machine with no database, and the gate opens; in
 * production it is a misconfiguration, and opening would quietly turn the gate
 * off for everyone.
 */
interface Access {
  /** Set when the request is refused. */
  denied: Response | null;
  /** Who is downloading; empty where auth is switched off (development). */
  userId: string;
}

const requireDownloadAccess = async (request: Request): Promise<Access> => {
  if (!isAuthConfigured()) {
    if (!isProduction()) return { denied: null, userId: '' };

    return {
      denied: Response.json(
        { error: 'ডাউনলোড এখন বন্ধ: এই ডেপ্লয়মেন্টে সাইন-ইন সেট করা নেই।' },
        { status: 503 },
      ),
      userId: '',
    };
  }

  /*
   * "Nobody is signed in" and "the session could not be checked" are different
   * answers and get different ones back. Reporting a database outage as
   * `sign_in_required` would send somebody who *is* signed in to a sign-in page
   * that works, to come back and be refused again.
   */
  let user: Awaited<ReturnType<typeof getSessionUser>>;

  try {
    // From the database, not the cookie's cached copy: this check gates work,
    // and a revoked session must stop working the moment it is revoked.
    user = await getSessionUser(request.headers, { fresh: true });
  } catch (error) {
    console.error('[pdf] session lookup failed', error);

    return {
      denied: Response.json(
        { error: 'এখন আপনার সাইন-ইন যাচাই করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।' },
        { status: 503 },
      ),
      userId: '',
    };
  }

  if (user) return { denied: null, userId: user.id };

  return {
    denied: Response.json(
      { error: SIGN_IN_REQUIRED.message, code: SIGN_IN_REQUIRED.code },
      { status: 401 },
    ),
    userId: '',
  };
};

/**
 * Spends one render from a counter, or says how long until there is room.
 *
 * In the database because every serverless invocation has its own memory, so an
 * in-process counter would restart at zero often enough to be no limit at all.
 */
const spend = async (key: string, max: number): Promise<number | null> => {
  const now = Date.now();
  const { windowMs } = PDF_RATE_LIMIT;

  const existing = await db().query.rateLimit.findFirst({ where: eq(rateLimit.key, key) });
  const inside = existing && now - existing.lastRequest < windowMs;

  if (inside && existing.count >= max) {
    return Math.ceil((windowMs - (now - existing.lastRequest)) / 1000);
  }

  await db()
    .insert(rateLimit)
    .values({ id: key, key, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: { count: inside ? existing.count + 1 : 1, lastRequest: inside ? existing.lastRequest : now },
    });

  return null;
};

const tooMany = (message: string, retryAfter: number) =>
  Response.json(
    { error: message, code: 'rate_limited' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );

/**
 * Keeps the headless-browser endpoint useful without leaving it unbounded.
 *
 * Counted per account first — a shared network is not one person — and per
 * address second, at a higher ceiling, so many accounts from one place cannot
 * be used to get round it. The window is fixed from its first request rather
 * than sliding, which is what lets a waiting reader be told an honest time.
 */
const checkPdfRateLimit = async (request: Request, userId: string): Promise<Response | null> => {
  if (!isAuthConfigured()) return null;

  const address =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip');

  try {
    if (userId) {
      const wait = await spend(`pdf:user:${userId}`, PDF_RATE_LIMIT.max);

      if (wait !== null) {
        return tooMany(
          `আপনি ${PDF_RATE_LIMIT.windowMs / 60000} মিনিটে ${PDF_RATE_LIMIT.max}টি PDF বানিয়েছেন। প্রায় ${Math.ceil(wait / 60)} মিনিট পরে আবার চেষ্টা করুন।`,
          wait,
        );
      }
    }

    if (address) {
      const wait = await spend(`pdf:${address}`, PDF_RATE_LIMIT.maxPerAddress);

      if (wait !== null) {
        return tooMany(
          'এই নেটওয়ার্ক থেকে অনেক বেশি PDF বানানো হয়েছে। কয়েক মিনিট পরে আবার চেষ্টা করুন।',
          wait,
        );
      }
    }
  } catch (error) {
    // PDF export remains available if the optional account database is down.
    console.error('[pdf] rate-limit lookup failed', error);
  }

  return null;
};

export async function POST(request: Request) {
  const { denied, userId } = await requireDownloadAccess(request);
  if (denied) return denied;

  const limited = await checkPdfRateLimit(request, userId);
  if (limited) return limited;

  let body: PdfRequestBody;

  try {
    body = (await request.json()) as PdfRequestBody;
  } catch {
    return badRequest('অনুরোধের ডেটা অবশ্যই JSON হতে হবে।');
  }

  if (!body.resume || typeof body.resume !== 'object') {
    return badRequest('CV-র তথ্য পাওয়া যায়নি।');
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
  // Puppeteer talks to this same app, so the request's own origin is the right
  // base — no env var to keep in sync across environments.
  const origin = new URL(request.url).origin;

  try {
    /*
     * Inside the try: a template that throws on somebody's data used to escape
     * as a bare 500 with no body, which the client can only report as "the
     * server could not render the PDF". Answering in JSON gives it a message.
     */
    const { renderToStaticMarkup } = await import('react-dom/server');
    const markup = renderToStaticMarkup(
      createElement(Template, { resume: withoutHiddenEntries(resume), print: true }),
    );

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
        // The plain form is for old clients and must be ASCII; the starred one carries the real name.
        'Content-Disposition': `attachment; filename="${filename.replace(/[^ -~]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[pdf] render failed', error);

    return Response.json(
      {
        error:
          'PDF তৈরি করা যায়নি। নতুন ইনস্টল হলে puppeteer-এর ব্রাউজার ডাউনলোড করতে `npm run chrome` চালান।',
      },
      { status: 500 },
    );
  }
}
