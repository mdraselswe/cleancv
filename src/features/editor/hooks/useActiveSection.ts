'use client';

import { useCallback, useMemo, useState } from 'react';

import { SECTION_META, isCustomSlot, type SectionSlot } from '@/constants';
import { getEnabledSections, getSectionHeading, useResume } from '@/features/resume';

/** Panels the editor column can show beyond the resume's own sections. */
export type EditorPanel = 'design' | 'sections' | 'job';

export type ActiveTarget =
  | { kind: 'section'; key: SectionSlot }
  | { kind: 'panel'; key: EditorPanel };

export interface SectionTabItem {
  id: string;
  label: string;
  target: ActiveTarget;
}

export interface ActiveSectionController {
  active: ActiveTarget;
  setActive: (target: ActiveTarget) => void;
  tabs: SectionTabItem[];
  title: string;
  description: string;
}

const PANEL_META: Record<EditorPanel, { label: string; description: string }> = {
  job: {
    label: 'Job match',
    description: 'Paste a job posting, see how your CV matches it, and make a tailored copy.',
  },
  design: {
    label: 'Design',
    description: 'Choose a template and tune type, spacing and colour.',
  },
  sections: {
    label: 'Sections',
    description: 'Turn sections on or off, rename them, and set their order.',
  },
};

/**
 * Which form the editor column is showing.
 *
 * Tabs follow the resume's own section order, so the editor and the document
 * agree on what comes first — moving a section moves its tab.
 */
export const useActiveSection = (): ActiveSectionController => {
  const resume = useResume();
  const [active, setActive] = useState<ActiveTarget>({ kind: 'section', key: 'contact' });

  const enabled = getEnabledSections(resume);

  const tabs = useMemo<SectionTabItem[]>(
    () => [
      { id: 'contact', label: 'Profile', target: { kind: 'section', key: 'contact' } },
      ...enabled
        .filter((slot) => slot !== 'contact')
        .map((slot) => ({
          id: slot,
          label: isCustomSlot(slot) ? getSectionHeading(resume, slot) : SECTION_META[slot].defaultHeading,
          target: { kind: 'section' as const, key: slot },
        })),
      { id: 'sections', label: 'Sections', target: { kind: 'panel', key: 'sections' } },
      { id: 'job', label: 'Job match', target: { kind: 'panel', key: 'job' } },
      { id: 'design', label: 'Design', target: { kind: 'panel', key: 'design' } },
    ],
    [enabled, resume],
  );

  const { title, description } = useMemo(() => {
    if (active.kind === 'panel') {
      return { title: PANEL_META[active.key].label, description: PANEL_META[active.key].description };
    }

    if (isCustomSlot(active.key)) {
      return {
        title: getSectionHeading(resume, active.key),
        description: 'A section of your own. Rename it under Sections.',
      };
    }

    const meta = SECTION_META[active.key];

    return {
      title: active.key === 'contact' ? 'Profile' : meta.defaultHeading,
      description: meta.description,
    };
  }, [active, resume]);

  return {
    active,
    setActive: useCallback((target: ActiveTarget) => setActive(target), []),
    tabs,
    title,
    description,
  };
};
