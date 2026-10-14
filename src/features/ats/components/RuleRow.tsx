'use client';

import { useState } from 'react';

import { AlertTriangle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

import type { AtsFixTarget, AtsStatus } from '@/constants';
import { bn } from '@/lib/bn';
import { cn } from '@/lib/cn';

import type { AtsQuickFix, EvaluatedRule } from '../types';

const STATUS_ICON = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
} as const;

const STATUS_CLASS: Record<AtsStatus, string> = {
  pass: 'text-success',
  warn: 'text-warning',
  error: 'text-danger',
};

const STATUS_TILE: Record<AtsStatus, string> = {
  pass: 'bg-success/12',
  warn: 'bg-warning/12',
  error: 'bg-danger/12',
};

export interface RuleRowProps {
  rule: EvaluatedRule;
  /** Jumps the editor to wherever the rule's fix lives. */
  onNavigate?: (target: AtsFixTarget) => void;
  /** Applies a change the rule can make by itself. */
  onQuickFix?: (fix: AtsQuickFix) => void;
}

/**
 * One rule result. The fix hint is the point of the row — a score with no
 * instruction attached is a number, not feedback.
 */
export const RuleRow = ({ rule, onNavigate, onQuickFix }: RuleRowProps) => {
  const Icon = STATUS_ICON[rule.status];
  const [showAll, setShowAll] = useState(false);
  /*
   * Nothing to fix on a rule that passes. The link used to render anyway,
   * because `targets` is returned whatever the outcome — the same returns
   * already drop their `fixHint` on a pass, and this is the other half of it.
   */
  const target = rule.status === 'pass' ? undefined : rule.targets?.[0];

  return (
    <li className="flex gap-2.5 py-2">
      <span
        className={cn(
          'mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-lg',
          STATUS_TILE[rule.status],
          STATUS_CLASS[rule.status],
        )}
      >
        <Icon size={14} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-ui text-fg font-medium">{rule.label}</p>
          {rule.gain ? (
            <span
              className="text-success text-ui-xs flex-none font-bold tabular-nums"
              title="এটি ঠিক হলে সামগ্রিক স্কোর যতটা বাড়বে"
            >
              +{bn(rule.gain)} পয়েন্ট
            </span>
          ) : rule.rawGain ? (
            <span
              className="text-fg-subtle text-ui-2xs flex-none tabular-nums"
              title="লেখার জোর বাড়লে স্কোরে এর এতটা মূল্য থাকবে"
            >
              +{bn(rule.rawGain)} লেখা ভালো হলে
            </span>
          ) : null}
        </div>
        <p className="text-ui-xs text-fg-muted leading-snug">{rule.message}</p>

        {rule.fixHint ? (
          <p className="text-ui-xs text-fg-subtle mt-1 leading-snug">{rule.fixHint}</p>
        ) : null}

        {rule.details && rule.details.length > 0 && rule.status !== 'pass' ? (
          <ul className="border-border-base bg-surface-2/60 rounded-control mt-1.5 flex flex-col gap-1 border p-2">
            {rule.details.slice(0, showAll ? undefined : 5).map((line) => (
              <li key={line} className="text-fg-muted text-ui-2xs leading-snug whitespace-pre-line">
                {line}
              </li>
            ))}
            {rule.details.length > 5 ? (
              <li>
                <button
                  type="button"
                  onClick={() => setShowAll((value) => !value)}
                  className="text-primary text-ui-2xs font-medium"
                >
                  {showAll ? 'কম দেখান' : `সব ${bn(rule.details.length)}টি দেখান`}
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}

        {rule.fix && onQuickFix && rule.status !== 'pass' ? (
          <button
            type="button"
            onClick={() => onQuickFix(rule.fix!)}
            className="app-button-primary rounded-control text-ui-xs mt-2 px-2.5 py-1.5 font-semibold text-white"
          >
            {rule.fix.label}
          </button>
        ) : null}

        {target && onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate(target)}
            className="text-ui-xs text-primary mt-1.5 inline-flex items-center gap-1 font-medium transition hover:gap-1.5"
          >
            ঠিক করুন
            <ArrowRight size={12} />
          </button>
        ) : null}
      </div>
    </li>
  );
};
