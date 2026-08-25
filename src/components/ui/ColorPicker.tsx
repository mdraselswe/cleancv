'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface ColorSwatch {
  name: string;
  value: string;
}

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  swatches: readonly ColorSwatch[];
  label: string;
  className?: string;
}

/** Curated swatches plus a native picker for anything else. */
export const ColorPicker = ({ value, onChange, swatches, label, className }: ColorPickerProps) => {
  const normalized = value.toLowerCase();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-[13px] font-medium text-fg-muted">{label}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        {swatches.map((swatch) => {
          const selected = swatch.value.toLowerCase() === normalized;

          return (
            <button
              key={swatch.value}
              type="button"
              onClick={() => onChange(swatch.value)}
              title={swatch.name}
              aria-label={swatch.name}
              aria-pressed={selected}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition',
                'ring-offset-2 ring-offset-[var(--app-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected && 'ring-2 ring-fg-subtle',
              )}
              style={{ backgroundColor: swatch.value }}
            >
              {selected ? <Check size={13} className="text-white drop-shadow" /> : null}
            </button>
          );
        })}

        <label
          className="flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-border-strong px-2.5 text-[12px] text-fg-muted transition hover:border-primary hover:text-primary"
          title="Custom colour"
        >
          <span
            className="h-3 w-3 rounded-full border border-border-base"
            style={{ backgroundColor: value }}
          />
          Custom
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
};
