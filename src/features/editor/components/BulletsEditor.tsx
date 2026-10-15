'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button, RichTextEditor } from '@/components/ui';
import { AiPolish } from '@/features/ai';
import { useResume } from '@/features/resume';
import { BULLET_WORD_RANGE, LIMITS } from '@/constants';
import { bn } from '@/lib/bn';
import { cn } from '@/lib/cn';
import { hasMetric } from '@/lib/metrics';
import { stripEmphasis, wordCount } from '@/lib/text';

export interface BulletsEditorProps {
  value: readonly string[];
  onChange: (next: string[]) => void;
  label: string;
  max?: number;
  hint?: string;
  /** The role and employer these bullets belong to, for the AI's wording. */
  polishContext?: string;
}

/**
 * Bullet list editor with live coaching.
 *
 * The counters are the point: a bullet without a number is a duty, not an
 * achievement, and it is far cheaper to fix that here than to read about it in
 * the score panel afterwards.
 *
 * Each bullet is a small rich text editor, so the number can be made bold where
 * it is typed. Enter adds the next bullet and Backspace in an empty one removes
 * it, which is how a list is written without reaching for the mouse.
 */
export const BulletsEditor = ({
  value,
  onChange,
  label,
  max = LIMITS.bulletsPerEntry,
  hint,
  polishContext,
}: BulletsEditorProps) => {
  const jobDescription = useResume().meta.targetJobDescription;
  // The bullet that should take focus when it mounts, after Enter or a removal.
  const [focusRequest, setFocusRequest] = useState<{ index: number; token: number } | null>(null);
  const requestFocus = (index: number) =>
    setFocusRequest((current) => ({ index, token: (current?.token ?? 0) + 1 }));

  const update = (index: number, text: string) =>
    onChange(value.map((item, position) => (position === index ? text : item)));

  const remove = (index: number) => onChange(value.filter((_, position) => position !== index));

  const insertAfter = (index: number) => {
    if (value.length >= max) return;

    const next = [...value];
    next.splice(index + 1, 0, '');
    requestFocus(index + 1);
    onChange(next);
  };

  const removeAndFocusPrevious = (index: number) => {
    requestFocus(Math.max(0, index - 1));
    remove(index);
  };

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
          {bn(value.length)}/{bn(max)}
        </span>
      </div>

      {value.map((bullet, index) => {
        const plain = stripEmphasis(bullet);
        const count = wordCount(plain);
        const measured = hasMetric(plain);
        const tooLong = count > BULLET_WORD_RANGE.max;
        const tooShort = count > 0 && count < BULLET_WORD_RANGE.min;

        return (
          <div key={index} className="flex items-start gap-1.5">
            <div className="flex flex-col pt-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="বুলেট ওপরে সরান"
                className="tap-target text-fg-subtle hover:text-fg flex h-6 w-6 items-center justify-center rounded-md transition disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
                aria-label="বুলেট নিচে সরান"
                className="tap-target text-fg-subtle hover:text-fg flex h-6 w-6 items-center justify-center rounded-md transition disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <RichTextEditor
                aria-label={`${label} ${index + 1}`}
                value={bullet}
                rows={2}
                maxLength={LIMITS.bulletChars}
                placeholder="একটি কাজের শব্দ দিয়ে শুরু করুন, একটি সংখ্যা দিয়ে শেষ করুন।"
                autoFocus={focusRequest?.index === index}
                focusToken={focusRequest?.token}
                onChange={(text) => update(index, text)}
                onEnter={() => insertAfter(index)}
                onBackspaceEmpty={() => removeAndFocusPrevious(index)}
                footer={
                  <span className="text-ui-2xs flex flex-wrap items-center justify-end gap-x-2">
                    {count > 0 && !measured ? (
                      <span className="text-warning">এখনো সংখ্যা নেই — কী বদলেছে, কতটা?</span>
                    ) : null}
                    {tooLong ? <span className="text-warning">দুই লাইনে ছোট করুন।</span> : null}
                    <span className={cn(tooLong || tooShort ? 'text-warning' : 'text-fg-subtle')}>
                      {bn(count)} শব্দ
                    </span>
                  </span>
                }
              />
              <AiPolish
                kind="bullet"
                text={bullet}
                context={polishContext}
                jobDescription={jobDescription}
                onApply={(next) => update(index, next)}
              />
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="বুলেট মুছুন"
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
          onClick={() => {
            requestFocus(value.length);
            onChange([...value, '']);
          }}
        >
          বুলেট যোগ করুন
        </Button>
      ) : null}

      {hint ? <p className="text-ui-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
};
