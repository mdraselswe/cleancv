import { getAvailableTemplates } from '@/features/templates';

/**
 * The headless render target.
 *
 * An empty shell, on purpose. What it provides is a document with the app's own
 * stylesheets and font faces already loaded and resolved; the resume itself is
 * rendered by the PDF route and injected into this body.
 *
 * That split is what makes the export work on a platform that runs each route
 * as its own instance. The old design handed the resume from the PDF route to
 * this page through an in-memory map, which holds only while both run in one
 * process — true of `next dev` and `next start`, and false of every serverless
 * deployment, where this page is a different instance that would find the map
 * empty. Nothing is handed over now. See ADR-029.
 */

export const dynamic = 'force-dynamic';

/*
 * Every design's stylesheet has to ship with this route, because the markup
 * injected later could be any of them. Reading the registry is what keeps the
 * imports — and so the CSS — from being shaken out of a page that renders none
 * of them itself.
 */
const DESIGN_COUNT = getAvailableTemplates().length;

export default function PrintPage() {
  return <div data-designs={DESIGN_COUNT} />;
}
