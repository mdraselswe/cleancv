'use client';

import { useEffect } from 'react';

import { AUTOSAVE_MS } from '@/constants';
import { useResumeStore } from '@/features/resume';

import { useLibraryStore, wasJustLoaded } from './useLibrary';

/**
 * Boots the library and keeps the open document written to storage.
 *
 * The save is debounced against the resume store rather than driven by a React
 * effect on the resume value: typing a sentence should be one write, not forty,
 * and the subscription sees every change without the editor re-rendering.
 *
 * Mount this once, at the composition root.
 */
export const useLibrarySync = (): void => {
  useEffect(() => {
    void useLibraryStore.getState().actions.boot();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = useResumeStore.subscribe((state, previous) => {
      if (state.resume === previous.resume) return;
      // Opening a document is not an edit.
      if (wasJustLoaded(state.resume)) return;

      clearTimeout(timer);
      timer = setTimeout(() => {
        void useLibraryStore.getState().actions.save(useResumeStore.getState().resume);
      }, AUTOSAVE_MS);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();

      // A pending edit must not be lost to a navigation or a hot reload.
      void useLibraryStore.getState().actions.save(useResumeStore.getState().resume);
    };
  }, []);
};

/** True once storage has been read and a document is open. */
export const useLibraryReady = (): boolean =>
  useLibraryStore((state) => state.status !== 'loading');
