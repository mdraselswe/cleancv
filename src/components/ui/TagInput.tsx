'use client';

import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

import { cn } from '@/lib/cn';

export interface TagInputProps {
  value: readonly string[];
  onChange: (next: string[]) => void;
  id?: string;
  placeholder?: string;
  max?: number;
  /** Offered as click-to-add chips under the field. */
  suggestions?: readonly string[];
  describedBy?: string;
  disabled?: boolean;
}

/**
 * Comma- or Enter-separated chips. Used for skills, tech stacks and coursework —
 * anywhere the resume stores a list of short strings.
 */
export const TagInput = ({
  value,
  onChange,
  id,
  placeholder = 'Type and press Enter',
  max = 40,
  suggestions,
  describedBy,
  disabled,
}: TagInputProps) => {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const candidates = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (candidates.length === 0) return;

    const existing = new Set(value.map((item) => item.toLowerCase()));
    const additions = candidates.filter((item) => !existing.has(item.toLowerCase()));

    if (additions.length > 0) onChange([...value, ...additions].slice(0, max));
    setDraft('');
  };

  const removeAt = (index: number) => onChange(value.filter((_, position) => position !== index));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
      return;
    }

    // Backspace on an empty field removes the last chip, as in every chip UI.
    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  const unusedSuggestions = suggestions?.filter(
    (item) => !value.some((tag) => tag.toLowerCase() === item.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-border-base bg-surface p-1.5',
          'focus-within:ring-2 focus-within:ring-ring',
          disabled && 'opacity-50',
        )}
      >
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded-md bg-surface-2 py-0.5 pl-2 pr-1 text-[13px] text-fg"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeAt(index)}
              disabled={disabled}
              aria-label={`Remove ${tag}`}
              className="rounded p-0.5 text-fg-subtle transition hover:bg-border-base hover:text-fg"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          id={id}
          value={draft}
          disabled={disabled || value.length >= max}
          aria-describedby={describedBy}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-0.5 text-sm text-fg outline-none placeholder:text-fg-subtle"
        />
      </div>

      {unusedSuggestions && unusedSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {unusedSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => add(suggestion)}
              className="rounded-md border border-dashed border-border-strong px-2 py-0.5 text-[12px] text-fg-subtle transition hover:border-primary hover:text-primary"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
