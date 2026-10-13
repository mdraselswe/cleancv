import { describe, expect, it } from 'vitest';

import {
  ATS_CATEGORIES,
  ATS_CATEGORY_WEIGHT,
  ATS_PANELS,
  SECTION_KEYS,
  isCustomSlot,
  isPanelTarget,
  panelIdOf,
} from '@/constants';
import {
  estimatePages,
  evaluateResume,
  extractJobKeywords,
  matchKeywords,
  type AtsRuleContext,
} from '@/features/ats';
import { createEmptyResume, createSampleResume } from '@/features/resume';
import { getTemplate, resolveTemplateStyle } from '@/features/templates';

const context = (overrides: Partial<AtsRuleContext> = {}): AtsRuleContext => ({
  template: getTemplate('classic-dc').meta,
  jobKeywords: [],
  estimatedPages: 1,
  ...overrides,
});

describe('evaluateResume', () => {
  it('scores an empty resume near zero and a finished one highly', () => {
    const empty = evaluateResume(createEmptyResume(), context());
    const sample = evaluateResume(createSampleResume(), context({ estimatedPages: 2 }));

    expect(empty.total).toBeLessThan(40);
    expect(sample.total).toBeGreaterThan(80);
    expect(sample.total).toBeLessThanOrEqual(100);
  });

  it('caps parseability at the template ceiling', () => {
    const resume = createSampleResume();
    const ceiling = 60;

    const score = evaluateResume(resume, context({ template: { ...getTemplate('classic-dc').meta, atsBaseline: ceiling } }));
    const parseability = score.categories.find((entry) => entry.category === 'parseability');

    expect(parseability?.percent).toBeLessThanOrEqual(ceiling);
  });

  it('allocates exactly the declared weight to each category', () => {
    const score = evaluateResume(createSampleResume(), context());

    for (const category of ATS_CATEGORIES) {
      const entry = score.categories.find((item) => item.category === category);
      expect(entry?.maxPoints).toBe(ATS_CATEGORY_WEIGHT[category]);
      expect(entry?.points).toBeLessThanOrEqual(ATS_CATEGORY_WEIGHT[category] + 0.001);
    }

    const maxTotal = ATS_CATEGORIES.reduce((sum, key) => sum + ATS_CATEGORY_WEIGHT[key], 0);
    expect(maxTotal).toBe(100);
  });

  it('orders issues by what fixing them gains, errors first among equals', () => {
    const { issues } = evaluateResume(createEmptyResume(), context());

    for (let i = 1; i < issues.length; i += 1) {
      const previous = issues[i - 1];
      const current = issues[i];

      expect(previous.gain ?? 0).toBeGreaterThanOrEqual(current.gain ?? 0);

      if ((previous.gain ?? 0) === (current.gain ?? 0)) {
        const order = { error: 0, warn: 1, pass: 2 } as const;

        expect(order[previous.status]).toBeLessThanOrEqual(order[current.status]);
      }
    }
  });

  it('flags a photo as a parse risk only when one is actually shown', () => {
    const resume = createSampleResume();
    const without = evaluateResume(resume, context());

    resume.basics.photo = 'data:image/png;base64,AAA';
    resume.meta.theme.showPhoto = true;
    const withPhoto = evaluateResume(resume, context());

    const rule = (score: ReturnType<typeof evaluateResume>) =>
      score.categories
        .flatMap((category) => category.rules)
        .find((item) => item.id === 'photo-risk');

    expect(rule(without)?.status).toBe('pass');
    expect(rule(withPhoto)?.status).toBe('warn');
  });

  it('penalises a renamed section heading', () => {
    const resume = createSampleResume();
    resume.meta.sections.experience = { enabled: true, heading: 'My Journey', showIcons: true };

    const rule = evaluateResume(resume, context())
      .categories.flatMap((category) => category.rules)
      .find((item) => item.id === 'standard-headings');

    expect(rule?.status).not.toBe('pass');
    expect(rule?.targets).toContain('experience');
  });

  it('reports the page count rule against the measured estimate', () => {
    const resume = createSampleResume();

    const long = evaluateResume(resume, context({ estimatedPages: 5 }))
      .categories.flatMap((category) => category.rules)
      .find((item) => item.id === 'page-count');

    expect(long?.status).toBe('error');
  });
});

describe('keyword matching', () => {
  it('drops stopwords and keeps meaningful terms', () => {
    const keywords = extractJobKeywords(
      'We are looking for a Senior Engineer with strong Next.js and GraphQL experience.',
    );

    expect(keywords).toContain('senior');
    expect(keywords).toContain('graphql');
    expect(keywords).not.toContain('are');
    expect(keywords).not.toContain('experience');
  });

  it('reports coverage against the resume text', () => {
    const resume = createSampleResume();
    const { matched, missing, coverage } = matchKeywords(resume, ['graphql', 'kubernetes']);

    expect(matched).toContain('graphql');
    expect(missing).toContain('kubernetes');
    expect(coverage).toBeCloseTo(0.5);
  });

  it('treats an empty job description as full coverage rather than a penalty', () => {
    expect(matchKeywords(createSampleResume(), []).coverage).toBe(1);
  });
});

