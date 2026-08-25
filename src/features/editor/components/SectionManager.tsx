'use client';

import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  Field,
  Input,
  SectionLabel,
  Select,
  SortableItem,
  SortableList,
  Switch,
} from '@/components/ui';
import {
  DEFAULT_PRESET_ID,
  MAX_CUSTOM_SECTIONS,
  SECTION_ENTRY_ICON,
  SECTION_META,
  SECTION_ORDER_PRESETS,
  customIdOf,
  isCustomSlot,
  type SectionSlot,
} from '@/constants';
import {
  UNTITLED_CUSTOM_HEADING,
  getCustomSection,
  useResume,
  useResumeActions,
  type Resume,
} from '@/features/resume';
import { getTemplate } from '@/features/templates';

const PRESET_HINT =
  'A preset reorders the built-in sections only — your own sections and every toggle stay put.';

const PRESET_OPTIONS = SECTION_ORDER_PRESETS.map((preset) => ({
  value: preset.id,
  label: preset.label,
}));

/** What a row needs to render, resolved the same way for built-in and custom slots. */
interface SlotRow {
  label: string;
  description: string;
  /** Heading a parser looks for; custom sections have none to compare against. */
  canonicalHeading: string | null;
  heading: string;
  enabled: boolean;
  locked: boolean;
  headless: boolean;
  customId: string | null;
  /** Whether this section draws its glyphs. */
  showIcons: boolean;
}

const resolveRow = (resume: Resume, slot: SectionSlot): SlotRow => {
  if (isCustomSlot(slot)) {
    const section = getCustomSection(resume, slot);

    return {
      label: section?.heading?.trim() || UNTITLED_CUSTOM_HEADING,
      description: 'Your own section.',
      canonicalHeading: null,
      heading: section?.heading ?? '',
      enabled: section?.enabled ?? false,
      locked: false,
      headless: false,
      customId: customIdOf(slot),
      showIcons: true,
    };
  }

  const meta = SECTION_META[slot];
  const setting = resume.meta.sections[slot];

  return {
    label: meta.defaultHeading,
    description: meta.description,
    canonicalHeading: meta.canonicalHeading,
    heading: setting?.heading ?? '',
    enabled: setting?.enabled ?? meta.defaultEnabled,
    locked: meta.locked,
    headless: meta.headless,
    customId: null,
    showIcons: setting?.showIcons ?? true,
  };
};

/**
 * Whether this section has any glyph to draw, so the switch is offered only
 * where it does something. A control over nothing is the thing ADR-019 is
 * about.
 */
const hasGlyphs = (slot: SectionSlot, entryMarkers: boolean): boolean => {
  if (isCustomSlot(slot)) return false;

  return (
    slot === 'skills' ||
    slot === 'achievements' ||
    (entryMarkers && Boolean(SECTION_ENTRY_ICON[slot]))
  );
};

/**
 * Which sections appear, what they are called, and in what order.
 *
 * Renaming is allowed but warned about: a parser looks for the canonical
 * heading, and "My Journey" is not one of them. A custom section gets no such
 * warning — there is no canonical name for a section the user invented.
 */
