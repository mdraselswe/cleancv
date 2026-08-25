import type { ComponentType } from 'react';

import type { SectionKey, TemplateCategory, TemplateId } from '@/constants';
import type { Resume, ResumeTheme } from '@/features/resume';

/** Capabilities a template opts into. The UI hides controls a template ignores. */
export interface TemplateSupports {
  photo: boolean;
  signature: boolean;
  accentColor: boolean;
  sidebar: boolean;
  /** Renders skill proficiency as bars or dots rather than plain text. */
  skillBars: boolean;
  /**
   * Draws the chosen glyph beside achievements and skill groups.
   *
   * Off for the plain designs and for the three built to match a reference
   * document, which have no gutter for one. The editor reads this so a picked
   * icon is never silently dropped — a control that does nothing is worse than
   * one that is absent.
   */
  icons: boolean;
  /**
   * Marks each entry with its section's glyph, so several entries under one
   * heading read as a list.
   *
   * Separate from `icons` because some designs already answer the question
   * another way — the classic design runs a dated timeline rail down the left,
   * the side-panel design a hairline between roles — and a marker on top of
   * those is noise, not help. Only meaningful where `icons` is on. See ADR-022.
   */
  entryMarkers: boolean;
  columns: 1 | 2;
}

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  category: TemplateCategory;
  /**
   * Ceiling the parseability score can reach with this design, before any
   * content-level deductions. A sidebar or a photo costs points here.
   */
  atsBaseline: number;
  supports: TemplateSupports;
  /** Sections this design can render. Anything else is dropped, and warned about. */
  supportedSections: readonly SectionKey[];
  defaultTheme: Partial<ResumeTheme>;
}

export interface TemplateProps {
  resume: Resume;
  /**
   * Print mode lets Chrome paginate one continuous column instead of the
   * preview's fixed A4 sheets. Same markup either way.
   */
  print?: boolean;
}

export type TemplateComponent = ComponentType<TemplateProps>;

export interface TemplateModule {
  meta: TemplateMeta;
  Template: TemplateComponent;
}
