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
      <Icon size={15} className={cn('mt-0.5 flex-none', STATUS_CLASS[rule.status])} />

      <div className="min-w-0 flex-1">
        <p className="text-ui text-fg font-medium">{rule.label}</p>
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
