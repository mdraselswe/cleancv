import {
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  FileSignature,
  FileText,
  FolderKanban,
  GraduationCap,
  Heart,
  HeartHandshake,
  Languages,
  Layers,
  Lightbulb,
  Mic2,
  Palette,
  PenLine,
  ScrollText,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  Wrench,
  LayoutList,
  Target,
  Contact,
  type LucideIcon,
} from 'lucide-react';

import type { Hue } from '@/components/ui';
import type { SectionScene } from '@/components/illustrations';
import { isCustomSlot, type SectionSlot } from '@/constants';

import type { EditorPanel } from './hooks/useActiveSection';

/**
 * How a section looks in the app's own chrome: a glyph, a hue and a scene.
 *
 * A record of components rather than a function returning one — React's lint
 * rules read a component made during render as a defect. See rule 14.
 */
export interface SectionVisual {
  Icon: LucideIcon;
  hue: Hue;
  scene: SectionScene;
}

const SECTION_VISUAL: Record<string, SectionVisual> = {
  contact: { Icon: UserRound, hue: 'indigo', scene: 'profile' },
  personal: { Icon: Contact, hue: 'sky', scene: 'profile' },
  summary: { Icon: FileText, hue: 'violet', scene: 'story' },
  experience: { Icon: Briefcase, hue: 'pink', scene: 'work' },
  education: { Icon: GraduationCap, hue: 'amber', scene: 'learn' },
  skills: { Icon: Wrench, hue: 'emerald', scene: 'skills' },
  projects: { Icon: FolderKanban, hue: 'teal', scene: 'work' },
  certifications: { Icon: BadgeCheck, hue: 'sky', scene: 'learn' },
  achievements: { Icon: Trophy, hue: 'amber', scene: 'story' },
  awards: { Icon: Award, hue: 'rose', scene: 'story' },
  publications: { Icon: BookOpen, hue: 'violet', scene: 'learn' },
  training: { Icon: Sparkles, hue: 'teal', scene: 'learn' },
  languages: { Icon: Languages, hue: 'sky', scene: 'skills' },
  volunteering: { Icon: HeartHandshake, hue: 'rose', scene: 'story' },
  extracurricular: { Icon: Users, hue: 'pink', scene: 'story' },
  memberships: { Icon: Building2, hue: 'indigo', scene: 'work' },
  conferences: { Icon: Mic2, hue: 'violet', scene: 'story' },
  patents: { Icon: Lightbulb, hue: 'amber', scene: 'skills' },
  interests: { Icon: Heart, hue: 'rose', scene: 'story' },
  references: { Icon: ScrollText, hue: 'teal', scene: 'profile' },
  declaration: { Icon: FileSignature, hue: 'indigo', scene: 'story' },
  signature: { Icon: PenLine, hue: 'violet', scene: 'story' },
};

const CUSTOM_VISUAL: SectionVisual = { Icon: Layers, hue: 'teal', scene: 'story' };

const PANEL_VISUAL: Record<EditorPanel, SectionVisual> = {
  design: { Icon: Palette, hue: 'pink', scene: 'design' },
  sections: { Icon: LayoutList, hue: 'indigo', scene: 'sections' },
  job: { Icon: Target, hue: 'emerald', scene: 'skills' },
};

export const getSectionVisual = (slot: SectionSlot): SectionVisual =>
  isCustomSlot(slot) ? CUSTOM_VISUAL : (SECTION_VISUAL[slot] ?? CUSTOM_VISUAL);

export const getPanelVisual = (panel: EditorPanel): SectionVisual => PANEL_VISUAL[panel];
