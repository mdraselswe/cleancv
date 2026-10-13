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
  /**
   * A multiplier the design applies to its own size before the reader's Text
   * size does.
   *
   * For a design whose stylesheet is set small — Classic Timeline is matched to a
   * reference that prints its body at 7.6pt. Putting the correction here, not in
   * `defaultTheme`, keeps the slider honest: 100% is the size the design
   * intends and prints readably, a switch between designs never carries one
   * design's 120% onto another, and the stylesheet stays as it was measured.
   * Absent means 1.
   */
  baseScale?: number;
  /**
   * Sections the wide column holds when the document does not say otherwise.
   *
   * Two-column designs only, and everything unlisted — including a custom
   * section — takes the panel. It is the *default* split: a reader dragging a
   * section across in the page map stores an override against the document, and
   * that wins. See ADR-043.
   */
  mainSections?: readonly SectionKey[];
  /**
   * A band of accent down the left of the paper, running the full height of
   * every page.
   *
   * Two things make it reach the edges. The page's *left* margin is dropped, so
   * the flow starts at the paper's edge and the design insets its own content
   * instead — horizontal padding applies on every fragment, unlike vertical.
   * And the band is painted by the page rather than by an element in the flow,
   * so it covers the last page too, where the flow itself stops with the
   * content.
   *
   * The top and bottom margins stay: they are the only thing keeping page two's
   * first line off the paper edge, so the band stops a margin short there.
   *
   * `width` is measured from the paper's left edge and reaches the template's
   * stylesheet as `--rz-bleed`. See ADR-036.
   */
  pageBleed?: { width: string };
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
