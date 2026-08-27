'use client';

import { GripVertical, Plus, Trash2 } from 'lucide-react';

import { Button, Textarea } from '@/components/ui';
import { BULLET_WORD_RANGE, LIMITS, METRIC_PATTERN } from '@/constants';
import { cn } from '@/lib/cn';
import { wordCount } from '@/lib/text';

export interface BulletsEditorProps {
  value: readonly string[];
  onChange: (next: string[]) => void;
  label: string;
  max?: number;
  hint?: string;
}

/**
 * Bullet list editor with live coaching.
 *
 * The counters are the point: a bullet without a number is a duty, not an
 * achievement, and it is far cheaper to fix that here than to read about it in
 * the score panel afterwards.
 */
export const BulletsEditor = ({
  value,
  onChange,
  label,
  max = LIMITS.bulletsPerEntry,
  hint,
}: BulletsEditorProps) => {
  const update = (index: number, text: string) =>
    onChange(value.map((item, position) => (position === index ? text : item)));

  const remove = (index: number) => onChange(value.filter((_, position) => position !== index));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;

    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-ui text-fg-muted font-medium">{label}</span>
        <span className="text-ui-2xs text-fg-subtle">
          {value.length}/{max}
        </span>
      </div>

      {value.map((bullet, index) => {
        const count = wordCount(bullet);
        const hasMetric = METRIC_PATTERN.test(bullet);
        const tooLong = count > BULLET_WORD_RANGE.max;
        const tooShort = count > 0 && count < BULLET_WORD_RANGE.min;

        return (
          <div key={index} className="flex items-start gap-1.5">
            <div className="flex flex-col pt-1.5">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move bullet up"
                className="text-fg-subtle hover:text-fg transition disabled:opacity-30"
              >
                <GripVertical size={14} />
              </button>
            </div>

            <div className="flex-1">
              <Textarea
                value={bullet}
                rows={2}
                maxLength={LIMITS.bulletChars}
                placeholder="Start with a verb, end with a number."
                onChange={(event) => update(index, event.target.value)}
              />
              <div className="text-ui-2xs mt-1 flex flex-wrap items-center gap-2">
                <span className={cn(tooLong || tooShort ? 'text-warning' : 'text-fg-subtle')}>
                  {count} words
                </span>
                {count > 0 && !hasMetric ? (
                  <span className="text-warning">
                    No number yet — what changed, and by how much?
                  </span>
                ) : null}
                {tooLong ? <span className="text-warning">Trim to two lines.</span> : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove bullet"
              className="tap-target text-fg-subtle hover:bg-surface-2 hover:text-danger mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-lg transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}

      {value.length < max ? (
        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          leading={<Plus size={14} />}
          onClick={() => onChange([...value, ''])}
        >
          Add bullet
        </Button>
      ) : null}

      {hint ? <p className="text-ui-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
};
