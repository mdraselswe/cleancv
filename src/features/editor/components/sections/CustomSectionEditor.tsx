'use client';

import { Field, Input, Tabs, Textarea } from '@/components/ui';
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
        label="Heading"
        hint="This is what a recruiter and a parser both read. Keep it plain."
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
        ariaLabel="Section layout"
        className="self-start"
      />

      {section.layout === 'paragraph' ? (
        <Field label="Text">
          {({ id: fieldId, describedBy }) => (
            <Textarea
              id={fieldId}
              aria-describedby={describedBy}
              rows={5}
              maxLength={LIMITS.summaryChars}
              value={section.text}
              placeholder="A short paragraph."
              onChange={(event) =>
                actions.updateCustomSection(id, { text: event.target.value }, `custom:${id}:text`)
              }
            />
          )}
        </Field>
      ) : (
        <BulletsEditor
          label="Points"
          value={section.bullets}
          onChange={(bullets) => actions.updateCustomSection(id, { bullets })}
        />
      )}
    </div>
  );
};