export const SectionManager = () => {
  const resume = useResume();
  const actions = useResumeActions();
  const { sectionOrder } = resume.meta;
  const atLimit = resume.customSections.length >= MAX_CUSTOM_SECTIONS;
  /*
   * The per-section switch is subtractive, so it is only worth showing on a
   * design that draws glyphs at all. On the others it would be a control with
   * nothing to control. See ADR-022.
   */
  const design = getTemplate(resume.meta.templateId).meta.supports;

  // Which preset was last applied is a hint for the reader, not resume data:
  // one drag afterwards and the order is the user's own.
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const activePreset = SECTION_ORDER_PRESETS.find((preset) => preset.id === activePresetId);

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel className="mb-1">Sections</SectionLabel>
      <p className="text-fg-subtle mb-1 text-[12px]">
        Order here is the order on the page. A section with no content is hidden automatically.
      </p>

      <div className="border-border-base mb-2 rounded-xl border p-3">
        <Field
          label="Start from an arrangement"
          hint={activePreset?.description ?? PRESET_HINT}
        >
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value=""
              placeholder="Choose a preset…"
              options={PRESET_OPTIONS}
              onChange={(event) => {
                const presetId = event.target.value;
                if (presetId) {
                  setActivePresetId(presetId);
                  actions.applySectionPreset(presetId);
                }
              }}
            />
          )}
        </Field>

        <Button
          size="sm"
          variant="ghost"
          className="mt-1.5 -ml-2"
          leading={<RotateCcw size={13} />}
          onClick={() => {
            setActivePresetId(DEFAULT_PRESET_ID);
            actions.applySectionPreset(DEFAULT_PRESET_ID);
          }}
        >
          Reset to the standard order
        </Button>
      </div>

      <SortableList
        ids={sectionOrder}
        onReorder={actions.moveSection}
        ariaLabel="Section order"
        className="flex flex-col gap-2"
      >
        {sectionOrder.map((slot, index) => {
          const row = resolveRow(resume, slot);

          return (
            <SortableItem key={slot} id={slot}>
              {(handle) => (
                <div className="border-border-base rounded-xl border px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="pt-0.5">{handle}</span>
                    <div className="min-w-0 flex-1">
                      <Switch
                        checked={row.enabled}
                        disabled={row.locked}
                        onChange={(value) => actions.toggleSection(slot, value)}
                        label={row.label}
                        description={row.description}
                      />
                    </div>

                    {row.customId ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${row.label}`}
                        title="Delete this section"
                        onClick={() => actions.removeCustomSection(row.customId as string)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    ) : null}

                    <div className="flex flex-none flex-col">
                      <button
                        type="button"
                        aria-label={`Move ${row.label} up`}
                        disabled={index === 0}
                        onClick={() => actions.moveSection(index, index - 1)}
                        className="text-fg-subtle hover:text-fg rounded p-0.5 transition disabled:opacity-25"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${row.label} down`}
                        disabled={index === sectionOrder.length - 1}
                        onClick={() => actions.moveSection(index, index + 1)}
                        className="text-fg-subtle hover:text-fg rounded p-0.5 transition disabled:opacity-25"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </div>

                  {row.enabled && !row.headless ? (
                    <div className="mt-2 flex items-center gap-2 pl-12">
                      <Input
                        value={row.heading}
                        placeholder={row.customId ? UNTITLED_CUSTOM_HEADING : row.label}
                        aria-label={`Heading for ${row.label}`}
                        className="h-8 text-[13px]"
                        onChange={(event) => actions.setSectionHeading(slot, event.target.value)}
                      />
                      {row.heading && !row.customId ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Reset heading"
                          title={`Reset to “${row.label}”`}
                          onClick={() => actions.setSectionHeading(slot, '')}
                        >
                          <RotateCcw size={13} />
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {row.enabled && design.icons && hasGlyphs(slot, design.entryMarkers) ? (
                    <div className="mt-2 pl-12">
                      <Switch
                        checked={row.showIcons}
                        onChange={(value) => actions.setSectionIcons(slot, value)}
                        label="Icons"
                        description="The marker in front of each entry, and the glyphs on groups."
                        className="text-[13px]"
                      />
                    </div>
                  ) : null}

                  {row.enabled && row.canonicalHeading && row.heading && row.heading !== row.label ? (
                    <p className="text-warning mt-1 pl-12 text-[11px]">
                      Parsers look for “{row.canonicalHeading}”. A custom name can cost you this
                      section.
                    </p>
                  ) : null}
                </div>
              )}
            </SortableItem>
          );
        })}
      </SortableList>

      <div className="mt-2">
        <Button
          variant="outline"
          leading={<Plus size={14} />}
          disabled={atLimit}
          onClick={() => actions.addCustomSection()}
        >
          Add a custom section
        </Button>
        <p className="text-fg-subtle mt-1.5 text-[11.5px]">
          {atLimit
            ? `You have reached the limit of ${MAX_CUSTOM_SECTIONS} custom sections.`
            : 'For anything the list above does not cover. Give it a heading a recruiter would recognise.'}
        </p>
      </div>
    </div>
  );
};
