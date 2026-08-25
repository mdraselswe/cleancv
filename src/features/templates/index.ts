export { CategoryIcon, ICON_COMPONENTS, guessIcon } from './shared/CategoryIcon';
export {
  TEMPLATE_REGISTRY,
  getAvailableTemplates,
  getTemplate,
  getTemplatesByCategory,
} from './registry';

export { ResumeDocument } from './shared/ResumeDocument';
export { SectionBody } from './shared/SectionBody';
export { ContactRow } from './shared/ContactRow';

export { resolveTemplateStyle, shouldShowPhoto } from './utils/theme';

export type {
  TemplateComponent,
  TemplateMeta,
  TemplateModule,
  TemplateProps,
  TemplateSupports,
} from './types';
