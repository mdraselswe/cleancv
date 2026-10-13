/** Storage keys, routes, and hard limits. */

export const APP_NAME = 'CleanCV';
export const APP_TAGLINE = 'Build a resume that people and parsers both read.';

/** Bump when a stored resume can no longer be read by the current schema. */
export const RESUME_SCHEMA_VERSION = 1;

/** Bump when the document library's own shape changes, not the resume's. */
export const LIBRARY_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  /**
   * The pre-library single-resume key. Only read now, once, to move that
   * resume into the library as the first document. See `migrateLegacyResume`.
   */
  legacyResume: 'cv-maker:resume',
  ui: 'cv-maker:ui',
  /** Bring-your-own endpoint config for smart import. Holds an API key. */
  smartImport: 'cv-maker:smart-import',
  /** Which account this browser's cloud-synced flags belong to. */
  cloudOwner: 'cv-maker:cloud-owner',
} as const;

/*
 * Everything below that still spells `cv-maker` is a stored or wire identifier,
 * not a name on screen: the IndexedDB database, the localStorage keys, the
 * backup file's `kind`, and the payload inside every PDF already exported.
 * Renaming any of them would orphan a reader's saved CVs and stop their own
 * downloaded files importing. The product is called CleanCV; the formats keep
 * the name they were written with. See ADR-030.
 */

/** IndexedDB keys owned by the document library. */
export const IDB_KEYS = {
  index: 'library:index',
  /** One entry per saved CV. */
  document: (id: string) => `doc:${id}`,
  documentPrefix: 'doc:',
  /** Directory handle for the folder the library mirrors itself into. */
  workspace: 'workspace:handle',
} as const;

/**
 * What the shortcut sheet lists.
 *
 * The single source: the sheet reads it, and so does anything that needs to
 * print a key next to an action. A shortcut nobody can discover is a shortcut
 * only its author has.
 */
export const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl + Z', action: 'Undo the last change' },
  { keys: 'Ctrl + Shift + Z', action: 'Redo' },
  { keys: 'Ctrl + S', action: 'Download the designed PDF' },
  { keys: 'Ctrl + K', action: 'Open My CVs' },
  { keys: '?', action: 'Show this list' },
  { keys: 'Esc', action: 'Close a panel or dialog' },
] as const;

/** How long after the last edit the active document is written to storage. */
export const AUTOSAVE_MS = 800;

/**
 * What an account may keep on the server.
 *
 * Everything else stays in the browser it was written in. The three numbers are
 * quoted on the home page, the features page, both legal documents and the
 * sync controls, all from here, so the promise and the enforcement are one
 * value. `maxBytes` bounds a single CV including its photograph — a stored
 * photo is at most ~120 KB (`IMAGE_BUDGET`), so a normal CV is far under it.
 */
export const CLOUD_SYNC = {
  maxDocuments: 3,
  maxBytes: 200 * 1024,
  /** After this long without activity an admin may remove an account's cloud copies. */
  inactiveMonths: 6,
} as const;

/** Documents a single browser profile may hold. Beyond this, listing gets unusable. */
export const MAX_DOCUMENTS = 50;

/**
 * What a named account may keep on the server instead of `CLOUD_SYNC`.
 *
 * Not infinite: a browser holds `MAX_DOCUMENTS`, so the count cannot pass that
 * anyway, and a size ceiling keeps one runaway document from being a problem
 * nobody planned for. Which accounts get this is a server setting, never the
 * client's say.
 */
export const CLOUD_SYNC_UNLIMITED = {
  maxDocuments: MAX_DOCUMENTS,
  maxBytes: 2 * 1024 * 1024,
} as const;

/** Upload ceiling for import. A CV past this is not a CV. */
export const IMPORT_MAX_BYTES = 12 * 1024 * 1024;

export const IMPORT_MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

/** File types the import picker offers. */
export const IMPORT_ACCEPT = `${IMPORT_MIME.pdf},${IMPORT_MIME.docx},image/*`;

/**
 * PDF renders allowed per account in one window. The render is a real
 * browser and expensive, so this is the one fair-use limit the app has — and
 * the home and features pages quote it from here rather than from memory.
 */
export const PDF_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  /** Per signed-in account. */
  max: 20,
  /**
   * Per network address, across every account on it. Well above `max` so a
   * household or a campus on one address is untouched; it exists to stop one
   * address spinning up accounts to get around the per-account limit.
   */
  maxPerAddress: 80,
} as const;

