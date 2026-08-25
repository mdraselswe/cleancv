'use client';

import { create } from 'zustand';

import {
  DEFAULT_PRESET_ID,
  MAX_CUSTOM_SECTIONS,
  UNDO_HISTORY_LIMIT,
  SECTION_ORDER_PRESETS,
  customIdOf,
  customSlot,
  isCustomSlot,
} from '@/constants';
import type { SectionSlot, TemplateId } from '@/constants';
import { moveItem } from '@/lib/array';

import type { CustomSection, Resume, ResumeTheme } from '../schema';
import { createCustomSection, createEmptyResume } from '../utils/factories';
import { applyPresetToOrder, closingSlotIndex } from '../utils/sections';
import { ENTRY_FACTORY, type EntryListKey, type EntryOf } from '../utils/entryLists';
import { createSampleResume } from '../utils/sample';

/**
 * The single owner of the resume being edited.
 *
 * It holds one document and knows nothing about storage: `features/library`
 * loads a resume in and writes changes back out. That separation is what keeps
 * undo, scoring and the templates unaware that a library exists at all.
 *
 * History lives here rather than in a middleware so that edits can be coalesced:
 * typing a sentence is one undo step, not forty. Callers pass a `coalesceKey`
 * (usually the field path) and consecutive edits to the same field inside
 * COALESCE_WINDOW_MS replace the previous history entry instead of stacking.
 */

const COALESCE_WINDOW_MS = 900;

interface HistoryMarker {
  key: string;
  at: number;
}

interface ResumeState {
  resume: Resume;
  past: Resume[];
  future: Resume[];
  lastEdit: HistoryMarker | null;
}

export interface ResumeActions {
  replaceResume: (resume: Resume, options?: { resetHistory?: boolean }) => void;
  resetResume: () => void;
  loadSample: () => void;

  /** Generic escape hatch; prefer a named action when one exists. */
  edit: (mutate: (draft: Resume) => void, coalesceKey?: string) => void;

  addEntry: <K extends EntryListKey>(key: K) => string;
  updateEntry: <K extends EntryListKey>(
    key: K,
    id: string,
    patch: Partial<EntryOf<K>>,
    coalesceKey?: string,
  ) => void;
  removeEntry: (key: EntryListKey, id: string) => void;
  moveEntry: (key: EntryListKey, from: number, to: number) => void;
  duplicateEntry: (key: EntryListKey, id: string) => void;

  /**
   * `themeDefaults` come from the template's own meta. They are passed in rather
   * than looked up so this feature never imports features/templates, which
   * imports this one.
   */
  setTemplate: (templateId: TemplateId, themeDefaults?: Partial<ResumeTheme>) => void;
  setTheme: (patch: Partial<ResumeTheme>) => void;
  toggleSection: (slot: SectionSlot, enabled: boolean) => void;
  setSectionHeading: (slot: SectionSlot, heading: string) => void;
  /** Turns this section's glyphs on or off. Built-in sections only. */
  setSectionIcons: (slot: SectionSlot, showIcons: boolean) => void;
  moveSection: (from: number, to: number) => void;
  /** Reorders the built-in sections; custom ones keep their relative order. */
  applySectionPreset: (presetId: string) => void;
  setJobDescription: (text: string) => void;

  /** Returns the new section's slot so the caller can focus it. */
  addCustomSection: () => SectionSlot | null;
  updateCustomSection: (
    id: string,
    patch: Partial<CustomSection>,
    coalesceKey?: string,
  ) => void;
  removeCustomSection: (id: string) => void;

  undo: () => void;
  redo: () => void;
}

type ResumeStore = ResumeState & { actions: ResumeActions };

const initialState: ResumeState = {
  resume: createEmptyResume(),
  past: [],
  future: [],
  lastEdit: null,
};

/** Deep copies keep history snapshots independent of the live object. */
const snapshot = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const findCustom = (draft: Resume, id: string): CustomSection | undefined =>
  draft.customSections.find((section) => section.id === id);

