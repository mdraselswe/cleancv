import { describe, expect, it } from 'vitest';

import {
  createProjectEntry,
  createSampleResume,
  getVisibleSections,
  normalizeResume,
  withoutHiddenEntries,
} from '@/features/resume';

describe('withoutHiddenEntries', () => {
  it('returns the same object when nothing is hidden', () => {
    const resume = createSampleResume();
    expect(withoutHiddenEntries(resume)).toBe(resume);
  });

  it('drops hidden entries from every list and leaves the stored resume alone', () => {
    const resume = createSampleResume();
    const first = resume.experience[0].id;
    const hidden = { ...resume, meta: { ...resume.meta, hiddenEntries: [first] } };

    const printed = withoutHiddenEntries(hidden);

    expect(printed.experience.map((entry) => entry.id)).not.toContain(first);
    expect(printed.experience.length).toBe(resume.experience.length - 1);
    expect(hidden.experience.map((entry) => entry.id)).toContain(first);
  });

  it('removes a section from the page once all of its entries are hidden', () => {
    const resume = createSampleResume();
    const project = { ...createProjectEntry(), name: 'Only project', bullets: ['Built a thing'] };
    const base = { ...resume, projects: [project] };
    expect(getVisibleSections(base)).toContain('projects');

    const hidden = withoutHiddenEntries({
      ...base,
      meta: { ...base.meta, hiddenEntries: [project.id] },
    });

    expect(getVisibleSections(hidden)).not.toContain('projects');
  });

  it('survives a save and reload', () => {
    const resume = createSampleResume();
    const id = resume.experience[0].id;
    const again = normalizeResume({ ...resume, meta: { ...resume.meta, hiddenEntries: [id] } });

    expect(again.meta.hiddenEntries).toEqual([id]);
    expect(normalizeResume({ ...resume, meta: { ...resume.meta, hiddenEntries: 'junk' } }).meta.hiddenEntries).toEqual([]);
  });
});