describe('estimatePages', () => {
  it('reports one page for an empty resume', () => {
    expect(estimatePages(createEmptyResume())).toBe(1);
  });

  it('grows with content', () => {
    const sample = createSampleResume();
    const doubled = {
      ...sample,
      experience: [...sample.experience, ...sample.experience.map((entry, index) => ({
        ...entry,
        id: `${entry.id}-copy-${index}`,
      }))],
    };

    expect(estimatePages(doubled)).toBeGreaterThanOrEqual(estimatePages(sample));
  });

  it('fits more on a page at a smaller type scale', () => {
    const sample = createSampleResume();
    const big = { ...sample, meta: { ...sample.meta, theme: { ...sample.meta.theme, fontScale: 1.15 } } };
    const small = { ...sample, meta: { ...sample.meta, theme: { ...sample.meta.theme, fontScale: 0.85 } } };

    expect(estimatePages(small)).toBeLessThanOrEqual(estimatePages(big));
  });
});

describe('fix targets', () => {
  /** Every state a rule can be in, so no failing branch goes unvisited. */
  const documents = () => {
    const empty = createEmptyResume();

    const renamed = createSampleResume();
    renamed.meta.sections.experience = {
      ...renamed.meta.sections.experience!,
      heading: 'My Journey',
    };
    renamed.meta.sections.education = { ...renamed.meta.sections.education!, enabled: false };

    const crowded = createSampleResume();
    for (const key of SECTION_KEYS) {
      crowded.meta.sections[key] = { ...crowded.meta.sections[key]!, enabled: true };
    }

    const shown = createSampleResume();
    shown.basics.photo = 'data:image/png;base64,AA==';
    shown.meta.theme.showPhoto = true;

    return [empty, renamed, crowded, shown, createSampleResume()];
  };

  const contexts = [
    context(),
    context({ estimatedPages: 5 }),
    context({ template: getTemplate('vibrant').meta }),
    context({ template: getTemplate('ats-plain').meta }),
  ];

  const results = () =>
    documents().flatMap((resume) =>
      contexts.flatMap((ctx) => evaluateResume(resume, ctx).categories.flatMap((c) => c.rules)),
    );

  it('gives every rule that can fail somewhere to fix it', () => {
    /*
     * A failing rule with no target renders no "Fix it" link, which leaves the
     * reader told what is wrong and not where to change it. See ADR-028.
     */
    const stranded = [
      ...new Set(
        results()
          .filter((rule) => rule.status !== 'pass' && !rule.targets?.length)
          .map((rule) => rule.id),
      ),
    ];

    expect(stranded).toEqual([]);
  });

  it('points every target at a place the editor can open', () => {
    const unreachable = [
      ...new Set(
        results()
          .flatMap((rule) => rule.targets ?? [])
          .filter(
            (target) =>
              !(isPanelTarget(target)
                ? (ATS_PANELS as readonly string[]).includes(panelIdOf(target))
                : isCustomSlot(target) || (SECTION_KEYS as readonly string[]).includes(target)),
          ),
      ),
    ];

    expect(unreachable).toEqual([]);
  });

  it('sends a fix that is not in a section form to the panel that holds it', () => {
    const byId = new Map(
      evaluateResume(createEmptyResume(), context({ estimatedPages: 5, template: getTemplate('vibrant').meta }))
        .categories.flatMap((c) => c.rules)
        .map((rule) => [rule.id, rule]),
    );

    // Choosing a design, and tightening it, are both Design.
    expect(byId.get('template-ceiling')?.targets?.[0]).toBe('panel:design');
    expect(byId.get('page-count')?.targets?.[0]).toBe('panel:design');
    // Turning a section on, and renaming its heading back, are both Sections.
    // An empty resume has them all enabled by default, so this needs one where
    // a core section has actually been switched off.
    const missing = createSampleResume();
    missing.meta.sections.education = { ...missing.meta.sections.education!, enabled: false };
    missing.meta.sections.experience = {
      ...missing.meta.sections.experience!,
      heading: 'My Journey',
    };

    const withGaps = new Map(
      evaluateResume(missing, context())
        .categories.flatMap((c) => c.rules)
        .map((rule) => [rule.id, rule]),
    );

    expect(withGaps.get('core-sections-present')?.targets?.[0]).toBe('panel:sections');
    expect(withGaps.get('standard-headings')?.targets?.[0]).toBe('panel:sections');
  });
});

