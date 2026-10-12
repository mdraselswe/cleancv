import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/cn';

describe('cn', () => {
  it('keeps a text colour next to the app font-size scale', () => {
    // The merger used to read `text-ui-lg` as a colour and drop `text-primary-fg`.
    const merged = cn('bg-primary text-primary-fg', 'h-11 text-ui-lg');

    expect(merged).toContain('text-primary-fg');
    expect(merged).toContain('text-ui-lg');
  });

  it('still lets a later size replace an earlier one', () => {
    expect(cn('text-ui', 'text-ui-lg')).toBe('text-ui-lg');
  });

  it('keeps radii and shadows from the app scale apart from their sides', () => {
    expect(cn('rounded-control', 'rounded-r-none')).toContain('rounded-control');
    expect(cn('shadow-app', 'shadow-pop')).toBe('shadow-pop');
  });
});
