'use client';

import { useState } from 'react';

import { Badge, SectionLabel, ScoreRing, Textarea } from '@/components/ui';
import {
  ATS_CATEGORY_DESCRIPTION,
  ATS_CATEGORY_LABEL,
  type AtsCategory,
  type AtsFixTarget,
} from '@/constants';
import { cn } from '@/lib/cn';

import type { AtsScore, KeywordMatch } from '../types';
import { RuleRow } from './RuleRow';

export interface AtsPanelProps {
  score: AtsScore;
  keywords: KeywordMatch;
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
  onNavigate?: (target: AtsFixTarget) => void;
}

type View = 'issues' | 'all' | 'target';

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'issues', label: 'Needs work' },
  { value: 'all', label: 'All checks' },
  { value: 'target', label: 'Target job' },
];

/**
 * The score panel.
 *
 * Leads with what to fix rather than what passed: a list of green ticks is
 * reassuring and useless. The full breakdown is one tab away for anyone who
 * wants to see where the number came from.
 */
export const AtsPanel = ({
  score,
  keywords,
  jobDescription,
  onJobDescriptionChange,
  onNavigate,
}: AtsPanelProps) => {
  const [view, setView] = useState<View>('issues');

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center gap-4">
        <ScoreRing score={score.total} tone={score.tone} label={score.band} />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">ATS score</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-fg-subtle">
            {score.issues.length === 0
              ? 'Every check passes. Send it.'
              : `${score.issues.length} check${score.issues.length === 1 ? '' : 's'} to look at, worst first.`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {score.categories.map((category) => (
          <CategoryBar
            key={category.category}
            category={category.category}
            percent={category.percent}
            points={category.points}
            maxPoints={category.maxPoints}
          />
        ))}
      </div>

      <div className="flex gap-0.5 rounded-lg bg-surface-2 p-0.5">
        {VIEWS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setView(item.value)}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-[12.5px] font-medium transition',
              view === item.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === 'issues' ? (
        score.issues.length === 0 ? (
          <p className="rounded-lg bg-success/10 px-3 py-2.5 text-[13px] text-success">
            Nothing outstanding. Download both PDFs and apply.
          </p>
        ) : (
          <ul className="divide-y divide-border-base">
            {score.issues.map((rule) => (
              <RuleRow key={rule.id} rule={rule} onNavigate={onNavigate} />
            ))}
          </ul>
        )
      ) : null}

      {view === 'all'
        ? score.categories.map((category) => (
            <div key={category.category}>
              <SectionLabel className="mb-1">{ATS_CATEGORY_LABEL[category.category]}</SectionLabel>
              <p className="mb-1 text-[12px] text-fg-subtle">
                {ATS_CATEGORY_DESCRIPTION[category.category]}
              </p>
              <ul className="divide-y divide-border-base">
                {category.rules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} onNavigate={onNavigate} />
                ))}
              </ul>
            </div>
          ))
        : null}

      {view === 'target' ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-fg-muted">Job description</span>
            <Textarea
              rows={8}
              value={jobDescription}
              placeholder="Paste the posting here. It is used only for keyword matching and never printed on your resume."
              onChange={(event) => onJobDescriptionChange(event.target.value)}
            />
          </label>

          {keywords.matched.length + keywords.missing.length > 0 ? (
            <>
              <div>
                <SectionLabel className="mb-1.5">
                  Missing ({keywords.missing.length})
                </SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.missing.length === 0 ? (
                    <p className="text-[12.5px] text-fg-subtle">Nothing missing.</p>
                  ) : (
                    keywords.missing.map((word) => (
                      <Badge key={word} tone="warning">
                        {word}
                      </Badge>
                    ))
                  )}
                </div>
                <p className="mt-2 text-[12px] leading-snug text-fg-subtle">
                  Add only what is honestly true of you, in the posting&apos;s own spelling. Padding
                  a resume with terms you cannot defend fails at the interview instead of the filter.
                </p>
              </div>

              <div>
                <SectionLabel className="mb-1.5">Matched ({keywords.matched.length})</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.matched.map((word) => (
                    <Badge key={word} tone="success">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

interface CategoryBarProps {
  category: AtsCategory;
  percent: number;
  points: number;
  maxPoints: number;
}

const CategoryBar = ({ category, percent, points, maxPoints }: CategoryBarProps) => (
  <div>
    <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
      <span className="text-fg-muted">{ATS_CATEGORY_LABEL[category]}</span>
      <span className="tabular-nums text-fg-subtle">
        {Math.round(points)}/{maxPoints}
      </span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          percent >= 85 ? 'bg-success' : percent >= 60 ? 'bg-warning' : 'bg-danger',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);
