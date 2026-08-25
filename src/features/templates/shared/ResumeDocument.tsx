import type { ReactNode } from 'react';

import type { Resume } from '@/features/resume';

import type { TemplateMeta } from '../types';
import { resolveTemplateStyle } from '../utils/theme';

export interface ResumeDocumentProps {
  resume: Resume;
  meta: TemplateMeta;
  /** Set by the headless print route. Kept for templates that need to know. */
  print?: boolean;
  /** Extra class from the template, e.g. `cdc` for classic-dc. */
  templateClass: string;
  children: ReactNode;
}

/**
 * The root every template renders into.
 *
 * It owns one thing: the `--rz-*` theme variables. The document is a margin-less
 * continuous flow — preview paints the A4 sheet around it, puppeteer applies the
 * page margins — so preview and PDF measure the same content box and cannot drift.
 */
export const ResumeDocument = ({
  resume,
  meta,
  print,
  templateClass,
  children,
}: ResumeDocumentProps) => (
  <div
    className={`resume-root ${templateClass} ${print ? 'resume-print' : ''}`.trim()}
    style={resolveTemplateStyle(resume.meta.theme, meta)}
    lang="en"
  >
    <div className="resume-flow">{children}</div>
  </div>
);
