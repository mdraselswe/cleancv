import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SECTION_ORDER,
  SECTION_ORDER_PRESETS,
  customSlot,
  type SectionKey,
} from '@/constants';
import { buildBackup, parseBackup, serializeBackup } from '@/features/library';
import {
  applyPresetToOrder,
  createCustomSection,
  createSampleResume,
  normalizeResume,
} from '@/features/resume';

describe('section order presets', () => {
  it.each(SECTION_ORDER_PRESETS)('$label is a complete arrangement', (preset) => {
    // A preset that silently drops a section would delete the user's content
    // from the page with no way to notice.
    expect([...preset.order].sort()).toEqual([...DEFAULT_SECTION_ORDER].sort());
  });

  it.each(SECTION_ORDER_PRESETS)('$label lists no section twice', (preset) => {
    expect(new Set(preset.order).size).toBe(preset.order.length);
  });

  it('keeps custom sections when a preset is applied', () => {
    const section = createCustomSection();
    const slot = customSlot(section.id);
    const current = [...DEFAULT_SECTION_ORDER, slot];
    const fresher = SECTION_ORDER_PRESETS.find((preset) => preset.id === 'fresher');

    const next = applyPresetToOrder(fresher!.order, current);

    expect(next).toContain(slot);
    expect(next.filter((entry) => entry === slot)).toHaveLength(1);
    // Ahead of the closing sections, not stranded at the very bottom.
    expect(next.indexOf(slot)).toBeLessThan(next.indexOf('references' as SectionKey));
  });

  it('produces an order the schema accepts', () => {
    const academic = SECTION_ORDER_PRESETS.find((preset) => preset.id === 'academic');
    const resume = createSampleResume();
    resume.meta.sectionOrder = applyPresetToOrder(academic!.order, resume.meta.sectionOrder);

    const normalized = normalizeResume(resume);

    expect(normalized.meta.sectionOrder).toEqual(resume.meta.sectionOrder);
  });
});

describe('library backups', () => {
  const document = () => ({
    meta: {
      id: 'cv_1',
      name: 'Backend application',
      personName: 'Muhammad Rasel',
      createdAt: 1,
      updatedAt: 2,
      cloud: false,
    },
    resume: createSampleResume(),
  });

  it('round-trips every document', () => {
    const result = parseBackup(serializeBackup([document()]));

    expect(result.ok).toBe(true);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].meta.name).toBe('Backend application');
    expect(result.documents[0].resume.experience).toHaveLength(
      document().resume.experience.length,
    );
  });

  it('stamps the export so a restore can tell files apart', () => {
    const backup = buildBackup([document()]);

    expect(backup.kind).toBe('cv-maker.backup');
    expect(backup.exportedAt).toBeGreaterThan(0);
  });

  it('reports a readable error rather than throwing', () => {
    expect(parseBackup('{ not json').ok).toBe(false);
    expect(parseBackup('{"documents":[]}').error).toBeTruthy();
  });
});