describe('body text size', () => {
  const ruleFor = (measuredBodyPt?: number) =>
    evaluateResume(createSampleResume(), context({ measuredBodyPt })).categories
      .flatMap((category) => category.rules)
      .find((rule) => rule.id === 'body-size');

  it('says so rather than guessing when the preview is not open', () => {
    expect(ruleFor(0)?.status).toBe('pass');
    expect(ruleFor(undefined)?.message).toContain('not open');
  });

  it('passes comfortable type', () => {
    expect(ruleFor(10.2)?.status).toBe('pass');
    expect(ruleFor(9)?.status).toBe('pass');
  });

  it('warns under 9pt and fails under 8pt, naming the setting to change', () => {
    const warn = ruleFor(8.8);
    const error = ruleFor(7.6);

    expect(warn?.status).toBe('warn');
    expect(error?.status).toBe('error');
    expect(error?.targets).toEqual(['panel:design']);
    // 7.6pt needs about 120% to reach 9pt.
    expect(error?.fixHint).toContain('120%');
  });
});

describe('content ceiling', () => {
  it('holds a clean document with no outcomes below what its content earns', () => {
    const resume = createSampleResume();

    for (const entry of [...resume.experience, ...resume.projects]) {
      entry.bullets = entry.bullets.map(() => 'Worked on the application for the team');
    }

    const score = evaluateResume(resume, context());

    expect(score.readability).toBeGreaterThan(score.content);
    expect(score.cappedBy).toBe('content');
    expect(score.total).toBeLessThanOrEqual(score.ceiling);
    expect(score.total).toBeLessThan(score.uncapped);
    expect(score.total).toBeLessThan(75);
  });

  it('does not cap a document whose bullets state results', () => {
    const score = evaluateResume(createSampleResume(), context());

    expect(score.cappedBy).toBeNull();
    expect(score.total).toBe(score.uncapped);
  });

  it('exposes readability and content as 0-100 numbers', () => {
    const score = evaluateResume(createSampleResume(), context());

    for (const value of [score.readability, score.content, score.ceiling]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});

describe('what a fix is worth', () => {
  const unmeasured = () => {
    const resume = createSampleResume();

    for (const entry of [...resume.experience, ...resume.projects]) {
      entry.bullets = entry.bullets.map(() => 'Worked on the application for the team');
    }

    return resume;
  };

  it('lists the issue that gains the most first', () => {
    const { issues } = evaluateResume(unmeasured(), context());
    const gains = issues.map((issue) => issue.gain ?? 0);

    expect(gains).toEqual([...gains].sort((a, b) => b - a));
  });

  it('never promises more than the total can still gain', () => {
    const score = evaluateResume(unmeasured(), context());

    for (const issue of score.issues) {
      expect(score.total + (issue.gain ?? 0)).toBeLessThanOrEqual(100);
    }
  });

  it('says a formatting fix is worth nothing yet while content holds the score down', () => {
    const score = evaluateResume(unmeasured(), context({ measuredBodyPt: 7.6 }));
    const size = score.issues.find((issue) => issue.id === 'body-size');

    expect(score.cappedBy).toBe('content');
    expect(size?.gain).toBe(0);
    expect(size?.rawGain).toBeGreaterThan(0);
  });

  it('reports what fixing every content check would give', () => {
    const score = evaluateResume(unmeasured(), context());

    expect(score.withContentFixed).toBeGreaterThan(score.total);
  });
});

describe('fixes say exactly what to do', () => {
  const rule = (resume: ReturnType<typeof createSampleResume>, id: string, ctx = context()) =>
    evaluateResume(resume, ctx)
      .categories.flatMap((category) => category.rules)
      .find((entry) => entry.id === id);

  it('offers to set the text size, computed from where it is now', () => {
    const resume = createSampleResume();

    resume.meta.theme.fontScale = 1;
    const result = rule(resume, 'body-size', context({ measuredBodyPt: 7.6 }));

    expect(result?.fix).toEqual({ kind: 'font-scale', value: 1.2, label: 'Set text size to 120%' });

    // Already at 110% and still 8.4pt: it needs to go further, not back to 120% of 100.
    resume.meta.theme.fontScale = 1.1;
    const again = rule(resume, 'body-size', context({ measuredBodyPt: 8.36 }));

    expect(again?.fix?.value).toBeGreaterThan(1.1);
    expect(again?.fix?.value).toBeLessThanOrEqual(1.4);
  });

  it('lists the bullets that carry no figure, with where they are', () => {
    const resume = createSampleResume();

    resume.experience[0].bullets = ['Built the storefront with Next.js 16', 'Cut load time by 40%'];

    const result = rule(resume, 'bullets-have-metrics');

    if (result && result.status !== 'pass') {
      expect(result.details?.some((line) => line.includes('Built the storefront'))).toBe(true);
      expect(result.details?.some((line) => line.includes('Cut load time'))).toBe(false);
    }
  });

  it('a design set small in its stylesheet prints readably at 100%', () => {
    const { meta } = getTemplate('classic-dc');
    const style = resolveTemplateStyle({ ...createEmptyResume().meta.theme, fontScale: 1 }, meta);

    // 7.6pt in the stylesheet times the design's own correction.
    expect(Number(style['--rz-scale']) * 7.6).toBeGreaterThanOrEqual(9);
    expect(createEmptyResume().meta.theme.fontScale).toBe(1);
  });
});
