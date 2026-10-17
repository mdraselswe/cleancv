import { SECTION_META, isCustomSlot, type SectionSlot } from '@/constants';
import { getSectionHeading, type Resume } from '@/features/resume';

import type { TemplateMeta } from '../types';

/**
 * The heading a design prints for a section.
 *
 * The reader's own name for the section always wins. Otherwise a design may
 * word a default heading its own way - "Experience" where the app says "Work
 * Experience" - as long as the wording is on the recognised list. One resolver,
 * so the template that prints it and the regression gate that looks for it in
 * the extracted text agree on what it is.
 */
export const resolveSectionHeading = (
  resume: Resume,
  meta: TemplateMeta,
  slot: SectionSlot,
): string => {
  const heading = getSectionHeading(resume, slot);
  if (isCustomSlot(slot)) return heading;

  const wording = meta.headingWording?.[slot];

  return wording && heading === SECTION_META[slot].defaultHeading ? wording : heading;
};
