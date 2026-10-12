'use client';

import { Check } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { useScrollEdges } from '@/hooks';
import { cn } from '@/lib/cn';

import type { ActiveTarget, SectionTabItem } from '../hooks/useActiveSection';
import type { SectionProgress } from '../hooks/useSectionProgress';
import { getPanelVisual, getSectionVisual } from '../sectionVisual';

const isSame = (a: ActiveTarget, b: ActiveTarget) => a.kind === b.kind && a.key === b.key;

const visualOf = (target: ActiveTarget) =>
  target.kind === 'panel' ? getPanelVisual(target.key) : getSectionVisual(target.key);

export interface SectionNavProps {
  tabs: readonly SectionTabItem[];
  active: ActiveTarget;
  progress: SectionProgress;
  onSelect: (target: ActiveTarget) => void;
}

/**
 * The editor's navigation as a vertical rail: every section with its glyph,
 * its colour and whether it has been written yet.
 *
 * Icon-only until there is room for names (`xl`) — the label stays in the
 * accessible name and the tooltip, so a narrow window loses the words and
 * never the control.
 */
export const SectionRail = ({ tabs, active, progress, onSelect }: SectionNavProps) => {
  const content = tabs.filter((tab) => tab.target.kind === 'section');
  const panels = tabs.filter((tab) => tab.target.kind === 'panel');

  return (
    <nav
      aria-label="Resume sections"
      className="border-border-base bg-surface/70 scroll-slim flex w-[64px] flex-none flex-col gap-1 overflow-y-auto border-r px-2 py-3 xl:w-[252px] xl:px-3"
    >
      <div className="mb-2 hidden xl:block">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-fg text-ui font-bold">Your CV</span>
          <span className="text-fg-subtle text-ui-xs tabular-nums">
            {progress.completed}/{progress.total} sections
          </span>
        </div>
        <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
          <div
            className="app-gradient-bg h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <ul className="flex flex-col gap-0.5">
        {content.map((tab) => (
          <RailItem
            key={tab.id}
            tab={tab}
            selected={isSame(active, tab.target)}
            done={progress.done.has(tab.id)}
            onSelect={onSelect}
          />
        ))}
      </ul>

      <div className="bg-border-base my-2 h-px" aria-hidden="true" />

      <ul className="flex flex-col gap-0.5">
        {panels.map((tab) => (
          <RailItem
            key={tab.id}
            tab={tab}
            selected={isSame(active, tab.target)}
            done={false}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </nav>
  );
};

interface RailItemProps {
  tab: SectionTabItem;
  selected: boolean;
  done: boolean;
  onSelect: (target: ActiveTarget) => void;
}

const RailItem = ({ tab, selected, done, onSelect }: RailItemProps) => {
  const { Icon, hue } = visualOf(tab.target);

  return (
    <li>
      <button
        type="button"
        aria-current={selected ? 'page' : undefined}
        title={tab.label}
        onClick={() => onSelect(tab.target)}
        className={cn(
          `hue-${hue} tap-target rounded-control group relative flex w-full items-center gap-2.5 px-1.5 py-1.5 text-left transition xl:px-2`,
          selected ? 'bg-hue-soft shadow-sm' : 'hover:bg-surface-2',
        )}
      >
        {selected ? (
          <span className="bg-hue absolute top-2 bottom-2 -left-2 w-1 rounded-r-full xl:-left-3" />
        ) : null}

        <span
          className={cn(
            'flex h-8 w-8 flex-none items-center justify-center rounded-lg transition',
            selected ? 'bg-hue text-white shadow-sm' : 'bg-hue-soft text-hue-strong group-hover:scale-105',
          )}
        >
          <Icon size={16} />
        </span>

        <span
          className={cn(
            'text-ui hidden min-w-0 flex-1 truncate xl:block',
            selected ? 'text-fg font-semibold' : 'text-fg-muted font-medium',
          )}
        >
          {tab.label}
        </span>

        {done ? (
          <span
            className="bg-success/15 text-success hidden h-5 w-5 flex-none items-center justify-center rounded-full xl:flex"
            aria-label="Done"
          >
            <Check size={12} strokeWidth={3} />
          </span>
        ) : null}
      </button>
    </li>
  );
};

/**
 * The same navigation as a horizontal strip, for the one-pane phone layout.
 * Scrolls, and says so by fading at whichever end still has names behind it.
 */
export const SectionStrip = ({ tabs, active, progress, onSelect }: SectionNavProps) => {
  const { ref: stripRef, edgeProps, scrollIntoView } = useScrollEdges();
  const selectedTab = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    scrollIntoView(selectedTab.current);
  }, [active, scrollIntoView]);

  return (
    <nav
      ref={stripRef}
      {...edgeProps}
      aria-label="Resume sections"
      className="scroll-fade scroll-none border-border-base bg-surface/85 sticky top-0 z-10 flex gap-1.5 overflow-x-auto scroll-smooth border-b px-3 py-2 backdrop-blur-xl"
    >
      {tabs.map((tab) => {
        const selected = isSame(active, tab.target);
        const { Icon, hue } = visualOf(tab.target);

        return (
          <button
            key={tab.id}
            ref={selected ? selectedTab : undefined}
            type="button"
            aria-current={selected ? 'page' : undefined}
            onClick={() => onSelect(tab.target)}
            className={cn(
              `hue-${hue} tap-target rounded-control text-ui flex flex-none items-center gap-1.5 px-2.5 py-1.5 font-medium whitespace-nowrap transition`,
              selected ? 'bg-hue text-white shadow-sm' : 'bg-hue-soft text-hue-strong',
            )}
          >
            <Icon size={14} />
            {tab.label}
            {progress.done.has(tab.id) && !selected ? (
              <Check size={12} strokeWidth={3} className="text-success" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
};
