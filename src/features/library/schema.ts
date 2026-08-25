import { z } from 'zod';

import { LIBRARY_SCHEMA_VERSION } from '@/constants';
import { resumeSchema } from '@/features/resume';

/**
 * A saved CV and the handful of facts the library list needs about it.
 *
 * `personName` is stored separately from the resume's own `basics.fullName`
 * because a document can be started, named and set aside before anyone has
 * typed a name into it — and because someone building CVs for other people
 * needs to tell six untitled drafts apart.
 */
export const documentMetaSchema = z.object({
  id: z.string().min(1),
  /** What the user calls this document, e.g. "Backend — Shopify application". */
  name: z.string().trim().max(120).catch('').default(''),
  /** Whose CV this is. Falls back to the resume's own name when blank. */
  personName: z.string().trim().max(120).catch('').default(''),
  createdAt: z.number().int().catch(0).default(0),
  updatedAt: z.number().int().catch(0).default(0),
});

export const cvDocumentSchema = z.object({
  meta: documentMetaSchema,
  resume: resumeSchema,
});

/** What the library index holds: metadata only, so listing never loads a photo. */
export const libraryIndexSchema = z.object({
  version: z.number().int().catch(LIBRARY_SCHEMA_VERSION).default(LIBRARY_SCHEMA_VERSION),
  activeId: z.string().catch('').default(''),
  documents: z.array(documentMetaSchema).catch([]).default([]),
});

/** The shape of a full backup file: every document in one export. */
export const backupFileSchema = z.object({
  kind: z.literal('cv-maker.backup').catch('cv-maker.backup').default('cv-maker.backup'),
  version: z.number().int().catch(LIBRARY_SCHEMA_VERSION).default(LIBRARY_SCHEMA_VERSION),
  exportedAt: z.number().int().catch(0).default(0),
  documents: z.array(cvDocumentSchema).catch([]).default([]),
});

export type DocumentMeta = z.infer<typeof documentMetaSchema>;
export type CvDocument = z.infer<typeof cvDocumentSchema>;
export type LibraryIndex = z.infer<typeof libraryIndexSchema>;
export type BackupFile = z.infer<typeof backupFileSchema>;
