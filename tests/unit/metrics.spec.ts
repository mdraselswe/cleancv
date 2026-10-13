import { describe, expect, it } from 'vitest';

import { hasMetric, hasOutcome, hasScale, metricPrompt } from '@/lib/metrics';

describe('hasMetric', () => {
  it('counts a figure with a unit', () => {
    for (const line of [
      'Cut load time by 40% across the checkout',
      'Reduced approval from 9 days to 4',
      'Grew throughput 3x',
      'Handled 15k requests a minute',
    ]) {
      expect(hasMetric(line), line).toBe(true);
    }
  });

  it('counts money and counted people or things', () => {
    expect(hasMetric('Owned a $2M annual budget')).toBe(true);
    expect(hasMetric('Mentored 3+ frontend engineers through code reviews')).toBe(true);
    expect(hasMetric('Shipped 5 services to production')).toBe(true);
    expect(hasMetric('Served 12,000 users a day')).toBe(true);
  });

  it('does not count a version number as a result', () => {
    for (const line of [
      'Built the storefront with Next.js 16 and React 19',
      'Styled with Tailwind CSS v4 and Lucide icons',
      'Upgraded to Node 20 and TypeScript 5.4',
      'Wrote ES6 and HTML5 for legacy browsers',
    ]) {
      expect(hasMetric(line), line).toBe(false);
    }
  });

  it('does not count a year or a date range', () => {
    expect(hasMetric('Joined in 2019 and led the redesign')).toBe(false);
    expect(hasMetric('Worked on the platform 2018-2020')).toBe(false);
  });

  it('does not count a sentence with no number at all', () => {
    expect(hasMetric('Improved performance through caching strategies')).toBe(false);
  });
});

describe('hasMetric counted things', () => {
  it('counts templates, formats and rules', () => {
    expect(hasMetric('Implemented client-side CV import for 3 file formats')).toBe(true);
    expect(hasMetric('Shipped 10 templates and a 31-rule score')).toBe(true);
    expect(hasMetric('Supporting 4+ major browsers including legacy versions')).toBe(true);
    expect(hasMetric('Built 20 responsive routes for the storefront')).toBe(true);
  });
});

describe('hasOutcome', () => {
  it('counts a before and after or a change beside a figure', () => {
    expect(hasOutcome('Cut page load from 4.2s to 1.8s')).toBe(true);
    expect(hasOutcome('Reduced re-renders by 40% after moving state to Context')).toBe(true);
  });

  it('does not count a figure that states no change', () => {
    expect(hasOutcome('Mentored 3+ frontend engineers through code reviews')).toBe(false);
    expect(hasOutcome('Built a reusable component library')).toBe(false);
  });
});

describe('hasScale', () => {
  it('counts people, users and money', () => {
    expect(hasScale('Mentored 3+ frontend engineers')).toBe(true);
    expect(hasScale('Served 50,000 users across 4 products')).toBe(true);
    expect(hasScale('Managed a $2M budget')).toBe(true);
  });

  it('does not count a version number', () => {
    expect(hasScale('Built it with Next.js 16 and React 19')).toBe(false);
  });
});

describe('metricPrompt', () => {
  it('asks the question that fits the line, never invents a figure', () => {
    expect(metricPrompt('Mentored engineers through code reviews')).toMatch(/how many people/i);
    expect(metricPrompt('Optimized rendering and caching')).toMatch(/load time/i);
    expect(metricPrompt('Did a thing')).toMatch(/what number/i);
  });
});
