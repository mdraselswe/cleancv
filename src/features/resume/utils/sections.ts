import {
  CLOSING_SECTION_KEYS,
  SECTION_ENTRY_ICON,
  SECTION_HEADING_ICON,
  SECTION_META,
  customIdOf,
  isCustomSlot,
  type CustomSectionSlot,
  type PickableIcon,
  type SectionKey,
  type SectionSlot,
} from '@/constants';
import { isBlank } from '@/lib/text';

import type { CustomSection, Resume } from '../schema';
import { ENTRY_LIST_KEYS } from './entryLists';

/**
 * Section visibility.
 *
 * A section renders when the user has enabled it *and* it holds content. That
 * second condition is what keeps an empty heading from reaching the PDF, where
 * a parser would read it as a section with no entries.
 *
 * Everything here takes a `SectionSlot`, so a user-defined section is ordered,
 * toggled and rendered by the same code paths as a built-in one.
 */

/** Fallback heading for a custom section the user has not named yet. */
export const UNTITLED_CUSTOM_HEADING = 'Untitled Section';

export const getCustomSection = (
  resume: Resume,
  slot: CustomSectionSlot,
): CustomSection | undefined =>
  resume.customSections.find((section) => section.id === customIdOf(slot));

export const getSectionHeading = (resume: Resume, slot: SectionSlot): string => {
  if (isCustomSlot(slot)) {
    const heading = getCustomSection(resume, slot)?.heading ?? '';

    return isBlank(heading) ? UNTITLED_CUSTOM_HEADING : heading.trim();
  }

  const custom = resume.meta.sections[slot]?.heading;

  return isBlank(custom) ? SECTION_META[slot].defaultHeading : custom.trim();
};

/**
 * Whether this section draws its glyphs.
 *
 * Subtractive only: a template that declares no icon support draws none
 * regardless, and this cannot turn them on. Custom sections have no entries to
 * mark and no group glyphs, so the question does not arise for them. See
 * ADR-022.
 */
export const sectionShowsIcons = (resume: Resume, slot: SectionSlot): boolean =>
  isCustomSlot(slot) ? true : (resume.meta.sections[slot]?.showIcons ?? true);

/** The glyph marking each entry of a section, when it has one. */
export const getSectionEntryIcon = (slot: SectionSlot): PickableIcon | undefined =>
  isCustomSlot(slot) ? undefined : SECTION_ENTRY_ICON[slot];

/**
 * The glyph a design draws beside a section's *heading*.
 *
 * Undefined for a custom section, on purpose: nothing knows what one is about
 * except its heading, so the caller lets `CategoryIcon` guess from the words the
 * reader typed rather than stamping every custom section with the same shape.
 */
export const getSectionHeadingIcon = (slot: SectionSlot): PickableIcon | undefined =>
  isCustomSlot(slot) ? undefined : SECTION_HEADING_ICON[slot];

export const isSectionEnabled = (resume: Resume, slot: SectionSlot): boolean => {
  if (isCustomSlot(slot)) return getCustomSection(resume, slot)?.enabled ?? false;

  return resume.meta.sections[slot]?.enabled ?? SECTION_META[slot].defaultEnabled;
};

/** True when a section has something worth printing. */
export const sectionHasContent = (resume: Resume, slot: SectionSlot): boolean => {
  if (isCustomSlot(slot)) {
    const section = getCustomSection(resume, slot);
    if (!section) return false;

    return section.layout === 'paragraph'
      ? !isBlank(section.text)
      : section.bullets.some((bullet) => !isBlank(bullet));
  }

  switch (slot) {
    case 'contact':
      return (
        !isBlank(resume.contact.phone) ||
        !isBlank(resume.contact.email) ||
        !isBlank(resume.contact.location) ||
        !isBlank(resume.contact.linkedin) ||
        !isBlank(resume.contact.github) ||
        !isBlank(resume.contact.portfolio) ||
        resume.contact.links.length > 0
      );
    case 'summary':
      return !isBlank(resume.summary.text);
    case 'personal':
      return Object.values(resume.personal).some((value) => !isBlank(value));
    case 'interests':
      return resume.interests.items.length > 0;
    case 'references':
      return resume.references.mode === 'on-request' || resume.references.entries.length > 0;
    case 'declaration':
      return !isBlank(resume.declaration.text);
    case 'signature':
      return (
        (resume.signature.mode === 'typed' &&
          (!isBlank(resume.signature.typedName) || !isBlank(resume.basics.fullName))) ||
        (resume.signature.mode === 'image' && !isBlank(resume.signature.image))
      );
    default: {
      const value = resume[slot as keyof Resume];

      return Array.isArray(value) && value.length > 0;
    }
  }
};

export const isSectionVisible = (resume: Resume, slot: SectionSlot): boolean =>
  isSectionEnabled(resume, slot) && sectionHasContent(resume, slot);

/** Headless sections are placed structurally by templates, not as headed blocks. */
const isHeadless = (slot: SectionSlot): boolean =>
  !isCustomSlot(slot) && SECTION_META[slot].headless;

/**
 * Sections a template should render, in the user's order.
 * `contact` and `signature` are excluded: they are headless and templates place
 * them structurally (under the name, and at the very end).
 */
export const getVisibleSections = (resume: Resume): SectionSlot[] =>
  resume.meta.sectionOrder.filter((slot) => !isHeadless(slot) && isSectionVisible(resume, slot));

/** Enabled sections regardless of content — what the editor's nav rail lists. */
export const getEnabledSections = (resume: Resume): SectionSlot[] =>
  resume.meta.sectionOrder.filter((slot) => isSectionEnabled(resume, slot));

/** Narrowed helper for the places that still only handle the fixed registry. */
export const isBuiltInSlot = (slot: SectionSlot): slot is SectionKey => !isCustomSlot(slot);

/**
 * Where a custom section belongs when it is not being placed by hand: after the
 * substantive sections, before the closing ones. Used when a section is created
 * and when an order preset is applied.
 */
export const closingSlotIndex = (order: readonly SectionSlot[]): number => {
  const first = order.findIndex(
    (slot) => !isCustomSlot(slot) && CLOSING_SECTION_KEYS.includes(slot),
  );

  return first === -1 ? order.length : first;
};

/**
 * Rebuilds an order from a preset, keeping the user's custom sections.
 *
 * A preset only knows about built-in keys, so the custom slots are re-inserted
 * in their existing relative order rather than being dropped — applying a
 * preset must never lose content.
 */
export const applyPresetToOrder = (
  presetOrder: readonly SectionKey[],
  currentOrder: readonly SectionSlot[],
): SectionSlot[] => {
  const custom = currentOrder.filter(isCustomSlot);
  const next: SectionSlot[] = [...presetOrder];
  next.splice(closingSlotIndex(next), 0, ...custom);

  return next;
};

/**
 * The resume as it is printed: entries the reader has hidden are gone.
 *
 * One function, called wherever the document is rendered or scored, so a hidden
 * entry cannot appear in the preview yet be counted by the score, or reach the
 * PDF while missing from the preview. Returns the same object when nothing is
 * hidden, which keeps memoised consumers from re-running.
 */
export const withoutHiddenEntries = (resume: Resume): Resume => {
  const hidden = resume.meta.hiddenEntries;
  if (!hidden || hidden.length === 0) return resume;

  const skip = new Set(hidden);
  const next = { ...resume } as Record<string, unknown>;

  for (const key of ENTRY_LIST_KEYS) {
    next[key] = (resume[key] as Array<{ id: string }>).filter((entry) => !skip.has(entry.id));
  }

  return next as unknown as Resume;
};
