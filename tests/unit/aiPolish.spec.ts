import { describe, expect, it } from 'vitest';

import { buildSystemPrompt, cleanSuggestion, introducesNewNumbers } from '@/lib/aiPolish';

describe('introducesNewNumbers', () => {
  it('accepts a rewrite that keeps the same numbers', () => {
    expect(
      introducesNewNumbers(
        'Cut load time by 40% across 3 services',
        'Reduced load time by 40% across 3 services',
      ),
    ).toBe(false);
  });

  it('rejects a number the original did not have', () => {
    expect(introducesNewNumbers('Improved checkout speed', 'Improved checkout speed by 35%')).toBe(
      true,
    );
  });

  it('reads 1,200 and 1200 as the same number', () => {
    expect(introducesNewNumbers('Served 1,200 users', 'Served 1200 users')).toBe(false);
  });

  it('allows dropping a number', () => {
    expect(introducesNewNumbers('Led 5 engineers on 2 projects', 'Led a team of engineers')).toBe(
      false,
    );
  });
});

describe('cleanSuggestion', () => {
  it('strips quotes, a preface and fences', () => {
    expect(cleanSuggestion('Here is the rewritten text:\n"Built a thing."')).toBe('Built a thing.');
    expect(cleanSuggestion('```\nBuilt a thing.\n```')).toBe('Built a thing.');
  });

  it('keeps bold markers', () => {
    expect(cleanSuggestion('Cut cost by **40%**.')).toBe('Cut cost by **40%**.');
  });

  it('joins a stray line break into one line', () => {
    expect(cleanSuggestion('Built a thing\nthat works.')).toBe('Built a thing that works.');
  });
});

describe('buildSystemPrompt', () => {
  it('forbids inventing facts and mentions the job description only when there is one', () => {
    expect(buildSystemPrompt('bullet', false)).toContain('Never add a number');
    expect(buildSystemPrompt('bullet', false)).not.toContain('job description');
    expect(buildSystemPrompt('summary', true)).toContain('vocabulary only');
  });
});
