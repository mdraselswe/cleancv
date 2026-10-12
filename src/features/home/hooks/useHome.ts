'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { MAX_DOCUMENTS, ROUTES, type TemplateId } from '@/constants';
import { downloadText } from '@/features/export';
import {
  backupFilename,
  parseBackup,
  readAllDocuments,
  readIndex,
  serializeBackup,
  useDocumentResumes,
  useLibraryStore,
  type DocumentMeta,
} from '@/features/library';
import { useResumeActions, type Resume } from '@/features/resume';
import { getTemplate } from '@/features/templates';

/**
 * Everything the home screen *does*: create, open, rename, duplicate, remove,
 * import and back up. The screen itself only draws.
 *
 * Opening and creating both end in the editor — the library says which
 * document is active, the route says where the reader is looking at it.
 */
export const useHome = () => {
  const router = useRouter();
  const { status, documents, activeId, error, actions } = useLibraryStore();
  const resumeActions = useResumeActions();
  const resumes = useDocumentResumes(documents);

  const [renaming, setRenaming] = useState<DocumentMeta | null>(null);
  const [deleting, setDeleting] = useState<DocumentMeta | null>(null);
  /** The blank document an import is being written into, until it is applied. */
  const [importTarget, setImportTarget] = useState<string | null>(null);

  const atLimit = documents.length >= MAX_DOCUMENTS;

  const goToEditor = useCallback(() => router.push(ROUTES.editor), [router]);

  const guardLimit = useCallback((): boolean => {
    if (!atLimit) return true;

    toast.error(`You can keep ${MAX_DOCUMENTS} CVs. Delete one to make room.`);

    return false;
  }, [atLimit]);

  const createBlank = useCallback(async () => {
    if (!guardLimit()) return;

    await actions.createNew('');
    goToEditor();
  }, [actions, goToEditor, guardLimit]);

  const createFromSample = useCallback(async () => {
    if (!guardLimit()) return;

    await actions.createNew('');
    resumeActions.loadSample();
    goToEditor();
  }, [actions, goToEditor, guardLimit, resumeActions]);

  const createFromTemplate = useCallback(
    async (templateId: TemplateId) => {
      if (!guardLimit()) return;

      await actions.createNew('');
      resumeActions.setTemplate(templateId, getTemplate(templateId).meta.defaultTheme);
      goToEditor();
    },
    [actions, goToEditor, guardLimit, resumeActions],
  );

  const openDocument = useCallback(
    async (id: string) => {
      await actions.open(id);
      goToEditor();
    },
    [actions, goToEditor],
  );

  const duplicateDocument = useCallback(
    async (id: string) => {
      if (!guardLimit()) return;

      await actions.duplicate(id);
      toast.success('Copy created');
    },
    [actions, guardLimit],
  );

  const confirmRename = useCallback(
    async (id: string, name: string) => {
      await actions.rename(id, name.trim());
      setRenaming(null);
    },
    [actions],
  );

  const confirmDelete = useCallback(
    async (id: string) => {
      await actions.remove(id);
      setDeleting(null);
      toast('CV deleted');
    },
    [actions],
  );

  /*
   * Import writes into a fresh document rather than the open one: the home
   * screen has no "current" CV to overwrite, and a failed import should leave
   * nothing behind. The blank is removed again if the dialog closes unused.
   */
  const beginImport = useCallback(async () => {
    if (!guardLimit()) return;

    await actions.createNew('');
    setImportTarget(useLibraryStore.getState().activeId);
  }, [actions, guardLimit]);

  const applyImport = useCallback(
    (next: Resume) => {
      resumeActions.replaceResume(next);
      setImportTarget(null);
      goToEditor();
    },
    [goToEditor, resumeActions],
  );

  const cancelImport = useCallback(async () => {
    const target = importTarget;

    setImportTarget(null);
    if (target) await actions.remove(target);
  }, [actions, importTarget]);

  const restoreBackup = useCallback(
    async (file: File) => {
      const result = parseBackup(await file.text());

      if (!result.ok) {
        toast.error(result.error ?? 'That file could not be read.');

        return;
      }

      const landed = await actions.importDocuments(result.documents);

      if (landed === 0) toast('Nothing to restore — everything in that file is already here.');
      else toast.success(`Restored ${landed} CV${landed === 1 ? '' : 's'}`);
    },
    [actions],
  );

  const backupAll = useCallback(async () => {
    const all = await readAllDocuments(await readIndex());
    const filename = backupFilename();

    downloadText(serializeBackup(all), filename);
    toast.success(`Backed up ${all.length} CV${all.length === 1 ? '' : 's'}`, {
      description: filename,
    });
  }, []);

  return {
    status,
    error,
    documents,
    activeId,
    resumes,
    atLimit,
    renaming,
    setRenaming,
    deleting,
    setDeleting,
    importing: importTarget !== null,
    createBlank,
    createFromSample,
    createFromTemplate,
    openDocument,
    duplicateDocument,
    confirmRename,
    confirmDelete,
    beginImport,
    applyImport,
    cancelImport,
    restoreBackup,
    backupAll,
  };
};

export type HomeController = ReturnType<typeof useHome>;
