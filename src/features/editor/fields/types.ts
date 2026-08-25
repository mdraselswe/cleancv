import type { SelectOption } from '@/components/ui';

/**
 * Declarative form fields.
 *
 * Fifteen list sections differ only in which fields they show, so they are
 * described as data and rendered by one component. Adding a section becomes a
 * config entry rather than another near-identical form.
 */

interface BaseField {
  /** Property on the entry object. */
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
  /** Columns the field occupies in the 2-up grid. */
  span?: 1 | 2;
}

export interface TextField extends BaseField {
  kind: 'text';
  max?: number;
  type?: 'text' | 'email' | 'tel' | 'url';
}

export interface TextareaField extends BaseField {
  kind: 'textarea';
  max?: number;
  rows?: number;
}

export interface MonthField extends BaseField {
  kind: 'month';
}

export interface SelectField extends BaseField {
  kind: 'select';
  options: readonly SelectOption[];
  placeholderOption?: string;
}

export interface TagsField extends BaseField {
  kind: 'tags';
  suggestions?: readonly string[];
  max?: number;
}

/** Start / end / current, edited as one unit. */
export interface DateRangeField extends BaseField {
  kind: 'dateRange';
}

export interface BulletsField extends BaseField {
  kind: 'bullets';
  max?: number;
}

/** Glyph for a skill group or achievement. Previews the automatic choice. */
export interface IconField extends BaseField {
  kind: 'icon';
  /** Entry key whose text the automatic choice is guessed from. */
  fromKey: string;
}

export type FieldDef =
  | TextField
  | TextareaField
  | MonthField
  | SelectField
  | TagsField
  | DateRangeField
  | BulletsField
  | IconField;

/** Everything needed to render and label one repeatable section. */
export interface EntrySectionConfig {
  fields: readonly FieldDef[];
  /** Entry keys used to build a collapsed card's title and subtitle. */
  titleKey: string;
  subtitleKey?: string;
  /** Label for the add button, e.g. 'Add role'. */
  addLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}
