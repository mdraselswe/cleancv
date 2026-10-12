'use client';

import { Field, RichTextEditor, Tabs } from '@/components/ui';
import { LIMITS, SUMMARY_MODES, SUMMARY_MODE_LABEL, SUMMARY_WORD_RANGE } from '@/constants';
import type { SummaryMode } from '@/constants';
import { useResume } from '@/features/resume';
import { cn } from '@/lib/cn';
import { stripEmphasis, wordCount } from '@/lib/text';

import { useResumeEdit } from '../../hooks/useResumeEdit';

const MODE_TABS = SUMMARY_MODES.map((value) => ({ value, label: SUMMARY_MODE_LABEL[value] }));

/**
 * Summary or objective.
 *
 * The mode switch changes the heading a parser sees, which matters: "Career
 * Objective" reads as a fresher's document and "Professional Summary" as an
 * experienced one.
 */
export const SummarySection = () => {
  const { summary } = useResume();
  const { patch } = useResumeEdit();

  const count = wordCount(stripEmphasis(summary.text));
  const outOfRange = count > 0 && (count < SUMMARY_WORD_RANGE.min || count > SUMMARY_WORD_RANGE.max);

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        items={MODE_TABS}
        value={summary.mode}
        onChange={(mode: SummaryMode) => patch('summary', { mode })}
        ariaLabel="Summary style"
        className="self-start"
      />

      <Field
        label={SUMMARY_MODE_LABEL[summary.mode]}
        hint={`Aim for ${SUMMARY_WORD_RANGE.min}–${SUMMARY_WORD_RANGE.max} words: what you do, how long, and the result you are known for.`}
        adornment={<span className={cn(outOfRange && 'text-warning')}>{count} words</span>}
      >
        {({ id, describedBy }) => (
          <RichTextEditor
            id={id}
            aria-label={SUMMARY_MODE_LABEL[summary.mode]}
            aria-describedby={describedBy}
            rows={5}
            maxLength={LIMITS.summaryChars}
            value={summary.text}
            placeholder="Senior Frontend Engineer with 8+ years of experience…"
            onChange={(text) => patch('summary', { text })}
          />
        )}
      </Field>
    </div>
  );
};
