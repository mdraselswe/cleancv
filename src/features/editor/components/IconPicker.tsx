'use client';

import { RESUME_ICON_KEYS, RESUME_ICON_LABEL, type ResumeIconKey } from '@/constants';
import { ICON_COMPONENTS, guessIcon } from '@/features/templates';
import { cn } from '@/lib/cn';

/**
 * Choosing the glyph beside a skill group or an achievement.
 *
 * "Automatic" comes first and stays the default, because guessing from the
 * group name is right nearly always and asks nothing of the user. The grid is
 * for the rest: "Soft Skills" and "Military Service" carry no signal a matcher
 * can read, and a wrong glyph is worse than a plain one.
 *
 * The Automatic swatch previews what the guess currently resolves to, so the
 * choice is visible rather than a leap.
 */

export interface IconPickerProps {
  value: ResumeIconKey;
  /** The group or achievement name, used to preview the automatic choice. */
  label: string;
  onChange: (icon: ResumeIconKey) => void;
}

export const IconPicker = ({ value, label, onChange }: IconPickerProps) => {
  const guessed = guessIcon(label);

  return (
    <div
      role="radiogroup"
      aria-label="আইকন"
      className="border-border-base rounded-control flex flex-wrap gap-1 border p-1.5"
    >
      {RESUME_ICON_KEYS.map((key) => {
        const selected = key === value;
        const resolved = key === 'auto' ? guessed : key;
        const Icon = resolved ? ICON_COMPONENTS[resolved] : null;

        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={RESUME_ICON_LABEL[key]}
            title={key === 'auto' ? 'স্বয়ংক্রিয় — আপনার লেখা নাম থেকে' : RESUME_ICON_LABEL[key]}
            onClick={() => onChange(key)}
            className={cn(
              'tap-target flex h-9 items-center justify-center rounded-lg border transition',
              key === 'auto' ? 'gap-1 px-2' : 'w-8',
              selected
                ? 'border-primary bg-primary-soft text-primary'
                : 'text-fg-muted hover:bg-surface-2 hover:text-fg border-transparent',
            )}
          >
            {key === 'auto' ? (
              <>
                <span className="text-ui-2xs font-medium">অটো</span>
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              </>
            ) : (
              Icon && <Icon className="h-4 w-4" />
            )}
          </button>
        );
      })}
    </div>
  );
};
