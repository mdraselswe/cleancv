import { describe, expect, it } from 'vitest';

import { hasMetric } from '@/lib/metrics';

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
