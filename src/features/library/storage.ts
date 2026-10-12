import { IDB_KEYS, LIBRARY_SCHEMA_VERSION, STORAGE_KEYS } from '@/constants';
import { normalizeResume, type Resume } from '@/features/resume';
import { createId } from '@/lib/id';
import { idbDelete, idbGet, idbKeys, idbSet } from '@/lib/idb';

import {
  cvDocumentSchema,
  libraryIndexSchema,
  type CvDocument,
  type DocumentMeta,
  type LibraryIndex,
} from './schema';

/**
 * Reading and writing the document library.
 *
 * The index holds metadata only, so listing fifty CVs never loads fifty photos.
 * Each document lives under its own key, which also means one corrupt document
 * cannot take the whole library down with it.
 */

const emptyIndex = (): LibraryIndex => ({
  version: LIBRARY_SCHEMA_VERSION,
  activeId: '',
  documents: [],
  deleted: [],
});

export const createDocument = (resume: Resume, name = ''): CvDocument => {
  const now = Date.now();

  return {
    meta: {
      id: createId('cv'),
      name,
      personName: resume.basics.fullName,
      createdAt: now,
      updatedAt: now,
      cloud: false,
    },
    resume,
  };
};

/**
 * The index, repaired from the document keys when it is missing or behind.
 *
 * A crash between writing a document and writing the index would otherwise
 * strand that document: present in storage, invisible in the list.
 */
export const readIndex = async (): Promise<LibraryIndex> => {
  const parsed = libraryIndexSchema.safeParse(await idbGet(IDB_KEYS.index));
  const index = parsed.success ? parsed.data : emptyIndex();

  const known = new Set(index.documents.map((entry) => entry.id));
  const orphanIds = (await idbKeys())
    .filter((key) => key.startsWith(IDB_KEYS.documentPrefix))
    .map((key) => key.slice(IDB_KEYS.documentPrefix.length))
    .filter((id) => !known.has(id));

  if (orphanIds.length === 0) return index;

  const recovered = (await Promise.all(orphanIds.map(readDocument))).filter(
    (document): document is CvDocument => document !== null,
  );

  const repaired: LibraryIndex = {
    ...index,
    documents: [...index.documents, ...recovered.map((document) => document.meta)],
  };

  await writeIndex(repaired);

  return repaired;
};

export const writeIndex = async (index: LibraryIndex): Promise<void> => {
  await idbSet(IDB_KEYS.index, index);
};

export const readDocument = async (id: string): Promise<CvDocument | null> => {
  const raw = await idbGet(IDB_KEYS.document(id));
  if (!raw) return null;

  const parsed = cvDocumentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // A document written by an older build: repair the resume rather than lose it.
  const candidate = raw as { meta?: unknown; resume?: unknown };

  return {
    meta: { ...createDocument(normalizeResume(candidate.resume)).meta, ...(candidate.meta as object) },
    resume: normalizeResume(candidate.resume),
  };
};

export const writeDocument = async (document: CvDocument): Promise<void> => {
  await idbSet(IDB_KEYS.document(document.meta.id), document);
};

export const deleteDocument = async (id: string): Promise<void> => {
  await idbDelete(IDB_KEYS.document(id));
};

export const readAllDocuments = async (index: LibraryIndex): Promise<CvDocument[]> => {
  const documents = await Promise.all(index.documents.map((entry) => readDocument(entry.id)));

  return documents.filter((document): document is CvDocument => document !== null);
};

/** Metadata refreshed from a resume, for use on every save. */
export const touchMeta = (meta: DocumentMeta, resume: Resume): DocumentMeta => ({
  ...meta,
  personName: resume.basics.fullName || meta.personName,
  updatedAt: Date.now(),
});

/**
 * Moves the pre-library resume out of localStorage.
 *
 * Runs once: the old key is removed only after the document is safely written,
 * so an interrupted migration retries on the next load instead of losing work.
 */
export const migrateLegacyResume = async (): Promise<CvDocument | null> => {
  if (typeof localStorage === 'undefined') return null;

  const raw = localStorage.getItem(STORAGE_KEYS.legacyResume);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { state?: { resume?: unknown } };
    const document = createDocument(normalizeResume(parsed.state?.resume), 'My CV');

    await writeDocument(document);
    localStorage.removeItem(STORAGE_KEYS.legacyResume);

    return document;
  } catch {
    // Unreadable JSON is not worth keeping, but it is also not worth throwing
    // over: the user simply starts with an empty library.
    localStorage.removeItem(STORAGE_KEYS.legacyResume);

    return null;
  }
};
