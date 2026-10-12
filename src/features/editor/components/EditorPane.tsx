'use client';

import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { EmptyIllustration, SectionIllustration } from '@/components/illustrations';
import { Button } from '@/components/ui';
import { isPanelTarget, panelIdOf, type AtsFixTarget } from '@/constants';
import { useResume, useResumeActions } from '@/features/resume';
import { cn } from '@/lib/cn';
import { isBlank } from '@/lib/text';

import type { ActiveSectionController } from '../hooks/useActiveSection';
import type { SectionProgress } from '../hooks/useSectionProgress';
import { getPanelVisual, getSectionVisual } from '../sectionVisual';
import { SectionStrip } from './SectionNav';
import { SectionBodyEditor } from './SectionBodyEditor';
import { SectionManager } from './SectionManager';
import { DesignSection } from './sections/DesignSection';
import { DocumentNameSection } from './sections/ClosingSections';

export interface EditorPaneProps {
  /** Which form is showing; owned by the screen so the rail and the pane agree. */
  section: ActiveSectionController;
  progress: SectionProgress;
  /** The one-pane layout has no rail, so the pane carries its own strip. */
  showStrip: boolean;
  /** Where the score panel asked to go; cleared once handled. */
  pendingTarget?: AtsFixTarget | null;
  onPendingTargetHandled?: () => void;
  /** True once the reader has chosen to start from a blank form. */
  startedBlank?: boolean;
  onStartBlank?: () => void;
}

/**
 * The form column: the active section's form under a header that says what it
 * is for, and a stepper to the sections either side of it.
 */
export const EditorPane = ({
  section,
  progress,
  showStrip,
  pendingTarget,
  onPendingTargetHandled,
  startedBlank,
  onStartBlank,
}: EditorPaneProps) => {
  const resume = useResume();
  const actions = useResumeActions();
  const { active, setActive, tabs, title, description } = section;
  const rootRef = useRef<HTMLDivElement>(null);

  // A new section starts at its top, not wherever the last one was scrolled to.
  useEffect(() => {
    rootRef.current?.parentElement?.scrollTo({ top: 0 });
  }, [active.kind, active.key]);

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
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="animate-rise border-primary/15 from-primary-soft via-surface to-accent-soft rounded-panel flex w-full max-w-md flex-col items-center gap-3 border bg-gradient-to-br px-6 py-8 text-center shadow-sm">
          <div className="w-44">
            <EmptyIllustration />
          </div>
          <h2 className="text-fg text-xl font-extrabold tracking-tight">
            How do you want to begin?
          </h2>
          <div className="mt-1 flex w-full flex-col gap-3 text-left">
            <div className="border-border-base bg-surface/70 rounded-card flex flex-col gap-2 border p-3.5">
              <div>
                <p className="text-fg text-ui-md font-bold">Write my own CV</p>
                <p className="text-fg-muted text-ui mt-0.5 leading-snug">
                  The form opens empty and you type your own details. This is the right choice if
                  you are making your real CV.
                </p>
              </div>
              <Button
                variant="primary"
                className="self-start"
                onClick={() => {
                  onStartBlank?.();
                  setActive({ kind: 'section', key: 'contact' });
                }}
              >
                Start with an empty form
              </Button>
            </div>

            <div className="border-border-base bg-surface/70 rounded-card flex flex-col gap-2 border p-3.5">
              <div>
                <p className="text-fg text-ui-md font-bold">See an example first</p>
                <p className="text-fg-muted text-ui mt-0.5 leading-snug">
                  Fills in a made-up CV so you can see how a finished one looks. You can change or
                  clear every line afterwards.
                </p>
              </div>
              <Button
                variant="outline"
                className="self-start"
                onClick={actions.loadSample}
                leading={<Sparkles size={14} />}
              >
                Fill with example data
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visual =
    active.kind === 'panel' ? getPanelVisual(active.key) : getSectionVisual(active.key);
  const index = tabs.findIndex((tab) => tab.target.kind === active.kind && tab.target.key === active.key);
  const previous = index > 0 ? tabs[index - 1] : undefined;
  const next = index >= 0 && index < tabs.length - 1 ? tabs[index + 1] : undefined;

  return (
    <div ref={rootRef} className="flex min-h-full flex-col">
      {showStrip ? (
        <SectionStrip tabs={tabs} active={active} progress={progress} onSelect={setActive} />
      ) : null}

      {/*
        A form column is capped rather than stretched. At a tablet's full width
        every single-line field ran to seven hundred pixels, which is four
        times the longest value anyone types into one and a distance the eye
        has to travel back across for the next label.
      */}
      <div className="@container mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-4 px-4 py-5 sm:px-5">
        <header
          className={cn(
            `hue-${visual.hue} bg-hue-soft border-hue/20 rounded-panel relative flex items-center gap-3 overflow-hidden border px-4 py-3.5`,
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="text-hue-strong mb-1 flex items-center gap-1.5">
              <visual.Icon size={13} aria-hidden="true" />
              <span className="text-ui-2xs font-bold tracking-[0.14em] uppercase">
                {active.kind === 'panel' ? 'Customise' : 'Build your story'}
              </span>
            </div>
            <h2 className="text-fg text-xl font-extrabold tracking-tight">{title}</h2>
            <p className="text-fg-muted text-ui-xs mt-0.5 leading-snug">{description}</p>
          </div>
          <div className="hidden w-24 flex-none sm:block">
            <SectionIllustration scene={visual.scene} />
          </div>
        </header>

        {/* Keyed so each section arrives rather than swaps. */}
        <div key={`${active.kind}:${active.key}`} className="animate-rise flex flex-col gap-4">
          {active.kind === 'panel' && active.key === 'design' ? <DesignSection /> : null}
          {active.kind === 'panel' && active.key === 'sections' ? (
            <div className="flex flex-col gap-6">
              <DocumentNameSection />
              <SectionManager />
            </div>
          ) : null}
          {active.kind === 'section' ? <SectionBodyEditor sectionKey={active.key} /> : null}
        </div>

        {previous || next ? (
          <div className="border-border-base mt-auto flex items-center justify-between gap-2 border-t pt-4">
            {previous ? (
              <Button
                variant="ghost"
                onClick={() => setActive(previous.target)}
                leading={<ArrowLeft size={15} />}
              >
                {previous.label}
              </Button>
            ) : (
              <span />
            )}
            {next ? (
              <Button
                variant="primary"
                onClick={() => setActive(next.target)}
                trailing={<ArrowRight size={15} />}
              >
                Next: {next.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
