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
export const DateRangeEditor = ({ value, onChange, label = 'তারিখ' }: DateRangeEditorProps) => {
  const reversed = isRangeReversed(value);

  return (
    <div className="col-span-full flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
        <Field label={`${label} — শুরু`}>
          {({ id }) => (
            <MonthInput
              id={id}
              value={value.start}
              onChange={(start) => onChange({ ...value, start })}
            />
          )}
        </Field>

        {!value.current ? (
          <Field label={`${label} — শেষ`} error={reversed ? 'শেষের তারিখ শুরুর আগে হতে পারে না।' : undefined}>
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
          <div className="text-ui text-fg-subtle flex items-end pb-1.5">চলমান</div>
        )}
      </div>

      <Switch
        checked={value.current}
        onChange={(current) => onChange({ ...value, current })}
        label="আমি এখনো এই পদে আছি"
      />
    </div>
  );
};
