'use client';

import { Field, MonthInput, Switch } from '@/components/ui';
import type { DateRange } from '@/features/resume';
import { isRangeReversed } from '@/lib/date';

export interface DateRangeEditorProps {
  value: DateRange;
  onChange: (next: DateRange) => void;
  label?: string;
}

/**
 * Start, end and "current" as one control. `current` hides the end date rather
 * than merely ignoring it, so the two cannot disagree.
 */
export const DateRangeEditor = ({ value, onChange, label = 'Dates' }: DateRangeEditorProps) => {
  const reversed = isRangeReversed(value);

  return (
    <div className="col-span-2 flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <Field label={`${label} — start`}>
          {({ id }) => (
            <MonthInput
              id={id}
              value={value.start}
              onChange={(start) => onChange({ ...value, start })}
            />
          )}
        </Field>

        {!value.current ? (
          <Field label={`${label} — end`} error={reversed ? 'End is before start.' : undefined}>
            {({ id, invalid }) => (
              <MonthInput
                id={id}
                value={value.end}
                invalid={invalid}
                onChange={(end) => onChange({ ...value, end })}
              />
            )}
          </Field>
        ) : (
          <div className="flex items-end pb-1.5 text-[13px] text-fg-subtle">Ongoing</div>
        )}
      </div>

      <Switch
        checked={value.current}
        onChange={(current) => onChange({ ...value, current })}
        label="I currently hold this position"
      />
    </div>
  );
};
