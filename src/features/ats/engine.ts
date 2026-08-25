import {
  ATS_CATEGORIES,
  ATS_CATEGORY_WEIGHT,
  ATS_SCORE_BANDS,
  ATS_STATUS_CREDIT,
  type AtsCategory,
} from '@/constants';
import type { Resume } from '@/features/resume';

import { ATS_RULES } from './rules';
import type { AtsRuleContext, AtsScore, CategoryScore, EvaluatedRule } from './types';

/**
 * Runs the rules and turns them into a score.
 *
 * Weights are relative within a category and the category's share of the total
 * comes from ATS_CATEGORY_WEIGHT, so adding a rule dilutes its neighbours rather
 * than inflating the total. Pure, and cheap enough to run on every keystroke.
 */

const STATUS_ORDER = { error: 0, warn: 1, pass: 2 } as const;

/** Parseability cannot exceed what the chosen design can physically achieve. */
const applyTemplateCeiling = (category: AtsCategory, percent: number, ceiling: number): number =>
  category === 'parseability' ? Math.min(percent, ceiling) : percent;

const scoreCategory = (
  category: AtsCategory,
  rules: EvaluatedRule[],
  templateCeiling: number,
): CategoryScore => {
  const maxPoints = ATS_CATEGORY_WEIGHT[category];

  if (rules.length === 0) {
    return { category, percent: 100, points: maxPoints, maxPoints, rules };
  }

  const earned = rules.reduce((sum, rule) => sum + rule.weight * ATS_STATUS_CREDIT[rule.status], 0);
  const possible = rules.reduce((sum, rule) => sum + rule.weight, 0);

  const percent = applyTemplateCeiling(category, (earned / possible) * 100, templateCeiling);

  return {
    category,
    percent: Math.round(percent),
    points: (percent / 100) * maxPoints,
    maxPoints,
    rules,
  };
};

export const evaluateResume = (resume: Resume, context: AtsRuleContext): AtsScore => {
  const evaluated: EvaluatedRule[] = ATS_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    category: rule.category,
    weight: rule.weight,
    ...rule.evaluate(resume, context),
  }));

  const categories = ATS_CATEGORIES.map((category) =>
    scoreCategory(
      category,
      evaluated.filter((rule) => rule.category === category),
      context.template.atsBaseline,
    ),
  );

  const raw = categories.reduce((sum, category) => sum + category.points, 0);

  /*
   * A resume cannot score higher than it is complete. Without this, an empty
   * document scores in the sixties: its formatting is flawless because there is
   * nothing to format, and every parseability check passes vacuously.
   */
  const completeness = categories.find((entry) => entry.category === 'completeness');
  const total = Math.round(Math.min(raw, completeness?.percent ?? 100));
  const band = ATS_SCORE_BANDS.find((entry) => total >= entry.min) ?? ATS_SCORE_BANDS.at(-1)!;

  const issues = evaluated
    .filter((rule) => rule.status !== 'pass')
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        b.weight * ATS_CATEGORY_WEIGHT[b.category] - a.weight * ATS_CATEGORY_WEIGHT[a.category],
    );

  return { total, tone: band.tone, band: band.label, categories, issues };
};
