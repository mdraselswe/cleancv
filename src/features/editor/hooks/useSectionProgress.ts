'use client';

import { useMemo } from 'react';

import { isBlank } from '@/lib/text';
import { isCustomSlot } from '@/constants';
import { sectionHasContent, useResume } from '@/features/resume';

import type { SectionTabItem } from './useActiveSection';

export interface SectionProgress {
  /** Tab ids of sections that already say something. */
  done: ReadonlySet<string>;
  completed: number;
  total: number;
  /** 0-100, for the bar. */
  percent: number;
}

/**
 * How much of the CV has been written, section by section.
 *
 * Derived from the document and never stored: it is a mirror of what is on
 * the page, so it cannot disagree with it. The profile counts only once it has
 * a name as well as a way to reach you — contact details under no name are
 * not a profile.
 */
export const useSectionProgress = (tabs: readonly SectionTabItem[]): SectionProgress => {
  const resume = useResume();

  return useMemo(() => {
    const done = new Set<string>();
    let total = 0;

    for (const tab of tabs) {
      if (tab.target.kind !== 'section') continue;

      total += 1;
      const slot = tab.target.key;
      const complete =
        !isCustomSlot(slot) && slot === 'contact'
          ? !isBlank(resume.basics.fullName) && sectionHasContent(resume, slot)
          : sectionHasContent(resume, slot);

      if (complete) done.add(tab.id);
    }

    return {
      done,
      completed: done.size,
      total,
      percent: total === 0 ? 0 : Math.round((done.size / total) * 100),
    };
  }, [tabs, resume]);
};
