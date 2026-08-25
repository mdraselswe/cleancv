import { IDB_KEYS } from '@/constants';
import { idbDelete, idbGet, idbSet } from '@/lib/idb';
import { toFileStem } from '@/lib/text';

import { cvDocumentSchema, type CvDocument } from './schema';

/**
 * The workspace folder: a real directory on disk that the library mirrors
 * itself into.
 *
 * IndexedDB is still browser cache — "clear browsing data" empties it, and the
 * user's CVs go with it. A folder does not. Point the workspace at a folder
 * that Drive, OneDrive or Dropbox already syncs and the same choice also buys
 * off-machine backup and a second device, with no server involved.
 *
 * The directory handle itself is stored in IndexedDB, which is what makes the
 * permission survive a reload — the browser remembers the grant against the
 * handle, so the folder is picked once rather than every session.
 */

/**
 * Declared locally: `showDirectoryPicker` and the handle types are not in every
 * TypeScript DOM lib yet, and a missing type should not decide whether this
 * feature exists.
 */
interface DirectoryHandle {
  name: string;
  entries: () => AsyncIterableIterator<[string, { kind: string }]>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileHandle>;
  removeEntry: (name: string) => Promise<void>;
  queryPermission?: (options: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: 'readwrite' }) => Promise<PermissionState>;
}

interface FileHandle {
  getFile: () => Promise<File>;
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
}

type DirectoryPicker = (options?: { mode?: 'read' | 'readwrite' }) => Promise<DirectoryHandle>;

const FILE_SUFFIX = '.cv.json';

const picker = (): DirectoryPicker | null => {
  const candidate = (globalThis as { showDirectoryPicker?: DirectoryPicker }).showDirectoryPicker;

  return typeof candidate === 'function' ? candidate : null;
};

/** Chromium browsers only. Firefox and Safari fall back to backup files. */
export const workspaceSupported = (): boolean => picker() !== null;

/** The id is in the filename so renaming a document never orphans its file. */
const fileNameFor = (document: CvDocument): string =>
  `${toFileStem(document.meta.name || document.meta.personName || 'cv')}--${document.meta.id}${FILE_SUFFIX}`;

const idFromFileName = (name: string): string | null => {
  if (!name.endsWith(FILE_SUFFIX)) return null;

  const stem = name.slice(0, -FILE_SUFFIX.length);
  const separator = stem.lastIndexOf('--');

  return separator === -1 ? null : stem.slice(separator + 2);
};

export const getWorkspaceHandle = async (): Promise<DirectoryHandle | null> =>
  (await idbGet<DirectoryHandle>(IDB_KEYS.workspace)) ?? null;

/**
 * Whether the stored handle is still usable.
 *
 * A grant can lapse — the folder was removed, or the browser dropped the
 * permission — and the honest answer then is "ask again", not a silent failure
 * on the next save.
 */
export const workspaceReady = async (handle: DirectoryHandle | null): Promise<boolean> => {
  if (!handle?.queryPermission) return handle !== null;

  try {
    return (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
  } catch {
    return false;
  }
};

export const requestWorkspaceAccess = async (handle: DirectoryHandle): Promise<boolean> => {
  if (!handle.requestPermission) return true;

  try {
    return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';
  } catch {
    return false;
  }
};

/** Opens the browser's folder picker and remembers what the user chose. */
export const chooseWorkspace = async (): Promise<DirectoryHandle | null> => {
  const show = picker();
  if (!show) return null;

  try {
    const handle = await show({ mode: 'readwrite' });
    await idbSet(IDB_KEYS.workspace, handle);

    return handle;
  } catch {
    // The picker throws when the user cancels; that is not an error.
    return null;
  }
};

export const forgetWorkspace = async (): Promise<void> => {
  await idbDelete(IDB_KEYS.workspace);
};

export const writeToWorkspace = async (
  handle: DirectoryHandle,
  document: CvDocument,
): Promise<void> => {
  const file = await handle.getFileHandle(fileNameFor(document), { create: true });
  const writable = await file.createWritable();

  await writable.write(JSON.stringify(document, null, 2));
  await writable.close();
};

export const removeFromWorkspace = async (
  handle: DirectoryHandle,
  document: CvDocument,
): Promise<void> => {
  try {
    await handle.removeEntry(fileNameFor(document));
  } catch {
    // Already gone, or renamed by hand. Either way there is nothing to remove.
  }
};

/**
 * Everything readable in the folder.
 *
 * A file that fails to parse is skipped rather than aborting the restore: one
 * hand-edited file must not cost the user the other forty.
 */
export const readWorkspace = async (handle: DirectoryHandle): Promise<CvDocument[]> => {
  const documents: CvDocument[] = [];

  for await (const [name, entry] of handle.entries()) {
    if (entry.kind !== 'file' || idFromFileName(name) === null) continue;

    try {
      const file = await handle.getFileHandle(name);
      const parsed = cvDocumentSchema.safeParse(JSON.parse(await (await file.getFile()).text()));

      if (parsed.success) documents.push(parsed.data);
    } catch {
      continue;
    }
  }

  return documents;
};

export type { DirectoryHandle as WorkspaceHandle };