export const ROUTES = {
  /** What the app includes, and what it does not. */
  features: '/features',
  /** The landing page and the reader's list of CVs. */
  home: '/',
  /** The editor itself. Sign-in sends the reader back here. */
  editor: '/editor',
  print: '/print',
  api: {
    pdf: '/api/pdf',
    /** Proxies a smart-import request to whatever endpoint the user configured. */
    importParse: '/api/import',
  },
} as const;

/** Sign-in routes live in `constants/auth.ts`, next to the rest of the auth vocabulary. */

export const LIMITS = {
  bulletsPerEntry: 12,
  entriesPerSection: 30,
  skillGroups: 12,
  skillsPerGroup: 40,
  customLinks: 8,
  /**
   * The largest image a *saved document* may carry, in bytes.
   *
   * This is a ceiling on what may be loaded, not a target for what is produced
   * — `IMAGE_BUDGET` decides that, and aims far below it. The two are separate
   * numbers on purpose: the schema drops an over-long data URL to `''`, so
   * lowering this would quietly delete the photograph out of every document
   * saved before the day it changed.
   */
  imageBytes: 500 * 1024,
  nameChars: 80,
  headlineChars: 120,
  summaryChars: 800,
  bulletChars: 300,
} as const;

/**
 * How far an upload is squeezed before it enters the document.
 *
 * `maxEdge` is set from what the paper actually asks for: a portrait frame is
 * around 30mm wide, which is 354 pixels at the 300 DPI a printer wants, so 512
 * leaves headroom for the designs that draw it larger and for a reader who
 * zooms into the frame. Anything above that is detail no output can show.
 *
 * `storedBytes` is a budget a 512px WebP comfortably fits, so the quality
 * ladder in `downscaleImage` only engages for the unusual picture and the
 * ordinary one is encoded once. Measured rather than guessed: an 8.8 MB
 * 4032×3024 source of pure noise — which compresses worse than any photograph
 * of a face — came out at 87 KB, and a signature at 5 KB.
 */
export const IMAGE_BUDGET = {
  uploadBytes: 12 * 1024 * 1024,
  maxEdge: 512,
  storedBytes: 120 * 1024,
} as const;

export const DEBOUNCE_MS = {
  autosave: 600,
  atsScore: 400,
  preview: 120,
} as const;

export const PAGE_SIZE_MM = { width: 210, height: 297 } as const;

/**
 * CSS pixels per millimetre, exactly as the CSS spec defines them: 96 pixels to
 * the inch, 25.4 millimetres to the inch.
 *
 * Not rounded. The preview paints the sheet and its margins from this number
 * while Chrome lays the PDF out from its own, so any rounding here makes the
 * two content columns different widths — 794px against Chrome's 793.7 is a
 * quarter of a pixel, which is invisible until one line of one paragraph wraps
 * differently and everything below it moves down by a line. See ADR-020.
 */
export const PX_PER_MM = 96 / 25.4;

/** A4 at 96 CSS pixels per inch: 793.70 x 1122.52. */
export const PAGE_SIZE_PX = {
  width: PAGE_SIZE_MM.width * PX_PER_MM,
  height: PAGE_SIZE_MM.height * PX_PER_MM,
} as const;

export const MM_PER_PX = 1 / PX_PER_MM;

export const ZOOM = { min: 0.4, max: 1.6, step: 0.1, default: 0.75 } as const;

/**
 * Elements Chrome is told to keep whole, so one that would straddle a page
 * boundary starts the next page instead. Kept in step with the
 * `break-inside: avoid` rules in `styles/resume.css`.
 */
export const UNBREAKABLE_SELECTOR = '.rz-entry, .rz-avoid-break, .rz-bullet, .rz-skills__group';

/** Headings carry `break-after: avoid`: one cannot be the last thing on a page. */
export const HEADING_SELECTOR = '.rz-heading';

/**
 * Everything a page is allowed to begin with, in one selector.
 *
 * The preview and the print route render the same components in the same order,
 * so the nth match is the same element in both — which is what lets a break
 * measured in the preview be reproduced in the PDF. See ADR-021.
 */
export const BREAK_ANCHOR_SELECTOR = `${UNBREAKABLE_SELECTOR}, ${HEADING_SELECTOR}`;

export const UNDO_HISTORY_LIMIT = 50;

/**
 * The resume carried inside an exported PDF.
 *
 * `name` is what a reader sees if they open the PDF's attachment list, so it
 * says what it is. `app` marks the payload as ours before anything parses it.
 * See ADR-023.
 */
export const RESUME_PAYLOAD = {
  app: 'cv-maker',
  name: 'cv-maker-resume.json.gz',
  description: 'The editable CV data behind this PDF. Import it into CleanCV to restore it.',
} as const;
