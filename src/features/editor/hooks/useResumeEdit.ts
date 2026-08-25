'use client';

import { useCallback } from 'react';

import { useResumeActions, type Resume } from '@/features/resume';

/**
 * Patch helper for the singleton sections (basics, contact, summary, …).
 *
 * The coalesce key defaults to the field path, so typing a sentence collapses
 * into one undo step instead of forty.
 */
export const useResumeEdit = () => {
  const actions = useResumeActions();

  const patch = useCallback(
    <K extends keyof Resume>(group: K, changes: Partial<Resume[K]>) => {
      const coalesceKey = `${String(group)}:${Object.keys(changes).join(',')}`;

      actions.edit((draft) => {
        draft[group] = { ...(draft[group] as object), ...changes } as Resume[K];
      }, coalesceKey);
    },
    [actions],
  );

  return { patch, actions };
};
