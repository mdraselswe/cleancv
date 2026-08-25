'use client';

import { useCallback, useState } from 'react';

import { ROUTES } from '@/constants';
import type { Resume } from '@/features/resume';
import { toFileStem } from '@/lib/text';

import { downloadBlob, filenameFromResponse } from '../utils/download';

export type ExportMode = 'design' | 'ats';

export interface ExportState {
  /** Which export is in flight, if any. */
  pending: ExportMode | null;
  error: string;
  /** The export that failed, so the caller can offer a retry. */
  failedMode: ExportMode | null;
}

/**
 * Requests a PDF from the server and hands it to the browser.
 *
 * Rendering happens server-side in headless Chrome rather than in the user's
 * tab, so the output is identical on every machine and carries a real text
 * layer. See ADR-001.
 */
export const useExportPdf = () => {
  const [state, setState] = useState<ExportState>({ pending: null, error: '', failedMode: null });

  /**
   * `pageBreaks` are the break points the preview measured, as indices into the
   * document's breakable elements. Passing them makes the PDF break where the
   * reader was shown it would; omitting them leaves Chrome to paginate, which is
   * what happens when the preview is not mounted. Never passed for `ats`, which
   * renders through a different template. See ADR-021.
   */
  const exportPdf = useCallback(
    async (resume: Resume, mode: ExportMode = 'design', pageBreaks: number[] = []) => {
      setState({ pending: mode, error: '', failedMode: null });

      try {
        const response = await fetch(ROUTES.api.pdf, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume, mode, pageBreaks }),
        });

        if (!response.ok) {
          const detail = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(detail?.error ?? 'The server could not render the PDF.');
        }

        const stem = toFileStem(resume.meta.documentName || resume.basics.fullName || 'resume');
        const fallback = mode === 'ats' ? `${stem}-ATS.pdf` : `${stem}.pdf`;

        downloadBlob(await response.blob(), filenameFromResponse(response, fallback));
        setState({ pending: null, error: '', failedMode: null });
      } catch (error) {
        setState({
          pending: null,
          error: error instanceof Error ? error.message : 'The PDF could not be created.',
          failedMode: mode,
        });
      }
    },
    [],
  );

  const clearError = useCallback(
    () => setState((current) => ({ ...current, error: '', failedMode: null })),
    [],
  );

  return { ...state, exportPdf, clearError };
};
