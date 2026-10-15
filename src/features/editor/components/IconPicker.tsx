'use client';

import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ICON_CATALOG,
  ICON_GROUPS,
  ICON_GROUP_LABEL,
  type IconCatalogEntry,
  type PickableIcon,
  type ResumeIconKey,
} from '@/constants';
import { ICON_COMPONENTS, guessIcon } from '@/features/templates';
import { useLang } from '@/i18n';
import { cn } from '@/lib/cn';

/**
 * Choosing the glyph beside a skill group or an achievement.
 *
 * "Automatic" comes first and stays the default, because guessing from the
 * group name is right nearly always and asks nothing of the user. The grid is
 * for the rest: "Soft Skills" and "Military Service" carry no signal a matcher
 * can read, and a wrong glyph is worse than a plain one.
 *
 * The catalogue is long, so it is searchable - by the Bangla name, the English
 * name, or a synonym ("docker", "nurse", "seo") - and grouped when it is not.
 * The Automatic swatch previews what the guess currently resolves to, so the
 * choice is visible rather than a leap.
 */

export interface IconPickerProps {
  value: ResumeIconKey;
  /** The group or achievement name, used to preview the automatic choice. */
  label: string;
  onChange: (icon: ResumeIconKey) => void;
}

const COPY = {
  bn: {
    auto: 'অটো',
    autoHint: 'স্বয়ংক্রিয় — আপনার লেখা নাম থেকে',
    search: 'আইকন খুঁজুন: কোড, ডেটা, ডাক্তার…',
    clear: 'খোঁজা মুছুন',
    none: 'এই নামে কোনো আইকন পাওয়া যায়নি। অন্য একটি শব্দ লিখে দেখুন।',
    group: 'আইকন',
  },
  en: {
    auto: 'Auto',
    autoHint: 'Automatic — from the name you typed',
    search: 'Search icons: code, data, doctor…',
    clear: 'Clear search',
    none: 'No icon matches that. Try another word.',
    group: 'Icon',
  },
} as const;

export const IconPicker = ({ value, label, onChange }: IconPickerProps) => {
  const lang = useLang();
  const copy = COPY[lang];
  const [query, setQuery] = useState('');
  const guessed = guessIcon(label);

  const needle = query.trim().toLowerCase();
  const results = useMemo(
    () => (needle ? ICON_CATALOG.filter((entry) => ` ${entry.search}`.includes(` ${needle}`)) : []),
    [needle],
  );

  const nameOf = (entry: IconCatalogEntry) => (lang === 'en' ? entry.en : entry.bn);

  const renderTile = (entry: IconCatalogEntry) => {
    const Icon = ICON_COMPONENTS[entry.key];
    const selected = entry.key === value;

    return (
      <button
        key={entry.key}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={nameOf(entry)}
        title={nameOf(entry)}
        onClick={() => onChange(entry.key)}
        className={cn(
          'tap-target flex h-9 w-9 items-center justify-center rounded-lg border transition',
          selected
            ? 'border-primary bg-primary-soft text-primary'
            : 'text-fg-muted hover:bg-surface-2 hover:text-fg border-transparent',
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>
    );
  };

  const autoIcon: PickableIcon | null = guessed;
  const AutoGlyph = autoIcon ? ICON_COMPONENTS[autoIcon] : null;
  const selectedEntry = ICON_CATALOG.find((entry) => entry.key === value);

  return (
    <div className="border-border-base rounded-control flex flex-col gap-2 border p-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={value === 'auto'}
          title={copy.autoHint}
          onClick={() => onChange('auto')}
          className={cn(
            'tap-target flex h-9 flex-none items-center gap-1 rounded-lg border px-2.5 transition',
            value === 'auto'
              ? 'border-primary bg-primary-soft text-primary'
              : 'text-fg-muted hover:bg-surface-2 hover:text-fg border-transparent',
          )}
        >
          <span className="text-ui-2xs font-semibold">{copy.auto}</span>
          {AutoGlyph ? <AutoGlyph className="h-3.5 w-3.5" /> : null}
        </button>

        <label className="relative min-w-0 flex-1">
          <Search
            size={14}
            aria-hidden="true"
            className="text-fg-subtle pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
            aria-label={copy.search}
            className="border-border-base bg-surface text-ui text-fg placeholder:text-fg-subtle focus:border-primary h-9 w-full rounded-lg border pr-8 pl-8 outline-none"
          />
          {query ? (
            <button
              type="button"
              aria-label={copy.clear}
              onClick={() => setQuery('')}
              className="text-fg-subtle hover:text-fg absolute top-1/2 right-1.5 -translate-y-1/2 p-1"
            >
              <X size={14} />
            </button>
          ) : null}
        </label>
      </div>

      {selectedEntry ? (
        <p className="text-fg-muted text-ui-xs flex items-center gap-1.5 px-0.5">
          {(() => {
            const Selected = ICON_COMPONENTS[selectedEntry.key];

            return <Selected className="text-primary h-3.5 w-3.5" />;
          })()}
          <span className="font-medium">{nameOf(selectedEntry)}</span>
        </p>
      ) : null}

      <div
        role="radiogroup"
        aria-label={copy.group}
        className="scroll-slim flex max-h-60 flex-col gap-2.5 overflow-y-auto pr-0.5"
      >
        {needle ? (
          results.length > 0 ? (
            <div className="flex flex-wrap gap-0.5">{results.map(renderTile)}</div>
          ) : (
            <p className="text-fg-subtle text-ui-xs px-1 py-2">{copy.none}</p>
          )
        ) : (
          ICON_GROUPS.map((group) => (
            <section key={group}>
              <h4 className="text-fg-subtle text-ui-2xs mb-1 px-0.5 font-bold tracking-wide uppercase">
                {ICON_GROUP_LABEL[group][lang]}
              </h4>
              <div className="flex flex-wrap gap-0.5">
                {ICON_CATALOG.filter((entry) => entry.group === group).map(renderTile)}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
