import { describe, expect, it } from 'vitest';

import { createSampleResume } from '@/features/resume';
import {
  DEFAULT_TAILOR_OPTIONS,
  analyzeTailor,
  applyTailor,
  spellingIn,
  suggestJobName,
} from '@/features/tailor/engine';

const JD = `Senior Backend Engineer
We are hiring an engineer with strong Kubernetes and GraphQL experience.
You will work with React, Next.js and PostgreSQL. Kubernetes is key.`;

describe('analyzeTailor', () => {
  it('splits the posting into what the CV has and lacks', () => {
    const analysis = analyzeTailor(createSampleResume(), JD);

    expect(analysis.keywords.length).toBeGreaterThan(0);
    expect(analysis.matched).toContain('graphql');
    expect(analysis.missing).toContain('kubernetes');
  });
});

describe('applyTailor', () => {
  it('never mutates the resume it is given', () => {
    const resume = createSampleResume();
    const before = JSON.stringify(resume);

    applyTailor(resume, JD, { ...DEFAULT_TAILOR_OPTIONS, addSummaryLine: true });

    expect(JSON.stringify(resume)).toBe(before);
  });

  it('keeps every bullet, only in a different order', () => {
    const resume = createSampleResume();
    const { resume: tailored } = applyTailor(resume, JD, {
      ...DEFAULT_TAILOR_OPTIONS,
      boldKeywords: false,
    });

    resume.experience.forEach((entry, index) => {
      expect([...tailored.experience[index].bullets].sort()).toEqual([...entry.bullets].sort());
    });
    // Roles stay in the order they happened.
    expect(tailored.experience.map((entry) => entry.id)).toEqual(
      resume.experience.map((entry) => entry.id),
    );
  });

  it('adds only the skills it was told to, spelled as the posting spells them', () => {
    const resume = createSampleResume();
    const { resume: tailored, stats } = applyTailor(resume, JD, {
      ...DEFAULT_TAILOR_OPTIONS,
      reorderSkills: false,
      addSkills: ['kubernetes'],
    });
    const all = tailored.skills.flatMap((group) => group.items);

    expect(all).toContain('Kubernetes');
    expect(stats.skillsAdded).toBe(1);
    expect(tailored.skills.flatMap((group) => group.items).length).toBe(
      resume.skills.flatMap((group) => group.items).length + 1,
    );
  });

  it('adds nothing to the CV when nothing was ticked', () => {
    const resume = createSampleResume();
    const { resume: tailored } = applyTailor(resume, JD, {
      ...DEFAULT_TAILOR_OPTIONS,
      reorderSkills: false,
      reorderBullets: false,
      boldKeywords: false,
    });

    expect(JSON.stringify(tailored)).toBe(JSON.stringify(resume));
  });

  it('bolds at most two terms per bullet and leaves formatted bullets alone', () => {
    const resume = createSampleResume();

    resume.experience[0].bullets = [
      'Built a React and Next.js app on PostgreSQL with GraphQL',
      'Already **marked** React work',
    ];

    const { resume: tailored } = applyTailor(resume, JD, {
      ...DEFAULT_TAILOR_OPTIONS,
      reorderBullets: false,
      reorderSkills: false,
    });
    const [first, second] = tailored.experience[0].bullets;

    expect((first.match(/\*\*/g) ?? []).length).toBeLessThanOrEqual(4);
    expect(first).toContain('**');
    expect(second).toBe('Already **marked** React work');
  });

  it('writes a summary line only from skills the CV already lists', () => {
    const { resume: tailored, stats } = applyTailor(createSampleResume(), JD, {
      ...DEFAULT_TAILOR_OPTIONS,
      reorderSkills: false,
      reorderBullets: false,
      boldKeywords: false,
      addSummaryLine: true,
    });

    if (stats.summaryLineAdded) {
      expect(tailored.summary.text).toMatch(/Strong in .+\.$/);
      expect(tailored.summary.text.toLowerCase()).not.toContain('kubernetes');
    }
  });
});

describe('spellingIn / suggestJobName', () => {
  it('reads the posting’s own capitalisation', () => {
    expect(spellingIn(JD, 'kubernetes')).toBe('Kubernetes');
    expect(spellingIn(JD, 'next.js')).toBe('Next.js');
  });

  it('takes a short first line as the job name and ignores a sentence', () => {
    expect(suggestJobName(JD)).toBe('Senior Backend Engineer');
    expect(suggestJobName('x'.repeat(90))).toBe('');
  });
});
