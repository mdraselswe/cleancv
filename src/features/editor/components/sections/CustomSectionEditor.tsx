'use client';

import { Field, Input, RichTextEditor, Tabs } from '@/components/ui';
import {
  CUSTOM_SECTION_LAYOUTS,
  CUSTOM_SECTION_LAYOUT_LABEL,
  LIMITS,
  customIdOf,
  type CustomSectionLayout,
  type CustomSectionSlot,
} from '@/constants';
import {
  UNTITLED_CUSTOM_HEADING,
  getCustomSection,
  useResume,
  useResumeActions,
} from '@/features/resume';

import { BulletsEditor } from '../BulletsEditor';

const LAYOUT_TABS = CUSTOM_SECTION_LAYOUTS.map((value) => ({
  value,
  label: CUSTOM_SECTION_LAYOUT_LABEL[value],
}));

export interface CustomSectionEditorProps {
  slot: CustomSectionSlot;
}

/**
 * The form for a user-invented section.
 *
 * Only two layouts are offered because only two extract cleanly: a paragraph
 * and a bullet list. Anything richer would need its own render path in every
 * template, and would be the first thing to break the parse gate.
 */
export const CustomSectionEditor = ({ slot }: CustomSectionEditorProps) => {
  const resume = useResume();
  const actions = useResumeActions();
  const section = getCustomSection(resume, slot);

  if (!section) return null;

  const id = customIdOf(slot);

  return (
    <div className="flex flex-col gap-3">
      <Field
        label="শিরোনাম"
        hint="রিক্রুটার আর পার্সার দুজনেই এটি পড়ে। সহজ ও সাদামাটা রাখুন।"
      >
        {({ id: fieldId, describedBy }) => (
          <Input
            id={fieldId}
            aria-describedby={describedBy}
            maxLength={60}
            value={section.heading}
            placeholder={UNTITLED_CUSTOM_HEADING}
            onChange={(event) =>
              actions.updateCustomSection(id, { heading: event.target.value }, `custom:${id}:heading`)
            }
          />
        )}
      </Field>

      <Tabs
        items={LAYOUT_TABS}
        value={section.layout}
        onChange={(layout: CustomSectionLayout) => actions.updateCustomSection(id, { layout })}
        ariaLabel="সেকশনের লেআউট"
        className="self-start"
      />

      {section.layout === 'paragraph' ? (
        <Field label="লেখা">
          {({ id: fieldId, describedBy }) => (
            <RichTextEditor
              id={fieldId}
              aria-label="লেখা"
              aria-describedby={describedBy}
              rows={5}
              maxLength={LIMITS.summaryChars}
              value={section.text}
              placeholder="একটি ছোট অনুচ্ছেদ।"
              onChange={(text) => actions.updateCustomSection(id, { text }, `custom:${id}:text`)}
            />
          )}
        </Field>
      ) : (
        <BulletsEditor
          label="পয়েন্ট"
          value={section.bullets}
          onChange={(bullets) => actions.updateCustomSection(id, { bullets })}
        />
      )}
    </div>
  );
};
