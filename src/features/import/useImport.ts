'use client';

import { useCallback, useRef, useState } from 'react';

import { normalizeResume } from '@/features/resume';

import { detectKind, extractDocument, isTwoColumn, type OcrProgress } from './extract';
import { parseHeuristically } from './parse/heuristic';
import { parseWithModel } from './parse/smart';
import { getSmartSettings, isSmartConfigured } from './settings';
import type { ImportProviderId, ImportResult, ImportStage, RestoreResult } from './types';

/**
 * Running an import.
 *
 * The two providers share everything except the structuring step, so the
 * offline path is never a degraded version of the smart one — it is the same
 * pipeline with a different parser, and it is what runs when no endpoint is
 * configured, when the endpoint is down, or when the user would rather nothing
 * left the machine.
 */

export interface ImportState {
  stage: ImportStage;
  /** What is happening now, for the dialog's progress line. */
  message: string;
  /** 0–1 where known, -1 where not. */
  progress: number;
  error: string;
  result: ImportResult | null;
  /** Set instead of `result` when the file carried the whole document. */
  restore: RestoreResult | null;
}

const IDLE: ImportState = {
  stage: 'idle',
  message: '',
  progress: -1,
  error: '',
  result: null,
  restore: null,
};

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('That file could not be read.'));
    reader.readAsDataURL(file);
  });

export interface UseImport {
  state: ImportState;
  /** True when an endpoint and model are configured. */
  smartAvailable: boolean;
  run: (file: File, provider: ImportProviderId) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export const useImport = (): UseImport => {
  const [state, setState] = useState<ImportState>(IDLE);
  const abort = useRef<AbortController | null>(null);

  const run = useCallback(async (file: File, provider: ImportProviderId) => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;

    const settings = getSmartSettings();
    const kind = detectKind(file);
    const warnings: string[] = [];

    /*
     * A model that can see the page beats OCR followed by parsing, because the
     * layout is information the OCR text has already thrown away.
     */
    const useVision = provider === 'smart' && kind === 'image' && settings.useVision;

    try {
      setState({
        stage: 'extracting',
        message: useVision ? 'Preparing the image' : 'Reading the file',
        progress: -1,
        error: '',
        result: null,
        restore: null,
      });

      const imageDataUrl = useVision ? await readAsDataUrl(file) : undefined;

      const extracted = useVision
        ? { kind: 'image' as const, lines: [], text: '', pageCount: 1, empty: true }
        : await extractDocument(file, {
            onProgress: (ocr: OcrProgress) =>
              setState((current) => ({
                ...current,
                message: ocr.label,
                progress: ocr.ratio,
              })),
          });

      if (controller.signal.aborted) return;

      /*
       * A PDF this app exported carries the document inside it. Nothing below
       * this point can improve on that, so the parser never runs — including
       * the paid one.
       */
      if (extracted.embedded) {
        setState({
          stage: 'restore',
          message: '',
          progress: 1,
          error: '',
          result: null,
          restore: { resume: normalizeResume(extracted.embedded), filename: file.name },
        });

        return;
      }

      if (!useVision && extracted.empty) {
        throw new Error(
          kind === 'pdf'
            ? 'This PDF has no text layer — it is a scan. Import it as an image instead, or use a screenshot.'
            : 'No readable text was found in that file.',
        );
      }

      if (!useVision && isTwoColumn(extracted.lines)) {
        warnings.push(
          'This looks like a two-column CV. Columns were read one at a time, but check the order below carefully.',
        );
      }

      setState((current) => ({
        ...current,
        stage: 'parsing',
        message: provider === 'smart' ? 'Asking the model' : 'Finding the sections',
        progress: -1,
      }));

      const parsed =
        provider === 'smart'
          ? await parseWithModel(
              useVision ? { imageDataUrl } : { text: extracted.text },
              settings,
              controller.signal,
            )
          : parseHeuristically(extracted);

      if (controller.signal.aborted) return;

      setState({
        stage: 'review',
        message: '',
        progress: 1,
        error: '',
        result: { provider, parsed, extracted, warnings },
        restore: null,
      });
    } catch (error) {
      if (controller.signal.aborted) return;

      setState({
        ...IDLE,
        stage: 'error',
        error: error instanceof Error ? error.message : 'That file could not be imported.',
      });
    }
  }, []);

  return {
    state,
    smartAvailable: isSmartConfigured(getSmartSettings()),
    run,
    cancel: useCallback(() => {
      abort.current?.abort();
      setState(IDLE);
    }, []),
    reset: useCallback(() => setState(IDLE), []),
  };
};
