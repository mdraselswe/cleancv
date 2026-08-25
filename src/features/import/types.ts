import type { Resume } from '@/features/resume';

/**
 * Bringing an existing CV in.
 *
 * Two stages, kept apart on purpose. *Extraction* turns a file into text and is
 * a solved problem — pdf.js, mammoth and tesseract all do it offline for free.
 * *Structuring* decides which line is a job title and which is a company, and
 * that is where a heuristic strains and a model earns its keep. Splitting them
 * means the expensive half is swappable and the free half always works.
 */

export type SourceKind = 'pdf' | 'docx' | 'image';

/** A line of the original document, with enough geometry to order it sanely. */
export interface TextLine {
  text: string;
  /** Distance from the top of the page, in the source's own units. */
  y: number;
  /** Left edge, used to spot a two-column layout. */
  x: number;
  page: number;
  /** Largest glyph height on the line; the name is usually the biggest text. */
  size: number;
}

export interface ExtractedDocument {
  kind: SourceKind;
  lines: TextLine[];
  /** Lines joined in reading order. What a parser without geometry would see. */
  text: string;
  pageCount: number;
  /** Set when the source carried no usable text layer, e.g. a scanned PDF. */
  empty: boolean;
  /**
   * The document this file was made from, when the file carried it.
   *
   * A PDF this app exported has the resume attached to it, and reading that is
   * part of what the file legibly contains — the same step that turns a file
   * into text reports it. Unvalidated here: `normalizeResume` owns that. See
   * ADR-023.
   */
  embedded?: unknown;
}

/** A value the parser found, and how sure it is that the value is right. */
export interface ParsedField<T> {
  value: T;
  /** 0–1. Drives the ordering and the wording of the review screen. */
  confidence: number;
  /** The line the value came from, so the reviewer can judge it. */
  evidence?: string;
}

/**
 * The parser's output.
 *
 * A partial resume rather than a whole one: everything it did not find stays
 * absent, and the review screen leaves those fields untouched instead of
 * writing blanks over what the user already has.
 */
export interface ParsedResume {
  basics?: Partial<Resume['basics']>;
  contact?: Partial<Resume['contact']>;
  summary?: Partial<Resume['summary']>;
  experience?: Resume['experience'];
  education?: Resume['education'];
  skills?: Resume['skills'];
  projects?: Resume['projects'];
  certifications?: Resume['certifications'];
  languages?: Resume['languages'];
}

export type ImportProviderId = 'offline' | 'smart';

export interface ImportResult {
  provider: ImportProviderId;
  parsed: ParsedResume;
  extracted: ExtractedDocument;
  /** Non-fatal problems worth showing, e.g. "this PDF looks two-column". */
  warnings: string[];
}

/**
 * A file that carried the whole document, so there is nothing to review.
 *
 * Kept apart from `ImportResult` because a parse produces a *partial* resume —
 * the fields it managed to find — and merging one over a document is the right
 * shape for that. This is a whole document, including the sections, the theme
 * and the section order that a parse cannot even represent. Applying it as a
 * merge would quietly drop most of it. See ADR-023.
 */
export interface RestoreResult {
  resume: Resume;
  /** File it came out of, for the confirmation line. */
  filename: string;
}

export type ImportStage = 'idle' | 'extracting' | 'parsing' | 'review' | 'restore' | 'error';
