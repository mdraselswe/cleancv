'use client';

import { useCallback, useState } from 'react';

import { parseResumeFile, serializeResume, type Resume } from '@/features/resume';
import { toFileStem } from '@/lib/text';

import { downloadText } from '../utils/download';

/**
 * Id of the hidden file input. The import control is a `<label for>` rather than
 * a button that clicks a ref — no imperative DOM access, and the keyboard and
 * screen-reader behaviour comes for free.
 */
export const IMPORT_INPUT_ID = 'cv-maker-import-json';

/**
 * JSON backup and restore.
 *
 * With no accounts and no server-side storage, this is how a resume moves
 * between browsers and machines. See ADR-005.
 */
export const useExportJson = (onImport: (resume: Resume) => void) => {
  const [error, setError] = useState('');

  const exportJson = useCallback((resume: Resume) => {
    const stem = toFileStem(resume.meta.documentName || resume.basics.fullName || 'resume');
    downloadText(serializeResume(resume), `${stem}.json`);
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      const result = parseResumeFile(await file.text());

      if (!result.ok) {
        setError(result.error ?? 'That file could not be read.');
        return;
      }

      setError('');
      onImport(result.resume);
    },
    [onImport],
  );

  const clearError = useCallback(() => setError(''), []);

  return { error, exportJson, handleFileChange, clearError };
};
