'use client';

import { useMemo } from 'react';

import { DEBOUNCE_MS } from '@/constants';
import { useResume } from '@/features/resume';
import { getTemplate } from '@/features/templates';
import { useDebouncedValue } from '@/hooks';

import { evaluateResume } from '../engine';
import type { AtsScore, KeywordMatch } from '../types';
import { extractJobKeywords, matchKeywords } from '../utils/collect';
import { estimatePages } from '../utils/pages';

export interface AtsScoreResult {
  score: AtsScore;
  keywords: KeywordMatch;
  /** True while the debounced snapshot is behind the live document. */
  stale: boolean;
}

export interface UseAtsScoreOptions {
  /**
   * Page count measured by the preview. Pass 0 when the preview is not mounted
   * — on the mobile Score tab it never is — and the content-based estimate
   * stands in, so the length rule reports something true either way.
   */
  measuredPages: number;
  /** Body text size in points measured from the preview; 0 when it is not mounted. */
  measuredBodyPt?: number;
}

/**
 * The live score.
 *
 * Debounced so scoring never runs on the keystroke path, and memoised on the
 * debounced snapshot so a re-render for any other reason does not re-run 25 rules.
 */
export const useAtsScore = ({
  measuredPages,
  measuredBodyPt = 0,
}: UseAtsScoreOptions): AtsScoreResult => {
  const resume = useResume();
  const debounced = useDebouncedValue(resume, DEBOUNCE_MS.atsScore);

  const estimatedPages = useMemo(
    () => (measuredPages > 0 ? measuredPages : estimatePages(debounced)),
    [measuredPages, debounced],
  );

  const jobKeywords = useMemo(
    () => extractJobKeywords(debounced.meta.targetJobDescription),
    [debounced.meta.targetJobDescription],
  );

  const score = useMemo(
    () =>
      evaluateResume(debounced, {
        template: getTemplate(debounced.meta.templateId).meta,
        jobKeywords,
        estimatedPages,
        measuredBodyPt,
      }),
    [debounced, jobKeywords, estimatedPages, measuredBodyPt],
  );

  const keywords = useMemo(
    () => matchKeywords(debounced, jobKeywords),
    [debounced, jobKeywords],
  );

  return { score, keywords, stale: debounced !== resume };
};
