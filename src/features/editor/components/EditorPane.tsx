'use client';

import { FilePlus2, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

import { Button, EmptyState } from '@/components/ui';
import { isPanelTarget, panelIdOf, type AtsFixTarget } from '@/constants';
import { useResume, useResumeActions } from '@/features/resume';
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
      <div className="p-4">
        <EmptyState
          icon={<FilePlus2 size={22} />}
          title="Start your resume"
          description="Fill in the form, or load a worked example to see how a finished resume is put together."
          action={
            <div className="flex gap-2">
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
      <nav
        aria-label="Resume sections"
        className="scroll-slim sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-border-base bg-surface/90 px-3 py-2 backdrop-blur"
      >
        {tabs.map((tab) => {
          const selected =
            active.kind === tab.target.kind && active.key === tab.target.key;

          return (
            <button
              key={tab.id}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => setActive(tab.target)}
              className={cn(
                'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition',
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

      <div className="flex flex-col gap-4 px-4 py-4">
        <header>
          <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-fg-subtle">{description}</p>
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
