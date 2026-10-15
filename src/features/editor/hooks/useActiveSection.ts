'use client';

import { useCallback, useMemo, useState } from 'react';

import { SECTION_META, SECTION_UI_LABEL, isCustomSlot, type SectionSlot } from '@/constants';
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
    label: 'জব ম্যাচ',
    description: 'চাকরির বিজ্ঞপ্তি পেস্ট করুন, দেখুন আপনার CV কতটা মেলে, আর চাইলে সেই অনুযায়ী একটি কপি বানান।',
  },
  design: {
    label: 'ডিজাইন',
    description: 'একটি ডিজাইন বেছে নিন, তারপর লেখার ধরন, ফাঁকা জায়গা আর রং ঠিক করুন।',
  },
  sections: {
    label: 'সেকশন',
    description: 'সেকশন চালু বা বন্ধ করুন, নাম বদলান আর ক্রম ঠিক করুন।',
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
      { id: 'contact', label: SECTION_UI_LABEL.contact, target: { kind: 'section', key: 'contact' } },
      ...enabled
        .filter((slot) => slot !== 'contact')
        .map((slot) => ({
          id: slot,
          label: isCustomSlot(slot) ? getSectionHeading(resume, slot) : SECTION_UI_LABEL[slot],
          target: { kind: 'section' as const, key: slot },
        })),
      { id: 'sections', label: 'সেকশন', target: { kind: 'panel', key: 'sections' } },
      { id: 'job', label: 'জব ম্যাচ', target: { kind: 'panel', key: 'job' } },
      { id: 'design', label: 'ডিজাইন', target: { kind: 'panel', key: 'design' } },
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
        description: 'আপনার নিজের বানানো একটি সেকশন। নাম বদলাতে “সেকশন” প্যানেলে যান।',
      };
    }

    const meta = SECTION_META[active.key];

    return {
      title: SECTION_UI_LABEL[active.key],
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
