'use client';

import { Field, RichTextEditor, Tabs } from '@/components/ui';
import { AiPolish, AiWriter } from '@/features/ai';
import { LIMITS, SUMMARY_MODES, SUMMARY_WORD_RANGE } from '@/constants';
import type { SummaryMode } from '@/constants';
import { useResume } from '@/features/resume';
import { bn } from '@/lib/bn';
import { cn } from '@/lib/cn';
import { stripEmphasis, wordCount } from '@/lib/text';

import { useResumeEdit } from '../../hooks/useResumeEdit';

/** What the tabs say. The CV itself still prints the English heading from SUMMARY_MODE_LABEL. */
const MODE_UI_LABEL: Record<SummaryMode, string> = {
  summary: 'পেশাগত সংক্ষিপ্ত পরিচিতি',
  objective: 'ক্যারিয়ারের লক্ষ্য',
};

const MODE_TABS = SUMMARY_MODES.map((value) => ({ value, label: MODE_UI_LABEL[value] }));

/**
 * Summary or objective.
 *
 * The mode switch changes the heading a parser sees, which matters: "Career
 * Objective" reads as a fresher's document and "Professional Summary" as an
 * experienced one.
 */
export const SummarySection = () => {
  const { summary, meta } = useResume();
  const targetJobDescription = meta.targetJobDescription;
  const { patch } = useResumeEdit();

  const count = wordCount(stripEmphasis(summary.text));
  const outOfRange = count > 0 && (count < SUMMARY_WORD_RANGE.min || count > SUMMARY_WORD_RANGE.max);

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        items={MODE_TABS}
        value={summary.mode}
        onChange={(mode: SummaryMode) => patch('summary', { mode })}
        ariaLabel="সংক্ষিপ্ত পরিচিতিের ধরন"
        className="self-start"
      />

      <Field
        label={MODE_UI_LABEL[summary.mode]}
        hint={`${bn(SUMMARY_WORD_RANGE.min)} থেকে ${bn(SUMMARY_WORD_RANGE.max)} শব্দের মধ্যে রাখুন: আপনি কী করেন, কত দিন ধরে করছেন, আর কোন ফলাফলের জন্য পরিচিত।`}
        adornment={<span className={cn(outOfRange && 'text-warning')}>{bn(count)} শব্দ</span>}
      >
        {({ id, describedBy }) => (
          <RichTextEditor
            id={id}
            aria-label={MODE_UI_LABEL[summary.mode]}
            aria-describedby={describedBy}
            rows={5}
            maxLength={LIMITS.summaryChars}
            value={summary.text}
            placeholder="Senior Frontend Engineer with 8+ years of experience…"
            onChange={(text) => patch('summary', { text })}
          />
        )}
      </Field>

      <AiPolish
        kind="summary"
        text={summary.text}
        jobDescription={targetJobDescription}
        onApply={(text) => patch('summary', { text })}
      />

      <AiWriter mode="summary" onApply={(text) => patch('summary', { text })} />
    </div>
  );
};
