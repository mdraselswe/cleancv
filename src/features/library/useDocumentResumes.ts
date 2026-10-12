'use client';

import { useEffect, useState } from 'react';

import type { Resume } from '@/features/resume';

import type { DocumentMeta } from './schema';
import { readDocument } from './storage';

/**
 * The resume behind each library entry, for drawing thumbnails.
 *
 * The index holds metadata only so that listing never loads a photograph; a
 * card that shows the page has to go and fetch it. Keyed on `id:updatedAt`
 * so a save re-reads exactly the documents that changed, and nothing is
 * fetched twice for a list that merely re-sorted.
 */
export const useDocumentResumes = (documents: readonly DocumentMeta[]): Record<string, Resume> => {
  const [resumes, setResumes] = useState<Record<string, Resume>>({});
  const signature = documents.map((entry) => `${entry.id}:${entry.updatedAt}`).join('|');

  useEffect(() => {
    let cancelled = false;
    const ids = signature ? signature.split('|').map((part) => part.slice(0, part.lastIndexOf(':'))) : [];

    void (async () => {
      const loaded = await Promise.all(
        ids.map(async (id) => [id, (await readDocument(id))?.resume] as const),
      );
      if (cancelled) return;

      const next: Record<string, Resume> = {};
      for (const [id, resume] of loaded) if (resume) next[id] = resume;
      setResumes(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [signature]);

  return resumes;
};
