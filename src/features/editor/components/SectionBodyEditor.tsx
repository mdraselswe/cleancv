'use client';

import { isCustomSlot, type SectionSlot } from '@/constants';
import { isEntryListKey } from '@/features/resume';

import { EntryListSection } from './EntryListSection';
import {
  DeclarationSection,
  InterestsSection,
  ReferencesSection,
  SignatureSection,
} from './sections/ClosingSections';
import { CustomSectionEditor } from './sections/CustomSectionEditor';
import { IdentitySection } from './sections/IdentitySection';
import { PersonalSection } from './sections/PersonalSection';
import { SummarySection } from './sections/SummarySection';

export interface SectionBodyEditorProps {
  sectionKey: SectionSlot;
}

/**
 * Routes a section key to its form. The fifteen repeatable sections all land on
 * `EntryListSection`; only the genuinely different ones get their own component.
 */
export const SectionBodyEditor = ({ sectionKey }: SectionBodyEditorProps) => {
  if (isCustomSlot(sectionKey)) return <CustomSectionEditor slot={sectionKey} />;
  if (isEntryListKey(sectionKey)) return <EntryListSection sectionKey={sectionKey} />;

  switch (sectionKey) {
    case 'contact':
      return <IdentitySection />;
    case 'summary':
      return <SummarySection />;
    case 'personal':
      return <PersonalSection />;
    case 'interests':
      return <InterestsSection />;
    case 'references':
      return <ReferencesSection />;
    case 'declaration':
      return <DeclarationSection />;
    case 'signature':
      return <SignatureSection />;
    default:
      return null;
  }
};