export const useResumeStore = create<ResumeStore>()((set, get) => {
  /**
   * Applies a mutation to a copy of the resume and records history.
   * All writes go through here so undo can never miss a change.
   */
  const commit = (mutate: (draft: Resume) => void, coalesceKey?: string) => {
    const { resume, past, lastEdit } = get();
    const draft = snapshot(resume);
    mutate(draft);

    const now = Date.now();
    const coalesce =
      coalesceKey !== undefined &&
      lastEdit?.key === coalesceKey &&
      now - lastEdit.at < COALESCE_WINDOW_MS;

    const nextPast = coalesce ? past : [...past, resume].slice(-UNDO_HISTORY_LIMIT);

    set({
      resume: draft,
      past: nextPast,
      future: [],
      lastEdit: coalesceKey === undefined ? null : { key: coalesceKey, at: now },
    });
  };

  const actions: ResumeActions = {
    replaceResume: (resume, options) =>
      set((state) => ({
        resume,
        past: options?.resetHistory ? [] : [...state.past, state.resume].slice(-UNDO_HISTORY_LIMIT),
        future: [],
        lastEdit: null,
      })),

    resetResume: () => get().actions.replaceResume(createEmptyResume()),

    loadSample: () => get().actions.replaceResume(createSampleResume()),

    edit: (mutate, coalesceKey) => commit(mutate, coalesceKey),

    addEntry: (key) => {
      const entry = ENTRY_FACTORY[key]();
      commit((draft) => {
        (draft[key] as unknown[]).push(entry);
      });

      return entry.id;
    },

    updateEntry: (key, id, patch, coalesceKey) =>
      commit((draft) => {
        const list = draft[key] as Array<{ id: string }>;
        const index = list.findIndex((entry) => entry.id === id);
        if (index === -1) return;
        list[index] = { ...list[index], ...patch };
      }, coalesceKey),

    removeEntry: (key, id) =>
      commit((draft) => {
        const list = draft[key] as Array<{ id: string }>;
        const index = list.findIndex((entry) => entry.id === id);
        if (index === -1) return;
        list.splice(index, 1);
      }),

    moveEntry: (key, from, to) =>
      commit((draft) => {
        const list = draft[key] as unknown[];
        (draft[key] as unknown[]) = moveItem(list, from, to);
      }),

    duplicateEntry: (key, id) =>
      commit((draft) => {
        const list = draft[key] as Array<{ id: string }>;
        const index = list.findIndex((entry) => entry.id === id);
        if (index === -1) return;
        const copy = { ...snapshot(list[index]), id: ENTRY_FACTORY[key]().id };
        list.splice(index + 1, 0, copy);
      }),

    setTemplate: (templateId, themeDefaults) =>
      commit((draft) => {
        draft.meta.templateId = templateId;
        // A design that bleeds to the page edge needs its own margin.
        if (themeDefaults) draft.meta.theme = { ...draft.meta.theme, ...themeDefaults };
      }),

    setTheme: (patch) =>
      commit(
        (draft) => {
          draft.meta.theme = { ...draft.meta.theme, ...patch };
        },
        `theme:${Object.keys(patch).join(',')}`,
      ),

    toggleSection: (slot, enabled) =>
      commit((draft) => {
        if (isCustomSlot(slot)) {
          const section = findCustom(draft, customIdOf(slot));
          if (section) section.enabled = enabled;

          return;
        }

        draft.meta.sections[slot] = { ...draft.meta.sections[slot], enabled };
      }),

    setSectionIcons: (slot, showIcons) =>
      commit((draft) => {
        // Custom sections have no entries to mark and no group glyphs.
        if (isCustomSlot(slot)) return;

        draft.meta.sections[slot] = { ...draft.meta.sections[slot], showIcons };
      }),

    setSectionHeading: (slot, heading) =>
      commit(
        (draft) => {
          if (isCustomSlot(slot)) {
            const section = findCustom(draft, customIdOf(slot));
            if (section) section.heading = heading;

            return;
          }

          draft.meta.sections[slot] = { ...draft.meta.sections[slot], heading };
        },
        `heading:${slot}`,
      ),

    moveSection: (from, to) =>
      commit((draft) => {
        draft.meta.sectionOrder = moveItem(draft.meta.sectionOrder, from, to);
      }),

    applySectionPreset: (presetId) =>
      commit((draft) => {
        const preset =
          SECTION_ORDER_PRESETS.find((entry) => entry.id === presetId) ??
          SECTION_ORDER_PRESETS.find((entry) => entry.id === DEFAULT_PRESET_ID);
        if (!preset) return;

        draft.meta.sectionOrder = applyPresetToOrder(preset.order, draft.meta.sectionOrder);
      }),

    setJobDescription: (text) =>
      commit((draft) => {
        draft.meta.targetJobDescription = text;
      }, 'jd'),

    addCustomSection: () => {
      if (get().resume.customSections.length >= MAX_CUSTOM_SECTIONS) return null;

      const section = createCustomSection();
      commit((draft) => {
        draft.customSections.push(section);
        // Before the closing sections rather than dead last, which is where a
        // reader expects an extra section to appear.
        draft.meta.sectionOrder.splice(
          closingSlotIndex(draft.meta.sectionOrder),
          0,
          customSlot(section.id),
        );
      });

      return customSlot(section.id);
    },

    updateCustomSection: (id, patch, coalesceKey) =>
      commit((draft) => {
        const section = findCustom(draft, id);
        if (section) Object.assign(section, patch);
      }, coalesceKey),

    removeCustomSection: (id) =>
      commit((draft) => {
        draft.customSections = draft.customSections.filter((section) => section.id !== id);
        draft.meta.sectionOrder = draft.meta.sectionOrder.filter(
          (slot) => slot !== customSlot(id),
        );
      }),

    undo: () =>
      set((state) => {
        const previous = state.past.at(-1);
        if (!previous) return state;

        return {
          resume: previous,
          past: state.past.slice(0, -1),
          future: [state.resume, ...state.future].slice(0, UNDO_HISTORY_LIMIT),
          lastEdit: null,
        };
      }),

    redo: () =>
      set((state) => {
        const [next, ...rest] = state.future;
        if (!next) return state;

        return {
          resume: next,
          past: [...state.past, state.resume].slice(-UNDO_HISTORY_LIMIT),
          future: rest,
          lastEdit: null,
        };
      }),
  };

  return { ...initialState, actions };
});

/** Actions are stable; selecting them never re-renders a component. */
export const useResumeActions = (): ResumeActions => useResumeStore((state) => state.actions);

export const useResume = (): Resume => useResumeStore((state) => state.resume);
