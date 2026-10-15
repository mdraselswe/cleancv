'use client';

import { create } from 'zustand';

import { LIBRARY_SCHEMA_VERSION, MAX_DOCUMENTS } from '@/constants';
import { createEmptyResume, useResumeStore, type Resume } from '@/features/resume';
import {
  checkCloudDocument,
  DEFAULT_CLOUD_LIMITS,
  documentBytes,
  type CloudLimits,
  type CloudRefusal,
} from '@/lib/cloudSync';

import { queueUnsync } from './cloudQueue';
import {
  createDocument,
  deleteDocument,
  migrateLegacyResume,
  readDocument,
  readIndex,
  touchMeta,
  writeDocument,
  writeIndex,
} from './storage';
import type { CvDocument, DeletedDocument, DocumentMeta, LibraryIndex } from './schema';
import {
  chooseWorkspace,
  forgetWorkspace,
  getWorkspaceHandle,
  readWorkspace,
  removeFromWorkspace,
  requestWorkspaceAccess,
  workspaceReady,
  workspaceSupported,
  writeToWorkspace,
  type WorkspaceHandle,
} from './workspace';

/**
 * The document library.
 *
 * It owns *which* CV is open and where every CV is stored; the resume store
 * still owns the one being edited. Keeping them separate is what lets undo,
 * scoring and the templates stay unaware that more than one document exists.
 */

export type LibraryStatus = 'loading' | 'ready' | 'unavailable';

/**
 * What the autosave is doing, for the one line of the toolbar that says so.
 *
 * `pending` exists because the save is debounced: between the keystroke and
 * the write there is a second where the document on screen is not the document
 * in storage, and a reader who closes the tab in that second loses it. Saying
 * "Saving…" through that window is the difference between a promise the app
 * keeps and one it appears to.
 */
export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'failed';

export interface WorkspaceState {
  supported: boolean;
  /** Folder name to show; empty when none is connected. */
  folderName: string;
  /** Set when the handle exists but the browser will not grant access. */
  needsPermission: boolean;
  lastSyncedAt: number;
}

interface LibraryState {
  status: LibraryStatus;
  documents: DocumentMeta[];
  deleted: DeletedDocument[];
  activeId: string;
  workspace: WorkspaceState;
  saveState: SaveState;
  /** When the last successful write landed; 0 before the first one. */
  savedAt: number;
  /** Set when storage itself failed, e.g. a private window with no IndexedDB. */
  error: string;
  /** What this account may keep on the server; learned from the server, never decided here. */
  cloudLimits: CloudLimits;
}

/** Whether a CV could be switched to or from server sync, and why not if it could not. */
export type CloudToggleResult = { ok: true } | { ok: false; reason: CloudRefusal | 'missing' };

export interface CloudReconcileResult {
  /** The server no longer keeps these; they stay on this device. */
  unsynced: string[];
  /** The server refused these; they stay on this device. */
  rejected: string[];
}

export interface LibraryActions {
  /** Loads the index, migrates any pre-library resume, and opens a document. */
  boot: () => Promise<void>;
  save: (resume: Resume) => Promise<void>;
  /** The editor changed and a save is scheduled but has not run yet. */
  markDirty: () => void;

  createNew: (name?: string) => Promise<void>;
  open: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;

  connectWorkspace: () => Promise<void>;
  disconnectWorkspace: () => Promise<void>;
  syncWorkspace: () => Promise<void>;
  restoreFromWorkspace: () => Promise<number>;

  /** Merges documents from a backup file or a folder. Returns how many landed. */
  importDocuments: (incoming: CvDocument[]) => Promise<number>;
  /** Applies the canonical result returned by cloud sync. */
  reconcileCloud: (
    incoming: CvDocument[],
    deleted: DeletedDocument[],
    result?: CloudReconcileResult,
  ) => Promise<void>;
  /** Switches one CV on or off for server sync. Opt-in, and capped per account. */
  setCloud: (id: string, enabled: boolean) => Promise<CloudToggleResult>;
  /** Records the allowance the server reported for the signed-in account. */
  setCloudLimits: (limits: CloudLimits) => void;
  /** Turns every CV back to this-device-only — when another account signs in here. */
  clearCloudFlags: () => Promise<void>;
}

type LibraryStore = LibraryState & { actions: LibraryActions };

const IDLE_WORKSPACE: WorkspaceState = {
  supported: false,
  folderName: '',
  needsPermission: false,
  lastSyncedAt: 0,
};

/**
 * Handles are not state: they are opaque browser objects that never render, and
 * putting one in the store would make every consumer re-render when it changes.
 */
let workspaceHandle: WorkspaceHandle | null = null;

/**
 * Booting is not idempotent on its own: it migrates, then reads, then writes.
 * Two overlapping runs each see an empty library and each create a document —
 * which is exactly what a double-invoked effect produces. Sharing one promise
 * makes every caller after the first wait for the same run.
 */
