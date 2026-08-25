import { rules as completeness } from './completeness';
import { rules as formatting } from './formatting';
import { rules as impact } from './impact';
import { rules as keywords } from './keywords';
import { rules as parseability } from './parseability';

import type { AtsRule } from '../types';

/** Every rule the engine runs, in category order. */
export const ATS_RULES: AtsRule[] = [
  ...parseability,
  ...completeness,
  ...impact,
  ...formatting,
  ...keywords,
];
