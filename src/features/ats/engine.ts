import {
  ATS_CATEGORIES,
  ATS_CATEGORY_WEIGHT,
  ATS_CONTENT_CEILING,
  ATS_SCORE_BANDS,
  ATS_STATUS_CREDIT,
  type AtsCategory,
} from '@/constants';
import type { Resume } from '@/features/resume';

import { ATS_RULES } from './rules';
import type { AtsCap, AtsRuleContext, AtsScore, CategoryScore, EvaluatedRule } from './types';

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

/** What the rules add up to, before they are sorted into a report. */
interface Assembled {
  categories: CategoryScore[];
  raw: number;
  total: number;
  readability: number;
  content: number;
  ceiling: number;
  cappedBy: AtsCap;
}

/**
 * Turns evaluated rules into the totals.
 *
 * Its own function so a rule can be re-scored as if it passed: the gain shown
 * beside an issue is the difference between two runs of exactly this, which is
 * what keeps "+6 points" from being a number the engine would not itself give.
 */
const assemble = (evaluated: EvaluatedRule[], templateCeiling: number): Assembled => {
  const categories = ATS_CATEGORIES.map((category) =>
    scoreCategory(
      category,
      evaluated.filter((rule) => rule.category === category),
      templateCeiling,
    ),
  );

  const raw = categories.reduce((sum, category) => sum + category.points, 0);

  /*
   * A resume cannot score higher than it is complete. Without this, an empty
   * document scores in the sixties: its formatting is flawless because there is
   * nothing to format, and every parseability check passes vacuously.
   */
  const completeness = categories.find((entry) => entry.category === 'completeness');
  const completenessCap = completeness?.percent ?? 100;

  /*
   * Two numbers a reader can act on, and one honest total. Readability is what
   * a machine can do with the file; content is what a person can do with the
   * words. The total is held under what the content earns, so a document that
   * parses perfectly and proves nothing cannot read as excellent.
   */
  const readable = categories.filter((entry) =>
    (['parseability', 'completeness', 'formatting'] as AtsCategory[]).includes(entry.category),
  );
  const readability = Math.round(
    (readable.reduce((sum, entry) => sum + entry.points, 0) /
      readable.reduce((sum, entry) => sum + entry.maxPoints, 0)) *
      100,
  );
  const content = categories.find((entry) => entry.category === 'impact')?.percent ?? 100;
  const ceiling = Math.round(ATS_CONTENT_CEILING.floor + content * ATS_CONTENT_CEILING.slope);

  const total = Math.round(Math.min(raw, completenessCap, ceiling));
  const cappedBy: AtsCap =
    total >= Math.round(raw) ? null : completenessCap <= ceiling ? 'completeness' : 'content';

  return { categories, raw, total, readability, content, ceiling, cappedBy };
};

const asPassing = (rule: EvaluatedRule): EvaluatedRule => ({ ...rule, status: 'pass' });

export const evaluateResume = (resume: Resume, context: AtsRuleContext): AtsScore => {
  const evaluated: EvaluatedRule[] = ATS_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    category: rule.category,
    weight: rule.weight,
    ...rule.evaluate(resume, context),
  }));

  const ceilingOfTemplate = context.template.atsBaseline;
  const base = assemble(evaluated, ceilingOfTemplate);
  const band = ATS_SCORE_BANDS.find((entry) => base.total >= entry.min) ?? ATS_SCORE_BANDS.at(-1)!;

  /*
   * Each failing rule, scored as if it passed. `gain` is what the total would
   * become, which is zero for a formatting fix while the content is what holds
   * the score down — that is true, and saying so is the point. `rawGain` is the
   * same without the cap, so the panel can still say the fix is worth something
   * once the content catches up.
   */
  const issues = evaluated
    .filter((rule) => rule.status !== 'pass')
    .map((rule) => {
      const fixed = assemble(
        evaluated.map((entry) => (entry.id === rule.id ? asPassing(entry) : entry)),
        ceilingOfTemplate,
      );

      return {
        ...rule,
        gain: Math.max(0, fixed.total - base.total),
        rawGain: Math.max(0, Math.round(fixed.raw) - Math.round(base.raw)),
      };
    })
    .sort(
      (a, b) =>
        b.gain - a.gain ||
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        b.rawGain - a.rawGain ||
        b.weight * ATS_CATEGORY_WEIGHT[b.category] - a.weight * ATS_CATEGORY_WEIGHT[a.category],
    );

  // What the whole document would score if every content check passed.
  const contentFixed = assemble(
    evaluated.map((entry) => (entry.category === 'impact' ? asPassing(entry) : entry)),
    ceilingOfTemplate,
  );

  return {
    total: base.total,
    uncapped: Math.round(base.raw),
    readability: base.readability,
    content: base.content,
    cappedBy: base.cappedBy,
    ceiling: base.ceiling,
    withContentFixed: contentFixed.total,
    tone: band.tone,
    band: band.label,
    categories: base.categories,
    issues,
  };
};