let bootRun: Promise<void> | null = null;

/**
 * The exact resume object most recently put into the editor by the library.
 *
 * Opening a document changes the resume store, which would otherwise look like
 * an edit and schedule a save — bumping `updatedAt` and reordering the list
 * just because someone looked at a CV. Comparing by reference is enough: the
 * first real edit produces a new object.
 */
let lastLoadedResume: Resume | null = null;

export const wasJustLoaded = (resume: Resume): boolean => resume === lastLoadedResume;

const sortByRecent = (documents: DocumentMeta[]): DocumentMeta[] =>
  [...documents].sort((a, b) => b.updatedAt - a.updatedAt);

export const useLibraryStore = create<LibraryStore>()((set, get) => {
  /** Writes the index from whatever is currently in state. */
  const persistIndex = async () => {
    const { documents, deleted, activeId } = get();
    const index: LibraryIndex = { version: LIBRARY_SCHEMA_VERSION, activeId, documents, deleted };

    await writeIndex(index);
  };

  /** Loads a document into the editor, or an empty resume when it is missing. */
  const load = async (id: string) => {
    const document = await readDocument(id);
    const resume = document?.resume ?? createEmptyResume();

    lastLoadedResume = resume;
    useResumeStore.getState().actions.replaceResume(resume, { resetHistory: true });
    set({ activeId: id });
  };

  /** Best-effort mirror to the workspace folder; never blocks a local save. */
  const mirror = async (document: CvDocument) => {
    if (!workspaceHandle) return;

    try {
      await writeToWorkspace(workspaceHandle, document);
      set((state) => ({ workspace: { ...state.workspace, lastSyncedAt: Date.now() } }));
    } catch {
      set((state) => ({ workspace: { ...state.workspace, needsPermission: true } }));
    }
  };

  /** The one-time startup sequence, shared through `bootRun`. */
  const runBoot = async (): Promise<void> => {
    try {
      const migrated = await migrateLegacyResume();
      const index = await readIndex();

      const documents = migrated
        ? [migrated.meta, ...index.documents.filter((entry) => entry.id !== migrated.meta.id)]
        : index.documents;

      // A first visit gets a document rather than an empty list, so there is
      // always somewhere for the first keystroke to go.
      const first = documents[0] ?? createDocument(createEmptyResume(), 'আমার CV').meta;
      if (documents.length === 0) {
        await writeDocument({ meta: first, resume: createEmptyResume() });
      }

      const all = documents.length === 0 ? [first] : documents;
      const activeId = all.some((entry) => entry.id === index.activeId)
        ? index.activeId
        : all[0].id;

      set({
        status: 'ready',
        documents: sortByRecent(all),
        deleted: index.deleted,
        activeId,
        error: '',
      });

      await load(activeId);
      await persistIndex();

      // The workspace is optional: a failure here must not stop the editor.
      const supported = workspaceSupported();
      const handle = supported ? await getWorkspaceHandle() : null;
      const ready = await workspaceReady(handle);
      workspaceHandle = ready ? handle : null;

      set({
        workspace: {
          supported,
          folderName: handle?.name ?? '',
          needsPermission: handle !== null && !ready,
          lastSyncedAt: 0,
        },
      });
    } catch (error) {
      set({
        status: 'unavailable',
        workspace: { ...IDLE_WORKSPACE, supported: workspaceSupported() },
        error:
          error instanceof Error
            ? `স্টোরেজ পাওয়া যাচ্ছে না: ${error.message}। আপনার কাজ সেভ করা হবে না — বন্ধ করার আগে একটি ব্যাকআপ এক্সপোর্ট করুন।`
            : 'স্টোরেজ পাওয়া যাচ্ছে না। আপনার কাজ সেভ করা হবে না।',
      });
    }
  };

  const actions: LibraryActions = {
    boot: () => {
      bootRun ??= runBoot();

      return bootRun;
    },

    markDirty: () => {
      if (get().status !== 'ready') return;
      set({ saveState: 'pending' });
    },

    save: async (resume) => {
      const { status, activeId, documents } = get();
      if (status !== 'ready' || !activeId) return;

      const existing = documents.find((entry) => entry.id === activeId);
      if (!existing) return;

      const meta = touchMeta(existing, resume);
      const document: CvDocument = { meta, resume };

      set({ saveState: 'saving' });

      try {
        await writeDocument(document);
      } catch {
        // Storage can fail after boot — a quota hit, or a private window that
        // only refuses on write. Saying so is the whole point of the state.
        set({ saveState: 'failed' });

        return;
      }

      set({
        documents: sortByRecent(documents.map((entry) => (entry.id === activeId ? meta : entry))),
        saveState: 'saved',
        savedAt: Date.now(),
      });
      await persistIndex();
      await mirror(document);
    },

    createNew: async (name = '') => {
      const { documents } = get();
      if (documents.length >= MAX_DOCUMENTS) return;

      const document = createDocument(createEmptyResume(), name);

      await writeDocument(document);
      set((state) => ({
        documents: sortByRecent([document.meta, ...documents]),
        deleted: state.deleted.filter((entry) => entry.id !== document.meta.id),
        activeId: document.meta.id,
      }));

      lastLoadedResume = document.resume;
      useResumeStore.getState().actions.replaceResume(document.resume, { resetHistory: true });
      await persistIndex();
      await mirror(document);
    },

    open: async (id) => {
      if (get().activeId === id) return;

      await load(id);
      await persistIndex();
    },

    duplicate: async (id) => {
      const { documents } = get();
      if (documents.length >= MAX_DOCUMENTS) return;

      const source = await readDocument(id);
      if (!source) return;

      const copy = createDocument(source.resume, `${source.meta.name || 'Untitled'} (copy)`);
      copy.meta.personName = source.meta.personName;

      await writeDocument(copy);
      set((state) => ({
        documents: sortByRecent([copy.meta, ...documents]),
        deleted: state.deleted.filter((entry) => entry.id !== copy.meta.id),
      }));
      await persistIndex();
      await mirror(copy);
    },

    rename: async (id, name) => {
      const { documents } = get();
      const existing = documents.find((entry) => entry.id === id);
      if (!existing) return;

      const document = await readDocument(id);
      if (!document) return;

      // The old workspace file is named after the old title, so it goes first.
      if (workspaceHandle) await removeFromWorkspace(workspaceHandle, document);

      const meta = { ...existing, name, updatedAt: Date.now() };
      const updated: CvDocument = { meta, resume: document.resume };

      await writeDocument(updated);
      set({ documents: sortByRecent(documents.map((entry) => (entry.id === id ? meta : entry))) });
      await persistIndex();
      await mirror(updated);
    },

    remove: async (id) => {
      const { documents, activeId, deleted } = get();
      const document = await readDocument(id);
      const deletedAt = Date.now();

      await deleteDocument(id);
      if (workspaceHandle && document) await removeFromWorkspace(workspaceHandle, document);

      const remaining = documents.filter((entry) => entry.id !== id);

      // Deleting the last document leaves a blank one rather than no editor.
      if (remaining.length === 0) {
        set({
          documents: [],
          deleted: [...deleted.filter((entry) => entry.id !== id), { id, deletedAt }],
        });
        await actions.createNew('আমার CV');

        return;
      }

      set({
        documents: remaining,
        deleted: [...deleted.filter((entry) => entry.id !== id), { id, deletedAt }],
      });
      if (activeId === id) await load(remaining[0].id);
      await persistIndex();
    },

    connectWorkspace: async () => {
      const handle = await chooseWorkspace();
      if (!handle) return;

      const granted = await requestWorkspaceAccess(handle);
      workspaceHandle = granted ? handle : null;

      set((state) => ({
        workspace: {
          ...state.workspace,
          folderName: handle.name,
          needsPermission: !granted,
        },
      }));

      if (granted) await actions.syncWorkspace();
    },

    disconnectWorkspace: async () => {
      workspaceHandle = null;
      await forgetWorkspace();
      set((state) => ({
        workspace: { ...state.workspace, folderName: '', needsPermission: false, lastSyncedAt: 0 },
      }));
    },

    syncWorkspace: async () => {
      if (!workspaceHandle) return;

      const { documents } = get();

      for (const meta of documents) {
        const document = await readDocument(meta.id);
        if (document) await mirror(document);
      }
    },

    restoreFromWorkspace: async () => {
      if (!workspaceHandle) return 0;

      return actions.importDocuments(await readWorkspace(workspaceHandle));
    },

    importDocuments: async (incoming) => {
      const { documents } = get();
      const byId = new Map(documents.map((entry) => [entry.id, entry]));
      let landed = 0;

      for (const document of incoming) {
        const existing = byId.get(document.meta.id);

        // A document already here and newer is left alone: restoring a backup
        // must not undo work done since that backup was taken.
        if (existing && existing.updatedAt >= document.meta.updatedAt) continue;
        if (!existing && byId.size >= MAX_DOCUMENTS) break;

        // A file says nothing about this account's server places: it lands
        // as it was here, or as this device only.
        document.meta.cloud = existing?.cloud ?? false;

        await writeDocument(document);
        byId.set(document.meta.id, document.meta);
        landed += 1;
      }

      if (landed === 0) return 0;

      set({ documents: sortByRecent([...byId.values()]) });
      await persistIndex();

      // The open document may have just been replaced under us.
      const { activeId } = get();
      if (incoming.some((document) => document.meta.id === activeId)) await load(activeId);

      return landed;
    },

    setCloud: async (id, enabled) => {
      const { documents } = get();
      const target = documents.find((entry) => entry.id === id);
      if (!target) return { ok: false, reason: 'missing' };

      const stored = await readDocument(id);
      let meta: DocumentMeta;

      if (enabled) {
        if (target.cloud) return { ok: true };

        const refusal = checkCloudDocument({
          bytes: documentBytes(stored?.resume),
          alreadySynced: false,
          syncedCount: documents.filter((entry) => entry.cloud).length,
          limits: get().cloudLimits,
        });

        if (refusal) return { ok: false, reason: refusal };

        // Newer than any tombstone the server holds for it, so it takes its place back.
        meta = { ...target, cloud: true, updatedAt: Date.now() };
      } else {
        if (!target.cloud) return { ok: true };

        meta = { ...target, cloud: false };
        queueUnsync(id);
      }

      if (stored) await writeDocument({ meta, resume: stored.resume });
      set({ documents: sortByRecent(documents.map((entry) => (entry.id === id ? meta : entry))) });
      await persistIndex();

      return { ok: true };
    },

    setCloudLimits: (limits) => set({ cloudLimits: limits }),

    clearCloudFlags: async () => {
      const { documents } = get();
      if (!documents.some((entry) => entry.cloud)) return;

      const next: DocumentMeta[] = [];

      for (const entry of documents) {
        if (!entry.cloud) {
          next.push(entry);
          continue;
        }

        const meta = { ...entry, cloud: false };
        const stored = await readDocument(entry.id);

        if (stored) await writeDocument({ meta, resume: stored.resume });
        next.push(meta);
      }

      set({ documents: sortByRecent(next) });
      await persistIndex();
    },

    reconcileCloud: async (incoming, cloudDeleted, result) => {
      const state = get();
      const localById = new Map(state.documents.map((entry) => [entry.id, entry]));
      const deletionById = new Map<string, number>();

      for (const entry of [...state.deleted, ...cloudDeleted]) {
        deletionById.set(entry.id, Math.max(deletionById.get(entry.id) ?? 0, entry.deletedAt));
      }

      for (const [id, deletedAt] of deletionById) {
        const local = localById.get(id);
        if (!local || deletedAt < local.updatedAt) continue;

        await deleteDocument(id);
        localById.delete(id);
      }

      for (const document of incoming) {
        const deletedAt = deletionById.get(document.meta.id) ?? 0;
        if (deletedAt >= document.meta.updatedAt) continue;

        const local = localById.get(document.meta.id);

        if (local && local.updatedAt >= document.meta.updatedAt) {
          // The server holds a copy of this one, so it takes a place and says so.
          if (!local.cloud) {
            const stored = await readDocument(local.id);
            const meta = { ...local, cloud: true };

            if (stored) await writeDocument({ meta, resume: stored.resume });
            localById.set(local.id, meta);
          }

          continue;
        }

        if (!local && localById.size >= MAX_DOCUMENTS) continue;

        await writeDocument(document);
        localById.set(document.meta.id, document.meta);
      }

      // CVs the server stopped keeping, or refused, go back to this device only.
      for (const id of [...(result?.unsynced ?? []), ...(result?.rejected ?? [])]) {
        const local = localById.get(id);
        if (!local?.cloud) continue;

        const stored = await readDocument(id);
        const meta = { ...local, cloud: false };

        if (stored) await writeDocument({ meta, resume: stored.resume });
        localById.set(id, meta);
      }

      // The server has acknowledged these tombstones, so its retained copy is
      // now enough to stop stale devices from resurrecting the documents.
      const documents = sortByRecent([...localById.values()]);
      let activeId = state.activeId;

      if (!documents.some((entry) => entry.id === activeId)) activeId = documents[0]?.id ?? '';

      set({ documents, deleted: [], activeId });

      if (!activeId) {
        await actions.createNew('আমার CV');
        return;
      }

      if (activeId !== state.activeId || incoming.some((entry) => entry.meta.id === activeId)) {
        await load(activeId);
      }

      await persistIndex();
    },
  };

  return {
    status: 'loading',
    saveState: 'idle',
    savedAt: 0,
    documents: [],
    deleted: [],
    activeId: '',
    workspace: IDLE_WORKSPACE,
    error: '',
    cloudLimits: DEFAULT_CLOUD_LIMITS,
    actions,
  };
});

export const useLibraryActions = (): LibraryActions => useLibraryStore((state) => state.actions);

export const useLibraryDocuments = (): DocumentMeta[] =>
  useLibraryStore((state) => state.documents);

export const useActiveDocument = (): DocumentMeta | undefined =>
  useLibraryStore((state) => state.documents.find((entry) => entry.id === state.activeId));

export const useSaveState = (): SaveState => useLibraryStore((state) => state.saveState);
