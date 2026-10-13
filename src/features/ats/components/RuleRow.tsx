'use client';

import { AlertTriangle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

import type { AtsFixTarget, AtsStatus } from '@/constants';
import { cn } from '@/lib/cn';

import type { EvaluatedRule } from '../types';

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
}

/**
 * One rule result. The fix hint is the point of the row — a score with no
 * instruction attached is a number, not feedback.
 */
export const RuleRow = ({ rule, onNavigate }: RuleRowProps) => {
  const Icon = STATUS_ICON[rule.status];
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
              title="What the overall score gains if this passes"
            >
              +{rule.gain} pts
            </span>
          ) : rule.rawGain ? (
            <span
              className="text-fg-subtle text-ui-2xs flex-none tabular-nums"
              title="Worth this much once the content is no longer holding the score down"
            >
              +{rule.rawGain} after content
            </span>
          ) : null}
        </div>
        <p className="text-ui-xs text-fg-muted leading-snug">{rule.message}</p>

        {rule.fixHint ? (
          <p className="text-ui-xs text-fg-subtle mt-1 leading-snug">{rule.fixHint}</p>
        ) : null}

        {target && onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate(target)}
            className="text-ui-xs text-primary mt-1.5 inline-flex items-center gap-1 font-medium transition hover:gap-1.5"
          >
            Fix it
            <ArrowRight size={12} />
          </button>
        ) : null}
      </div>
    </li>
  );
};
