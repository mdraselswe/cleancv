'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

import { useAuthSession } from '@/features/auth';

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
let currentUserId = '';
let hasPulled = false;
const uploadedAt = new Map<string, number>();

const runCloudSync = async (forcePull = false): Promise<void> => {
  if (activeSync) return activeSync;

  activeSync = (async () => {
    useCloudSyncStore.setState({ status: 'syncing', error: '' });

    try {
      const index = await readIndex();
      const allDocuments = await readAllDocuments(index);
      const documents = allDocuments.filter(
        (document) => document.meta.updatedAt > (uploadedAt.get(document.meta.id) ?? 0),
      );
      const pull = forcePull || !hasPulled;
      const response = await fetch('/api/cvs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents, deleted: index.deleted, pull }),
      });

      if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(detail?.error ?? 'Cloud sync is unavailable.');
      }

      const body = (await response.json()) as Record<string, unknown>;
      const remoteDocuments = cvDocumentSchema.array().parse(body.documents);
      const remoteDeleted = deletedDocumentSchema.array().parse(body.deleted);

      await useLibraryStore.getState().actions.reconcileCloud(remoteDocuments, remoteDeleted);
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
    [...state.documents.map((entry) => `${entry.id}:${entry.updatedAt}`), ...state.deleted.map((entry) => `${entry.id}:d${entry.deletedAt}`)].join('|'),
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
    }

    const timer = setTimeout(() => void runCloudSync(), 1200);
    return () => clearTimeout(timer);
  }, [pending, ready, signedIn, signature, user?.id]);
};
