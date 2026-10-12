'use client';

import { Field, Input, MonthInput, RichTextEditor, Select, TagInput } from '@/components/ui';
import type { DateRange } from '@/features/resume';
import { cn } from '@/lib/cn';

import type { ResumeIconKey } from '@/constants';

import { BulletsEditor } from '../components/BulletsEditor';
import { DateRangeEditor } from '../components/DateRangeEditor';
import { IconPicker } from '../components/IconPicker';
import type { FieldDef } from './types';

export interface FieldRendererProps {
  field: FieldDef;
  /** The whole entry; a field reads its own key from it. */
  entry: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  /**
   * Replaces the field's own hint. Used where the current design changes what a
   * control does — an icon the chosen template will not draw, for instance.
   */
  hint?: string;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
const asArray = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);

/**
 * Renders one declared field. Holds no state: the value comes from the entry and
 * every keystroke goes straight to the store, which is what keeps the preview
 * and the score honest.
 */
export const FieldRenderer = ({ field, entry, onChange, hint }: FieldRendererProps) => {
  const span = field.span ?? 1;
  const className = cn(span === 2 && 'col-span-full');

  switch (field.kind) {
    case 'text':
      return (
        <Field label={field.label} hint={field.hint} className={className}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type={field.type ?? 'text'}
              maxLength={field.max}
              placeholder={field.placeholder}
              value={asString(entry[field.key])}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          )}
        </Field>
      );

    case 'textarea': {
      const value = asString(entry[field.key]);

      return (
        <Field
          label={field.label}
          hint={field.hint}
          className={cn('col-span-full', className)}
          adornment={field.max ? `${value.length}/${field.max}` : undefined}
        >
          {({ id, describedBy }) => (
            <RichTextEditor
              id={id}
              aria-label={field.label}
              aria-describedby={describedBy}
              rows={field.rows ?? 3}
              maxLength={field.max}
              placeholder={field.placeholder}
              value={value}
              onChange={(next) => onChange(field.key, next)}
            />
          )}
        </Field>
      );
    }

    case 'month':
      return (
        <Field label={field.label} hint={field.hint} className={className}>
          {({ id }) => (
            <MonthInput
              id={id}
              value={asString(entry[field.key])}
              onChange={(value) => onChange(field.key, value)}
            />
          )}
        </Field>
      );

    case 'select':
      return (
        <Field label={field.label} hint={field.hint} className={className}>
          {({ id }) => (
            <Select
              id={id}
              options={field.options}
              placeholder={field.placeholderOption}
              value={asString(entry[field.key])}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          )}
        </Field>
      );

    case 'tags':
      return (
        <Field label={field.label} hint={field.hint} className={cn('col-span-full', className)}>
          {({ id, describedBy }) => (
            <TagInput
              id={id}
              describedBy={describedBy}
              value={asArray(entry[field.key])}
              max={field.max}
              suggestions={field.suggestions}
              placeholder={field.placeholder}
              onChange={(next) => onChange(field.key, next)}
            />
          )}
        </Field>
      );

    case 'dateRange':
      return (
        <DateRangeEditor
          label={field.label}
          value={entry[field.key] as DateRange}
          onChange={(next) => onChange(field.key, next)}
        />
      );

    case 'bullets':
      return (
        <div className="col-span-full">
          <BulletsEditor
            label={field.label}
            hint={field.hint}
            max={field.max}
            value={asArray(entry[field.key])}
            onChange={(next) => onChange(field.key, next)}
          />
        </div>
      );

    case 'icon':
      return (
        <Field
          label={field.label}
          hint={hint ?? field.hint}
          className={cn('col-span-full', className)}
        >
          {() => (
            <IconPicker
              value={(entry[field.key] as ResumeIconKey) ?? 'auto'}
              label={asString(entry[field.fromKey])}
              onChange={(icon) => onChange(field.key, icon)}
            />
          )}
        </Field>
      );

    default:
      return null;
  }
};
