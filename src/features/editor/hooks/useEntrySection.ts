'use client';

import { useCallback, useMemo } from 'react';

import { LIMITS } from '@/constants';
import { useResume, useResumeActions, type EntryListKey } from '@/features/resume';
import { getTemplate } from '@/features/templates';
import { useExpandedSet } from '@/hooks';

export interface EntrySectionController {
  entries: Array<Record<string, unknown>>;
  canAdd: boolean;
  add: () => void;
  update: (id: string, key: string, value: unknown) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  move: (from: number, to: number) => void;
  isExpanded: (id: string) => boolean;
  setExpanded: (id: string, open: boolean) => void;
  /** The current design, so a field can say when its control will not show. */
  template: { name: string; icons: boolean };
}

/**
 * Store wiring for a repeatable section. The form component stays presentational
 * and receives these handlers, per the UI/logic split in the project skill.
 */
export const useEntrySection = (key: EntryListKey): EntrySectionController => {
  const resume = useResume();
  const actions = useResumeActions();
  const { isExpanded, setItemExpanded, expandOnly } = useExpandedSet();

  const entries = resume[key] as unknown as Array<Record<string, unknown>>;
  const { meta } = getTemplate(resume.meta.templateId);

  const add = useCallback(() => {
    const id = actions.addEntry(key);
    // A new entry is always the one you want open.
    expandOnly(id);
  }, [actions, key, expandOnly]);

  const update = useCallback(
    (id: string, field: string, value: unknown) => {
      actions.updateEntry(key, id, { [field]: value } as never, `${key}:${id}:${field}`);
    },
    [actions, key],
  );

  return useMemo(
    () => ({
      entries,
      canAdd: entries.length < LIMITS.entriesPerSection,
      add,
      update,
      remove: (id: string) => actions.removeEntry(key, id),
      duplicate: (id: string) => actions.duplicateEntry(key, id),
      move: (from: number, to: number) => actions.moveEntry(key, from, to),
      isExpanded,
      setExpanded: setItemExpanded,
      template: { name: meta.name, icons: meta.supports.icons },
    }),
    [entries, add, update, actions, key, isExpanded, setItemExpanded, meta],
  );
};
