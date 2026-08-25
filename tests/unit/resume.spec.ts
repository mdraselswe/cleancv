import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SECTION_ORDER,
  RESUME_ICON_KEYS,
  RESUME_ICON_LABEL,
  SECTION_KEYS,
  customSlot,
  isRecognisedHeading,
} from '@/constants';
import {
  createAchievementEntry,
  createCustomSection,
  createEmptyResume,
  createSkillGroup,
  createSampleResume,
  getSectionEntryIcon,
  getSectionHeading,
  getVisibleSections,
  isSectionVisible,
  normalizeResume,
  parseResumeFile,
  resumeSchema,
  sectionShowsIcons,
  serializeResume,
} from '@/features/resume';

describe('resume schema', () => {
  it('accepts a blank resume — a half-filled document must still save', () => {
    expect(resumeSchema.safeParse(createEmptyResume()).success).toBe(true);
  });

  it('accepts the sample resume', () => {
    expect(resumeSchema.safeParse(createSampleResume()).success).toBe(true);
  });
});

describe('normalizeResume', () => {
  it('repairs junk instead of rejecting it', () => {
    const resume = normalizeResume({ basics: { fullName: 'A' }, experience: 'not-a-list' });

    expect(resume.basics.fullName).toBe('A');
    expect(resume.experience).toEqual([]);
  });

  it('gives imported entries ids when the file has none', () => {
    const resume = normalizeResume({
      experience: [{ role: 'Engineer', bullets: ['Did a thing'] }],
    });

    expect(resume.experience).toHaveLength(1);
    expect(resume.experience[0].id).toBeTruthy();
  });

  it('appends sections missing from a stored order', () => {
    const resume = normalizeResume({ meta: { sectionOrder: ['experience', 'nonsense'] } });

    expect(resume.meta.sectionOrder[0]).toBe('experience');
    expect(resume.meta.sectionOrder).not.toContain('nonsense');
    expect(new Set(resume.meta.sectionOrder).size).toBe(DEFAULT_SECTION_ORDER.length);
  });

  it('fills section settings for every known section', () => {
    const resume = normalizeResume({ meta: { sections: { summary: { enabled: false } } } });

    expect(Object.keys(resume.meta.sections).sort()).toEqual([...SECTION_KEYS].sort());
    expect(resume.meta.sections.summary?.enabled).toBe(false);
  });

  it('round-trips through export and import', () => {
    const original = createSampleResume();
    const result = parseResumeFile(serializeResume(original));

    expect(result.ok).toBe(true);
    expect(result.resume.basics.fullName).toBe(original.basics.fullName);
    expect(result.resume.experience).toHaveLength(original.experience.length);
  });

  it('reports invalid JSON rather than throwing', () => {
    const result = parseResumeFile('{ not json');

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('section visibility', () => {
  it('hides an enabled section that has no content', () => {
    const resume = createEmptyResume();
    resume.meta.sections.experience = { enabled: true, heading: '', showIcons: true };

    expect(isSectionVisible(resume, 'experience')).toBe(false);
  });

  it('lists visible sections in the user order, excluding headless ones', () => {
    const sections = getVisibleSections(createSampleResume());

    expect(sections).toContain('experience');
    expect(sections).toContain('skills');
    // Contact renders under the name, not as its own headed section.
    expect(sections).not.toContain('contact');
    expect(sections.indexOf('summary')).toBeLessThan(sections.indexOf('experience'));
  });
});

describe('custom sections', () => {
  const withCustom = () => {
    const resume = createEmptyResume();
    const section = { ...createCustomSection(), heading: 'Portfolio', bullets: ['Shipped a thing'] };
    resume.customSections = [section];
    resume.meta.sectionOrder = [...resume.meta.sectionOrder, customSlot(section.id)];

    return { resume, slot: customSlot(section.id) };
  };

  it('renders in the user order with its own heading', () => {
    const { resume, slot } = withCustom();

    expect(getVisibleSections(resume)).toContain(slot);
    expect(getSectionHeading(resume, slot)).toBe('Portfolio');
  });

  it('hides itself when it has no content', () => {
    const { resume, slot } = withCustom();
    resume.customSections[0].bullets = [''];

    expect(isSectionVisible(resume, slot)).toBe(false);
  });

  it('drops an order slot whose section is gone', () => {
    const { resume, slot } = withCustom();
    resume.customSections = [];

    expect(normalizeResume(resume).meta.sectionOrder).not.toContain(slot);
  });

  it('re-adds a section that lost its order slot', () => {
    const { resume, slot } = withCustom();
    resume.meta.sectionOrder = resume.meta.sectionOrder.filter((entry) => entry !== slot);

    expect(normalizeResume(resume).meta.sectionOrder).toContain(slot);
  });
});

describe('recognised headings', () => {
  it('accepts the canonical and default names', () => {
    expect(isRecognisedHeading('experience', 'WORK EXPERIENCE')).toBe(true);
    expect(isRecognisedHeading('experience', 'Work Experience')).toBe(true);
  });

  it('accepts a standard alternative name', () => {
    // Renaming to this is not a defect, and the ATS engine must not warn.
    expect(isRecognisedHeading('experience', 'Professional Experience')).toBe(true);
    expect(isRecognisedHeading('skills', 'Technical Skills')).toBe(true);
    expect(isRecognisedHeading('summary', 'Career Objective')).toBe(true);
  });

  it('rejects a name a parser would not match on', () => {
    expect(isRecognisedHeading('experience', 'My Journey')).toBe(false);
    expect(isRecognisedHeading('skills', 'Things I Can Do')).toBe(false);
  });

  it('treats a blank heading as the default, which is recognised', () => {
    expect(isRecognisedHeading('education', '')).toBe(true);
  });
});

describe('entry icons', () => {
  it('starts a new skill group and achievement on automatic', () => {
    expect(createSkillGroup().icon).toBe('auto');
    expect(createAchievementEntry().icon).toBe('auto');
  });

  it('keeps a chosen icon through a save and reload', () => {
    const resume = createEmptyResume();
    resume.skills = [{ ...createSkillGroup('Soft Skills'), icon: 'person' }];
    resume.achievements = [{ ...createAchievementEntry(), title: 'Award', icon: 'crown' }];

    const restored = normalizeResume(JSON.parse(JSON.stringify(resume)));

    expect(restored.skills[0].icon).toBe('person');
    expect(restored.achievements[0].icon).toBe('crown');
  });

  it('falls back to automatic rather than rejecting an unknown icon', () => {
    const resume = createEmptyResume();
    resume.skills = [{ ...createSkillGroup('Frontend'), icon: 'not-an-icon' as never }];

    expect(normalizeResume(resume).skills[0].icon).toBe('auto');
  });

  it('has a label for every icon the picker offers', () => {
    // A missing label would render an unnamed button, which is unusable with a
    // screen reader and unreadable with a mouse.
    for (const key of RESUME_ICON_KEYS) {
      expect(RESUME_ICON_LABEL[key]).toBeTruthy();
    }
  });
});

describe('declaration date', () => {
  it('prints a date by default, so documents saved before the toggle are unchanged', () => {
    expect(createEmptyResume().declaration.showDate).toBe(true);
    expect(normalizeResume({ declaration: { text: 'I declare.' } }).declaration.showDate).toBe(true);
  });

  it('keeps the toggle off through a save and reload', () => {
    const resume = createEmptyResume();
    resume.declaration.showDate = false;
    resume.declaration.date = '01/2026';

    const restored = normalizeResume(JSON.parse(JSON.stringify(resume)));

    // The typed date survives: turning the stamp back on must not lose it.
    expect(restored.declaration.showDate).toBe(false);
    expect(restored.declaration.date).toBe('01/2026');
  });
});

describe('per-section icons', () => {
  it('draws them unless the section says otherwise', () => {
    const resume = createEmptyResume();

    expect(sectionShowsIcons(resume, 'experience')).toBe(true);

    resume.meta.sections.experience = { ...resume.meta.sections.experience!, showIcons: false };

    expect(sectionShowsIcons(resume, 'experience')).toBe(false);
    // Off is one section's business, not the document's.
    expect(sectionShowsIcons(resume, 'education')).toBe(true);
  });

  it('keeps the setting through a save and reload', () => {
    const resume = createEmptyResume();
    resume.meta.sections.education = { ...resume.meta.sections.education!, showIcons: false };

    const restored = normalizeResume(JSON.parse(JSON.stringify(resume)));

    expect(restored.meta.sections.education?.showIcons).toBe(false);
    expect(restored.meta.sections.experience?.showIcons).toBe(true);
  });

  it('marks the sections that hold entries', () => {
    expect(getSectionEntryIcon('experience')).toBe('briefcase');
    expect(getSectionEntryIcon('education')).toBe('graduation');
    // Nothing to separate: one paragraph, one list of words.
    expect(getSectionEntryIcon('summary')).toBeUndefined();
    expect(getSectionEntryIcon('interests')).toBeUndefined();
  });
});

describe('photo shape', () => {
  it('starts as a circle and survives a save and reload', () => {
    const resume = createEmptyResume();

    expect(resume.meta.theme.photoRadius).toBe(50);

    resume.meta.theme.photoRadius = 12;

    expect(normalizeResume(JSON.parse(JSON.stringify(resume))).meta.theme.photoRadius).toBe(12);
  });

  it('falls back to a circle rather than rejecting a value off the scale', () => {
    const resume = createEmptyResume();
    resume.meta.theme.photoRadius = 400;

    expect(normalizeResume(resume).meta.theme.photoRadius).toBe(50);
  });
});

describe('photo framing', () => {
  it('starts centred and unzoomed', () => {
    expect(createEmptyResume().basics.photoFrame).toEqual({ x: 50, y: 50, zoom: 1 });
  });

  it('keeps a chosen frame through a save and reload', () => {
    const resume = createEmptyResume();
    resume.basics.photoFrame = { x: 40, y: 18, zoom: 1.8 };

    const restored = normalizeResume(JSON.parse(JSON.stringify(resume)));

    expect(restored.basics.photoFrame).toEqual({ x: 40, y: 18, zoom: 1.8 });
  });

  it('recentres rather than rejecting a value off the scale', () => {
    const resume = createEmptyResume();
    resume.basics.photoFrame = { x: -20, y: 500, zoom: 40 };

    expect(normalizeResume(resume).basics.photoFrame).toEqual({ x: 50, y: 50, zoom: 1 });
  });
});
