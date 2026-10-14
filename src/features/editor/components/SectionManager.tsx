'use client';

import { ChevronDown, ChevronUp, LayoutTemplate, Plus, RotateCcw, Trash2 } from 'lucide-react';
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
  SECTION_UI_LABEL,
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
import { getTemplate, resolveSectionColumn } from '@/features/templates';
import { bn } from '@/lib/bn';

import { SectionMap } from './SectionMap';

const PRESET_HINT =
  'একটি প্রিসেট শুধু তৈরি করা সেকশনগুলোর ক্রম বদলায় — আপনার নিজের সেকশন আর প্রতিটি চালু/বন্ধ অবস্থা যেমন আছে তেমনই থাকে।';

const PRESET_OPTIONS = SECTION_ORDER_PRESETS.map((preset) => ({
  value: preset.id,
  label: preset.label,
}));

/** What a row needs to render, resolved the same way for built-in and custom slots. */
interface SlotRow {
  label: string;
  /** The heading the CV prints when the reader has not renamed it. */
  defaultHeading: string;
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
      defaultHeading: UNTITLED_CUSTOM_HEADING,
      description: 'আপনার নিজের সেকশন।',
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
    label: SECTION_UI_LABEL[slot],
    defaultHeading: meta.defaultHeading,
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
  const template = getTemplate(resume.meta.templateId).meta;
  const design = template.supports;

  // Which preset was last applied is a hint for the reader, not resume data:
  // one drag afterwards and the order is the user's own.
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const activePreset = SECTION_ORDER_PRESETS.find((preset) => preset.id === activePresetId);

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel className="mb-1">সেকশন</SectionLabel>
      <p className="text-fg-subtle text-ui-xs mb-1">
        এখানকার ক্রমই পেজের ক্রম। কোনো লেখা না থাকলে সেকশনটি নিজে থেকেই লুকিয়ে যায়।
      </p>

      <div className="border-border-base rounded-card mb-2 border p-3">
        <Field label="একটি সাজানো ক্রম থেকে শুরু করুন" hint={activePreset?.description ?? PRESET_HINT}>
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value=""
              placeholder="একটি প্রিসেট বেছে নিন…"
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

        <div className="mt-1.5 -ml-2 flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            leading={<RotateCcw size={13} />}
            onClick={() => {
              setActivePresetId(DEFAULT_PRESET_ID);
              actions.applySectionPreset(DEFAULT_PRESET_ID);
            }}
          >
            স্ট্যান্ডার্ড ক্রমে ফিরুন
          </Button>

          {/* The list says what the order is; the map says what it does. */}
          <Button
            size="sm"
            variant="ghost"
            leading={<LayoutTemplate size={13} />}
            onClick={() => setMapOpen(true)}
          >
            পেজের ওপর সাজান
          </Button>
        </div>
      </div>

      {/* Mounted only while open: it renders a second copy of the whole
          document to measure, which is not work to do on every keystroke. */}
      {mapOpen ? <SectionMap onClose={() => setMapOpen(false)} /> : null}

      <SortableList
        ids={sectionOrder}
        onReorder={actions.moveSection}
        ariaLabel="সেকশনের ক্রম"
        className="flex flex-col gap-2"
      >
        {sectionOrder.map((slot, index) => {
          const row = resolveRow(resume, slot);

          return (
            <SortableItem key={slot} id={slot}>
              {(handle) => (
                <div className="border-border-base rounded-card border px-3 py-2.5">
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
                        aria-label={`মুছুন: ${row.label}`}
                        title="এই সেকশন মুছুন"
                        onClick={() => actions.removeCustomSection(row.customId as string)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    ) : null}

                    <div className="flex flex-none flex-col">
                      <button
                        type="button"
                        aria-label={`${row.label} উপরে নিন`}
                        disabled={index === 0}
                        onClick={() => actions.moveSection(index, index - 1)}
                        className="tap-target text-fg-subtle hover:text-fg hover:bg-surface-2 flex h-7 w-7 items-center justify-center rounded-lg transition disabled:opacity-25"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`${row.label} নিচে নিন`}
                        disabled={index === sectionOrder.length - 1}
                        onClick={() => actions.moveSection(index, index + 1)}
                        className="tap-target text-fg-subtle hover:text-fg hover:bg-surface-2 flex h-7 w-7 items-center justify-center rounded-lg transition disabled:opacity-25"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </div>

                  {row.enabled && !row.headless ? (
                    <div className="mt-2 flex items-center gap-2 pl-12">
                      <Input
                        value={row.heading}
                        placeholder={row.defaultHeading}
                        aria-label={`${row.label}-এর শিরোনাম`}
                        className="text-ui h-8"
                        onChange={(event) => actions.setSectionHeading(slot, event.target.value)}
                      />
                      {row.heading && !row.customId ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="শিরোনাম আগের অবস্থায় ফেরান"
                          title={`“${row.defaultHeading}” এ ফিরুন`}
                          onClick={() => actions.setSectionHeading(slot, '')}
                        >
                          <RotateCcw size={13} />
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {/*
                    The column, for anyone not using a pointer: the page map is
                    the fast way to move a section across, this is the one that
                    works from the keyboard. See ADR-043.
                  */}
                  {row.enabled && !row.headless && design.columns === 2 ? (
                    <div className="mt-2 flex items-center gap-1.5 pl-12">
                      <span className="text-fg-subtle text-ui-xs">কলাম</span>
                      {(['main', 'side'] as const).map((column) => (
                        <Button
                          key={column}
                          size="sm"
                          variant={
                            resolveSectionColumn(resume, template, slot) === column
                              ? 'outline'
                              : 'ghost'
                          }
                          aria-pressed={resolveSectionColumn(resume, template, slot) === column}
                          onClick={() => actions.placeSection(slot, index, column)}
                        >
                          {column === 'main' ? 'প্রধান' : 'পাশের প্যানেল'}
                        </Button>
                      ))}
                    </div>
                  ) : null}

                  {row.enabled && design.icons && hasGlyphs(slot, design.entryMarkers) ? (
                    <div className="mt-2 pl-12">
                      <Switch
                        checked={row.showIcons}
                        onChange={(value) => actions.setSectionIcons(slot, value)}
                        label="আইকন"
                        description="প্রতিটি এন্ট্রির সামনের চিহ্ন, আর গ্রুপের আইকন।"
                        className="text-ui"
                      />
                    </div>
                  ) : null}

                  {row.enabled &&
                  row.canonicalHeading &&
                  row.heading &&
                  row.heading !== row.defaultHeading ? (
                    <p className="text-warning text-ui-2xs mt-1 pl-12">
                      পার্সার “{row.canonicalHeading}” খোঁজে। নিজের দেওয়া নাম হলে পার্সার এই সেকশনটি
                      চিনতে নাও পারে।
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
          নিজের একটি সেকশন যোগ করুন
        </Button>
        <p className="text-fg-subtle text-ui-2xs mt-1.5">
          {atLimit
            ? `আপনি সর্বোচ্চ ${bn(MAX_CUSTOM_SECTIONS)}টি নিজের সেকশন বানাতে পারেন, সীমায় পৌঁছে গেছেন।`
            : 'উপরের তালিকায় নেই এমন কিছুর জন্য। এমন একটি শিরোনাম দিন, যা রিক্রুটার সহজে চিনতে পারেন।'}
        </p>
      </div>
    </div>
  );
};
