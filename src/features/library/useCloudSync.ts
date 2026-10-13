'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { create } from 'zustand';

import { STORAGE_KEYS } from '@/constants';
import { useAuthSession } from '@/features/auth';
import { CLOUD_REFUSAL_MESSAGE, type CloudRefusal } from '@/lib/cloudSync';

import { clearUnsync, takeUnsync } from './cloudQueue';

import { cvDocumentSchema, deletedDocumentSchema } from './schema';
import { readAllDocuments, readIndex } from './storage';
import { useLibraryStore } from './useLibrary';

export type CloudSyncStatus = 'signed-out' | 'idle' | 'syncing' | 'synced' | 'error';

interface CloudSyncState {
  status: CloudSyncStatus;
  lastSyncedAt: number;
  error: string;
  syncNow: () => Promise<void>;
}

let activeSync: Promise<void> | null = null;
/**
 * Set when something changed while a sync was already in flight.
 *
 * Without it, a CV switched to sync during a running request was dropped: the
 * request in flight had read its documents before the switch, nothing asked
 * for another, and the CV showed as synced on a device that had never sent it.
 */
let resyncRequested = false;
let currentUserId = '';
let hasPulled = false;
const uploadedAt = new Map<string, number>();

const runCloudSync = async (forcePull = false): Promise<void> => {
  if (activeSync) {
    resyncRequested = true;

    return activeSync;
  }

  activeSync = (async () => {
    useCloudSyncStore.setState({ status: 'syncing', error: '' });

    try {
      const index = await readIndex();
      const allDocuments = await readAllDocuments(index);
      // Only what the reader switched on leaves the browser.
      const documents = allDocuments.filter(
        (document) =>
          document.meta.cloud && document.meta.updatedAt > (uploadedAt.get(document.meta.id) ?? 0),
      );
      const unsync = takeUnsync();
      const pull = forcePull || !hasPulled;
      const response = await fetch('/api/resumes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents, deleted: index.deleted, unsync, pull }),
      });

      if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(detail?.error ?? 'Cloud sync is unavailable.');
      }

      const body = (await response.json()) as Record<string, unknown>;
      const remoteDocuments = cvDocumentSchema.array().parse(body.documents);
      const remoteDeleted = deletedDocumentSchema.array().parse(body.deleted);
      const unsynced = Array.isArray(body.unsynced) ? (body.unsynced as string[]) : [];
      const refused = Array.isArray(body.rejected)
        ? (body.rejected as Array<{ id: string; reason: CloudRefusal }>)
        : [];

      clearUnsync(unsync);

      const reported = body.limits as { documents?: unknown; bytes?: unknown } | undefined;
      if (typeof reported?.documents === 'number' && typeof reported.bytes === 'number') {
        useLibraryStore
          .getState()
          .actions.setCloudLimits({ documents: reported.documents, bytes: reported.bytes });
      }

      await useLibraryStore.getState().actions.reconcileCloud(remoteDocuments, remoteDeleted, {
        unsynced,
        rejected: refused.map((entry) => entry.id),
      });

      // Said once per refusal, in words: a CV that quietly stayed local is a CV
      // the reader believes is safe somewhere it is not.
      for (const entry of refused) {
        toast.error(CLOUD_REFUSAL_MESSAGE[entry.reason] ?? 'This CV could not be synced.');
      }
      for (const document of [...allDocuments, ...remoteDocuments]) {
        uploadedAt.set(document.meta.id, document.meta.updatedAt);
      }
      hasPulled = true;
      useCloudSyncStore.setState({
        status: 'synced',
        lastSyncedAt: typeof body.syncedAt === 'number' ? body.syncedAt : Date.now(),
        error: '',
      });
    } catch (error) {
      useCloudSyncStore.setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Cloud sync is unavailable.',
      });
    } finally {
      activeSync = null;

      // What changed meanwhile still has to go.
      if (resyncRequested) {
        resyncRequested = false;
        setTimeout(() => void runCloudSync(), 0);
      }
    }
  })();

  return activeSync;
};

export const useCloudSyncStore = create<CloudSyncState>()(() => ({
  status: 'signed-out',
  lastSyncedAt: 0,
  error: '',
  syncNow: () => runCloudSync(true),
}));

/** Starts sync after sign-in and after every local library mutation. */
export const useCloudSync = (): void => {
  const { signedIn, pending, user } = useAuthSession();
  const libraryStatus = useLibraryStore((state) => state.status);
  const signature = useLibraryStore((state) =>
    [
      ...state.documents.map((entry) => `${entry.id}:${entry.updatedAt}:${entry.cloud ? 1 : 0}`),
      ...state.deleted.map((entry) => `${entry.id}:d${entry.deletedAt}`),
    ].join('|'),
  );

  const ready = !pending && signedIn && libraryStatus === 'ready';
  useEffect(() => {
    if (pending) return;
    if (!signedIn) {
      currentUserId = '';
      hasPulled = false;
      uploadedAt.clear();
      useCloudSyncStore.setState({ status: 'signed-out', lastSyncedAt: 0, error: '' });
      return;
    }
    if (!ready) return;

    if (user?.id && currentUserId !== user.id) {
      currentUserId = user.id;
      hasPulled = false;
      uploadedAt.clear();

      /*
       * The sync flags belong to the account that set them. Another account
       * signing in on the same browser must not inherit them — its sync would
       * upload the previous person's CVs under its own name.
       */
      try {
        const owner = window.localStorage.getItem(STORAGE_KEYS.cloudOwner);

        if (owner && owner !== user.id) {
          void useLibraryStore.getState().actions.clearCloudFlags();
        }

        window.localStorage.setItem(STORAGE_KEYS.cloudOwner, user.id);
      } catch {
        // Storage can be blocked; the flags then simply stay as they are.
      }
    }

    const timer = setTimeout(() => void runCloudSync(), 1200);
    return () => clearTimeout(timer);
  }, [pending, ready, signedIn, signature, user?.id]);
};
