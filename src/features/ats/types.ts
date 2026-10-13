import type { AtsCategory, AtsFixTarget, AtsScoreTone, AtsStatus } from '@/constants';
import type { Resume } from '@/features/resume';
import type { TemplateMeta } from '@/features/templates';

/** Everything a rule may look at beyond the resume itself. */
export interface AtsRuleContext {
  template: TemplateMeta;
  /** Meaningful tokens from the pasted job description; empty when none. */
  jobKeywords: string[];
  /** Estimated page count for the current template and theme. */
  estimatedPages: number;
  /**
   * Body text size in points, measured from the preview. 0 or absent when the
   * preview is not mounted — the phone's Score tab — and the rule then says so
   * instead of guessing.
   */
  measuredBodyPt?: number;
}

export interface AtsRuleResult {
  status: AtsStatus;
  /** One line stating what is true, not what to do. */
  message: string;
  /** What to change, when there is something to change. */
  fixHint?: string;
  /** Where the fix is: a section of the document, or an editor panel. */
  targets?: AtsFixTarget[];
}

export interface AtsRule {
  id: string;
  category: AtsCategory;
  /** Relative to other rules in the same category, not to the total. */
  weight: number;
  label: string;
  evaluate: (resume: Resume, context: AtsRuleContext) => AtsRuleResult;
}

export interface EvaluatedRule extends AtsRuleResult {
  id: string;
  label: string;
  category: AtsCategory;
  weight: number;
}

export interface CategoryScore {
  category: AtsCategory;
  /** 0-100 within the category. */
  percent: number;
  /** Contribution to the total, out of ATS_CATEGORY_WEIGHT[category]. */
  points: number;
  maxPoints: number;
  rules: EvaluatedRule[];
}

/** What, if anything, is holding the overall number below the sum of its parts. */
export type AtsCap = 'content' | 'completeness' | null;

export interface AtsScore {
  /** 0-100. Never higher than `ceiling`. */
  total: number;
  /** The sum of the categories before any cap; what formatting alone would say. */
  uncapped: number;
  /** 0-100: can a machine read this document — parse, completeness, formatting. */
  readability: number;
  /** 0-100: does the writing prove anything — outcomes, scale, specificity. */
  content: number;
  cappedBy: AtsCap;
  /** The highest total the content allows. */
  ceiling: number;
  tone: AtsScoreTone;
  band: string;
  categories: CategoryScore[];
  /** Failing and warning rules, worst first — what the panel leads with. */
  issues: EvaluatedRule[];
}

export interface KeywordMatch {
  matched: string[];
  missing: string[];
  /** 0-1 share of job keywords found in the resume. */
  coverage: number;
}
