'use client';

import { ChevronLeft, ChevronRight, FilePlus2, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button, EmptyState } from '@/components/ui';
import { isPanelTarget, panelIdOf, type AtsFixTarget } from '@/constants';
import { useResume, useResumeActions } from '@/features/resume';
import { useScrollEdges } from '@/hooks';
import { cn } from '@/lib/cn';
import { isBlank } from '@/lib/text';

import { useActiveSection } from '../hooks/useActiveSection';
import { SectionBodyEditor } from './SectionBodyEditor';
import { SectionManager } from './SectionManager';
import { DesignSection } from './sections/DesignSection';
import { DocumentNameSection } from './sections/ClosingSections';

export interface EditorPaneProps {
  /** Where the score panel asked to go; cleared once handled. */
  pendingTarget?: AtsFixTarget | null;
  onPendingTargetHandled?: () => void;
  /** True once the reader has chosen to start from a blank form. */
  startedBlank?: boolean;
  onStartBlank?: () => void;
}

/**
 * The form column: a tab strip that mirrors the document's section order, and
 * the active section's form beneath it.
 */
export const EditorPane = ({
  pendingTarget,
  onPendingTargetHandled,
  startedBlank,
  onStartBlank,
}: EditorPaneProps) => {
  const resume = useResume();
  const actions = useResumeActions();
  const { active, setActive, tabs, title, description } = useActiveSection();
  /*
   * Destructured rather than kept whole: React's lint rules read any property
   * of an object holding a ref as reading the ref during render. See ADR-042.
   */
  const { ref: stripRef, edgeProps, atStart, atEnd, scrollBy, scrollIntoView } = useScrollEdges();
  const selectedTab = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pendingTarget) return;

    // Some fixes are not in a section's form: a design that parses, tighter
    // type, a heading renamed back, a section switched on. See ADR-028.
    setActive(
      isPanelTarget(pendingTarget)
        ? { kind: 'panel', key: panelIdOf(pendingTarget) }
        : { kind: 'section', key: pendingTarget },
    );
    onPendingTargetHandled?.();
  }, [pendingTarget, setActive, onPendingTargetHandled]);

  /*
   * Keep the selected tab on screen. Only the first few names fit, so a
   * section reached from anywhere but the strip itself — the score panel's
   * "Fix it", the toolbar's "Change the design", a tab remembered across a
   * reload — would otherwise be highlighted somewhere off to the right where
   * nobody can see which one is current.
   */
  useEffect(() => {
    scrollIntoView(selectedTab.current);
  }, [active, scrollIntoView]);

  /*
   * The prompt is about what to do next, not about what the document holds. It
   * was gated on emptiness alone, which made "Start blank" inert: it opened the
   * contact section and then the prompt rendered over it again, so the only way
   * past was to load the sample.
   */
  const isBlankDocument =
    isBlank(resume.basics.fullName) &&
    isBlank(resume.summary.text) &&
    resume.experience.length === 0;
  const isEmpty = isBlankDocument && !startedBlank;

  if (isEmpty) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<FilePlus2 size={22} />}
          title="Start your resume"
          description="Fill in the form, or load a worked example to see how a finished resume is put together."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="primary"
                onClick={actions.loadSample}
                leading={<Sparkles size={14} />}
              >
                Load the sample
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onStartBlank?.();
                  setActive({ kind: 'section', key: 'contact' });
                }}
              >
                Start blank
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {/*
        Twelve section names do not fit any pane this app has, so the strip
        scrolls. What it owes the reader is a way to know that: the mask fades
        whichever end still has names behind it, and on a pointer device the
        arrows scroll it without a trackpad gesture. See `useScrollEdges`.
      */}
      <div className="border-border-base bg-surface/90 sticky top-0 z-10 flex items-center border-b backdrop-blur">
        <StripArrow side="start" atEdge={atStart} onClick={() => scrollBy(-200)} />

        <nav
          ref={stripRef}
          {...edgeProps}
          aria-label="Resume sections"
          className="scroll-fade scroll-none flex flex-1 gap-1 overflow-x-auto scroll-smooth px-3 py-2"
        >
          {tabs.map((tab) => {
            const selected = active.kind === tab.target.kind && active.key === tab.target.key;

            return (
              <button
                key={tab.id}
                ref={selected ? selectedTab : undefined}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => setActive(tab.target)}
                className={cn(
                  'tap-target rounded-control text-ui px-2.5 py-1.5 font-medium whitespace-nowrap transition',
                  selected
                    ? 'bg-primary-soft text-primary'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <StripArrow side="end" atEdge={atEnd} onClick={() => scrollBy(200)} />
      </div>

      {/*
        A form column is capped rather than stretched. At a tablet's full width
        every single-line field ran to seven hundred pixels, which is four
        times the longest value anyone types into one and a distance the eye
        has to travel back across for the next label.
      */}
      <div className="@container mx-auto flex w-full max-w-[680px] flex-col gap-4 px-4 py-4">
        <header>
          <h2 className="text-fg text-ui-lg font-semibold">{title}</h2>
          <p className="text-fg-subtle text-ui-xs mt-0.5">{description}</p>
        </header>

        {active.kind === 'panel' && active.key === 'design' ? <DesignSection /> : null}
        {active.kind === 'panel' && active.key === 'sections' ? (
          <div className="flex flex-col gap-6">
            <DocumentNameSection />
            <SectionManager />
          </div>
        ) : null}
        {active.kind === 'section' ? <SectionBodyEditor sectionKey={active.key} /> : null}
      </div>
    </div>
  );
};

interface StripArrowProps {
  side: 'start' | 'end';
  /** Nothing left to scroll this way: kept in the layout, faded out. */
  atEdge: boolean;
  onClick: () => void;
}

/**
 * Shown only to a wide window with a mouse in it.
 *
 * A finger swipes the strip, so on a touch screen this is a sub-thumb-sized
 * target that duplicates a gesture the reader already has — the two variants
 * are stacked rather than written as separate classes so the media queries
 * nest and neither can win over the other by ordering.
 *
 * Hidden from assistive technology: every tab it reaches is already in the
 * strip, and this only moves the viewport.
 */
const StripArrow = ({ side, atEdge, onClick }: StripArrowProps) => (
  <button
    type="button"
    tabIndex={-1}
    aria-hidden="true"
    onClick={onClick}
    className={cn(
      'text-fg-subtle hover:text-fg hidden h-7 w-6 flex-none items-center justify-center transition sm:pointer-fine:flex',
      atEdge && 'pointer-events-none opacity-0',
    )}
  >
    {side === 'start' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
  </button>
);
