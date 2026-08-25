import { DEFAULT_TEMPLATE_ID, type TemplateCategory, type TemplateId } from '@/constants';

import * as academicCv from './academic-cv';
import * as atsPlain from './ats-plain';
import * as classicDc from './classic-dc';
import * as compactPro from './compact-pro';
import * as elegantSerif from './elegant-serif';
import * as formalCentered from './formal-centered';
import * as modernSidebar from './modern-sidebar';
import * as sidePanel from './side-panel';
import * as vibrant from './vibrant';
import type { TemplateModule } from './types';

/**
 * The template registry.
 *
 * Adding a design means adding a folder that exports `meta` and `Template`, and
 * one line here. Nothing else in the app needs to know the design exists.
 */
export const TEMPLATE_REGISTRY: Partial<Record<TemplateId, TemplateModule>> = {
  'classic-dc': classicDc,
  'ats-plain': atsPlain,
  'modern-sidebar': modernSidebar,
  'academic-cv': academicCv,
  'elegant-serif': elegantSerif,
  vibrant,
  'compact-pro': compactPro,
  'formal-centered': formalCentered,
  'side-panel': sidePanel,
};

export const getTemplate = (id: TemplateId): TemplateModule => {
  const template = TEMPLATE_REGISTRY[id];
  if (template) return template;

  // A resume can name a template that was removed or is not built yet.
  return TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_ID] ?? classicDc;
};

export const getAvailableTemplates = (): TemplateModule[] =>
  Object.values(TEMPLATE_REGISTRY).filter((entry): entry is TemplateModule => Boolean(entry));

export const getTemplatesByCategory = (category: TemplateCategory): TemplateModule[] =>
  getAvailableTemplates().filter((entry) => entry.meta.category === category);
