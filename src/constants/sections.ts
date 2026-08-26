import type { PickableIcon } from './icons';
/**
 * Canonical section registry.
 *
 * `canonicalHeading` is the string ATS parsers recognise. Users may rename a section
 * for display, but the ATS engine always scores against the canonical value.
 */

export const SECTION_KEYS = [
  'personal',
  'contact',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'awards',
  'publications',
  'training',
  'languages',
  'volunteering',
  'extracurricular',
  'memberships',
  'conferences',
  'patents',
  'interests',
  'references',
  'declaration',
  'signature',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** Sections that hold a single object rather than a list of entries. */
export type SectionKind = 'singleton' | 'list';

export interface SectionMeta {
  key: SectionKey;
  /** Heading string ATS parsers look for. Never user-editable. */
  canonicalHeading: string;
  /** Default display heading; the user may override it per resume. */
  defaultHeading: string;
  kind: SectionKind;
  /** Locked sections cannot be disabled. */
  locked: boolean;
  /** Enabled when a resume is first created. */
  defaultEnabled: boolean;
  /** Rendered inside the identity block rather than as its own headed section. */
  headless: boolean;
  description: string;
}

export const SECTION_META: Record<SectionKey, SectionMeta> = {
  personal: {
    key: 'personal',
    canonicalHeading: 'PERSONAL INFORMATION',
    defaultHeading: 'Personal Information',
    kind: 'singleton',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Date of birth, nationality, marital status and similar civil details.',
  },
  contact: {
    key: 'contact',
    canonicalHeading: 'CONTACT',
    defaultHeading: 'Contact',
    kind: 'singleton',
    locked: true,
    defaultEnabled: true,
    headless: true,
    description: 'Phone, email, address and profile links. Rendered under your name.',
  },
  summary: {
    key: 'summary',
    canonicalHeading: 'PROFESSIONAL SUMMARY',
    defaultHeading: 'Professional Summary',
    kind: 'singleton',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'Two to four lines positioning you for the role you want.',
  },
  experience: {
    key: 'experience',
    canonicalHeading: 'WORK EXPERIENCE',
    defaultHeading: 'Work Experience',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'Roles in reverse-chronological order with measurable bullets.',
  },
  education: {
    key: 'education',
    canonicalHeading: 'EDUCATION',
    defaultHeading: 'Education',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'Degrees, institutions and results.',
  },
  skills: {
    key: 'skills',
    canonicalHeading: 'SKILLS',
    defaultHeading: 'Skills',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'Grouped technical and professional skills.',
  },
  projects: {
    key: 'projects',
    canonicalHeading: 'PROJECTS',
    defaultHeading: 'Projects',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'Personal or professional work with links and outcomes.',
  },
  certifications: {
    key: 'certifications',
    canonicalHeading: 'CERTIFICATIONS',
    defaultHeading: 'Certifications',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'Credentials with issuer and issue date.',
  },
  achievements: {
    key: 'achievements',
    canonicalHeading: 'KEY ACHIEVEMENTS',
    defaultHeading: 'Key Achievements',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Standout outcomes that deserve their own callout.',
  },
  awards: {
    key: 'awards',
    canonicalHeading: 'AWARDS AND HONORS',
    defaultHeading: 'Awards & Honors',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Prizes, scholarships and formal recognition.',
  },
  publications: {
    key: 'publications',
    canonicalHeading: 'PUBLICATIONS',
    defaultHeading: 'Publications',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Papers, articles and research output.',
  },
  training: {
    key: 'training',
    canonicalHeading: 'TRAINING AND WORKSHOPS',
    defaultHeading: 'Training & Workshops',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Courses and workshops that are not formal certifications.',
  },
  languages: {
    key: 'languages',
    canonicalHeading: 'LANGUAGES',
    defaultHeading: 'Languages',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Spoken and written languages with proficiency.',
  },
  volunteering: {
    key: 'volunteering',
    canonicalHeading: 'VOLUNTEERING',
    defaultHeading: 'Volunteering',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Community and unpaid work.',
  },
  extracurricular: {
    key: 'extracurricular',
    canonicalHeading: 'EXTRACURRICULAR ACTIVITIES',
    defaultHeading: 'Extracurricular & Leadership',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Clubs, societies and leadership roles.',
  },
  memberships: {
    key: 'memberships',
    canonicalHeading: 'PROFESSIONAL MEMBERSHIPS',
    defaultHeading: 'Professional Memberships',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Bodies and associations you belong to.',
  },
  conferences: {
    key: 'conferences',
    canonicalHeading: 'CONFERENCES AND TALKS',
    defaultHeading: 'Conferences & Talks',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Talks given and conferences attended.',
  },
  patents: {
    key: 'patents',
    canonicalHeading: 'PATENTS',
    defaultHeading: 'Patents',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Granted or pending patents with numbers.',
  },
  interests: {
    key: 'interests',
    canonicalHeading: 'INTERESTS',
    defaultHeading: 'Interests & Hobbies',
    kind: 'singleton',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'A short, specific list. Generic hobbies add nothing.',
  },
  references: {
    key: 'references',
    canonicalHeading: 'REFERENCES',
    defaultHeading: 'References',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Referees with designation and contact, or a statement on request.',
  },
  declaration: {
    key: 'declaration',
    canonicalHeading: 'DECLARATION',
    defaultHeading: 'Declaration',
    kind: 'singleton',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'Formal statement of accuracy, common on South Asian CVs.',
  },
  signature: {
    key: 'signature',
    canonicalHeading: 'SIGNATURE',
    defaultHeading: 'Signature',
    kind: 'singleton',
    locked: false,
    defaultEnabled: false,
    headless: true,
    description: 'Typed or uploaded signature placed at the end of the document.',
  },
};

/**
 * Sections that belong at the very end of any arrangement.
 *
 * A new custom section is placed before these rather than after them, and every
 * order preset ends with them, because a declaration or signature after a
 * "Portfolio" block reads as a document that was assembled carelessly.
 */
export const CLOSING_SECTION_KEYS: SectionKey[] = ['references', 'declaration', 'signature'];


/**
 * Other names a section is commonly given.
 *
 * One vocabulary, read by two features that would otherwise drift: the import
 * parser uses it to recognise a heading in someone else's CV, and the ATS
 * engine uses it to decide whether a rename is safe. "Professional Experience"
 * is not a risk — every parser knows it — and warning about it would be noise.
 */
export const SECTION_HEADING_ALIASES: Partial<Record<SectionKey, string[]>> = {
  summary: [
    'summary',
    'professional summary',
    'career objective',
    'objective',
    'profile',
    'about me',
    'career summary',
    'professional profile',
  ],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'employment',
    'employment history',
    'work history',
    'career history',
  ],
  education: ['education', 'academic background', 'academic qualification', 'qualifications'],
  skills: ['skills', 'technical skills', 'core skills', 'competencies', 'core competencies', 'expertise'],
  projects: ['projects', 'personal projects', 'selected projects', 'portfolio'],
  certifications: ['certifications', 'certificates', 'licenses', 'courses'],
  achievements: ['achievements', 'key achievements', 'accomplishments', 'highlights'],
  awards: ['awards', 'honors', 'honours', 'awards and honors'],
  publications: ['publications', 'papers', 'research'],
  conferences: ['conferences', 'talks', 'presentations'],
  patents: ['patents'],
  training: ['training', 'trainings', 'workshops', 'professional development'],
  languages: ['languages', 'language proficiency'],
  volunteering: ['volunteering', 'volunteer experience', 'community service'],
  extracurricular: ['extracurricular', 'activities', 'extra curricular activities'],
  memberships: ['memberships', 'affiliations', 'professional memberships'],
  interests: ['interests', 'hobbies', 'interests and hobbies'],
  personal: ['personal information', 'personal details', 'personal profile'],
  references: ['references', 'referees'],
  declaration: ['declaration'],
};

const normaliseHeading = (value: string): string =>
  value.toLowerCase().replace(/[^a-z& ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Whether a heading is one parsers are known to match on. */
export const isRecognisedHeading = (key: SectionKey, heading: string): boolean => {
  const value = normaliseHeading(heading);
  if (value.length === 0) return true;

  return (
    value === normaliseHeading(SECTION_META[key].canonicalHeading) ||
    value === normaliseHeading(SECTION_META[key].defaultHeading) ||
    (SECTION_HEADING_ALIASES[key] ?? []).some((alias) => normaliseHeading(alias) === value)
  );
};

/** Default top-to-bottom order for a new resume. */
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary',
  'experience',
  'skills',
  'education',
  'projects',
  'achievements',
  'certifications',
  'awards',
  'training',
  'publications',
  'conferences',
  'patents',
  'languages',
  'volunteering',
  'extracurricular',
  'memberships',
  'interests',
  'personal',
  'references',
  'declaration',
  'signature',
];

/**
 * User-defined sections.
 *
 * They live in `sectionOrder` as a slot string — `custom:<id>` — rather than in
 * a list bolted onto the end, so an extra section can sit anywhere in the
 * document. Built-in keys and custom slots are both `SectionSlot`.
 */
export const CUSTOM_SECTION_PREFIX = 'custom:';

export type CustomSectionSlot = `${typeof CUSTOM_SECTION_PREFIX}${string}`;

/** A position in the document: a built-in section, or a user-defined one. */
export type SectionSlot = SectionKey | CustomSectionSlot;

/**
 * Shapes a custom section can take. Deliberately only two: a parser reads a
 * paragraph and a bullet list reliably, and anything richer would need its own
 * field set in every template.
 */
export const CUSTOM_SECTION_LAYOUTS = ['paragraph', 'bullets'] as const;

export type CustomSectionLayout = (typeof CUSTOM_SECTION_LAYOUTS)[number];

export const CUSTOM_SECTION_LAYOUT_LABEL: Record<CustomSectionLayout, string> = {
  paragraph: 'Paragraph',
  bullets: 'Bullet list',
};

/** Custom sections a single resume may hold. Keeps the order list sane. */
export const MAX_CUSTOM_SECTIONS = 6;

export const isCustomSlot = (slot: string): slot is CustomSectionSlot =>
  slot.startsWith(CUSTOM_SECTION_PREFIX);

export const customSlot = (id: string): CustomSectionSlot => `${CUSTOM_SECTION_PREFIX}${id}`;

export const customIdOf = (slot: CustomSectionSlot): string =>
  slot.slice(CUSTOM_SECTION_PREFIX.length);

/**
 * Named arrangements.
 *
 * One standard order does not fit every document: a fresher's education belongs
 * above their experience, an academic's publications belong above both, and a
 * formal South Asian CV opens with personal details. Each preset is a
 * permutation of `DEFAULT_SECTION_ORDER` — a unit test enforces that, so a
 * preset can never silently drop a section.
 *
 * `contact` is absent from all of them: it is headless and templates place it
 * under the name.
 */
export interface SectionOrderPreset {
  id: string;
  label: string;
  description: string;
  order: SectionKey[];
}

export const SECTION_ORDER_PRESETS: SectionOrderPreset[] = [
  {
    id: 'standard',
    label: 'Experienced',
    description: 'Work first. The default, and what most recruiters expect.',
    order: [...DEFAULT_SECTION_ORDER],
  },
  {
    id: 'fresher',
    label: 'Fresher / Student',
    description: 'Education and projects lead, before a short work history.',
    order: [
      'summary',
      'education',
      'projects',
      'skills',
      'experience',
      'training',
      'certifications',
      'achievements',
      'awards',
      'extracurricular',
      'volunteering',
      'languages',
      'publications',
      'conferences',
      'patents',
      'memberships',
      'interests',
      'personal',
      'references',
      'declaration',
      'signature',
    ],
  },
  {
    id: 'academic',
    label: 'Academic CV',
    description: 'Education, publications and conferences ahead of employment.',
    order: [
      'summary',
      'education',
      'publications',
      'conferences',
      'patents',
      'experience',
      'training',
      'awards',
      'memberships',
      'skills',
      'projects',
      'achievements',
      'certifications',
      'languages',
      'volunteering',
      'extracurricular',
      'interests',
      'personal',
      'references',
      'declaration',
      'signature',
    ],
  },
  {
    id: 'formal',
    label: 'Formal / Government',
    description: 'Opens with personal details and closes with a declaration.',
    order: [
      'personal',
      'summary',
      'education',
      'experience',
      'skills',
      'training',
      'certifications',
      'achievements',
      'awards',
      'projects',
      'languages',
      'publications',
      'conferences',
      'patents',
      'volunteering',
      'extracurricular',
      'memberships',
      'interests',
      'references',
      'declaration',
      'signature',
    ],
  },
];

export const DEFAULT_PRESET_ID = SECTION_ORDER_PRESETS[0].id;

/**
 * The glyph that marks each entry of a section.
 *
 * A CV's repeatable sections are the ones a reader scans rather than reads, and
 * three roles under one heading run together on the page unless something says
 * where each begins. A marker in the left gutter does that in the way a reader
 * already expects — the same job a bullet does in a list — and costs nothing in
 * the text layer, because it is an inline SVG. See ADR-022.
 *
 * One glyph per section, not one per entry: the marker's job is to separate
 * siblings, and siblings that each looked different would separate nothing.
 * Sections absent here take no marker.
 */
export const SECTION_ENTRY_ICON: Partial<Record<SectionKey, PickableIcon>> = {
  experience: 'briefcase',
  education: 'graduation',
  projects: 'rocket',
  certifications: 'certificate',
  awards: 'trophy',
  training: 'book',
  publications: 'flask',
  conferences: 'mic',
  patents: 'shield',
  memberships: 'person',
  volunteering: 'handshake',
  extracurricular: 'star',
  references: 'person',
};

/**
 * Which column a section sits in on a two-column design.
 *
 * `main` is the wide, narrative column and `side` the panel, whichever side of
 * the paper each design puts them on. A document that says nothing takes the
 * design's own split; saying something is what lets a reader drag a section
 * from one column to the other. See ADR-043.
 */
export const SECTION_COLUMNS = ['main', 'side'] as const;
export type SectionColumn = (typeof SECTION_COLUMNS)[number];

/**
 * A glyph for every section, for designs that mark the heading itself.
 *
 * Complete where `SECTION_ENTRY_ICON` is partial: that one marks entries, and a
 * section with no entries needs none, while a heading always has one to draw.
 * The two agree wherever both have an opinion, so a design using both does not
 * show a section two different shapes.
 */
export const SECTION_HEADING_ICON: Record<SectionKey, PickableIcon> = {
  personal: 'person',
  contact: 'globe',
  summary: 'target',
  experience: 'briefcase',
  education: 'graduation',
  skills: 'wrench',
  projects: 'rocket',
  certifications: 'certificate',
  achievements: 'crown',
  awards: 'trophy',
  publications: 'flask',
  training: 'book',
  languages: 'mic',
  volunteering: 'handshake',
  extracurricular: 'star',
  memberships: 'diamond',
  conferences: 'mic',
  patents: 'shield',
  interests: 'heart',
  references: 'person',
  declaration: 'shield',
  signature: 'person',
};

/**
 * Editor panels the score panel can send the reader to.
 *
 * Some fixes are not in a section's form at all: choosing a design that parses,
 * tightening the type, renaming a heading back, turning a section on. Those
 * live in the Design and Sections panels, and a rule that points at a section
 * instead sends the reader somewhere the fix is not. Prefixed like a custom
 * slot so a panel target can never be mistaken for a section key. See ADR-028.
 */
export const ATS_PANEL_PREFIX = 'panel:';

export const ATS_PANELS = ['design', 'sections'] as const;

export type AtsPanelId = (typeof ATS_PANELS)[number];
export type AtsPanelTarget = `${typeof ATS_PANEL_PREFIX}${AtsPanelId}`;

/** Where a rule's fix lives: one of the document's sections, or a panel. */
export type AtsFixTarget = SectionSlot | AtsPanelTarget;

export const panelTarget = (panel: AtsPanelId): AtsPanelTarget =>
  `${ATS_PANEL_PREFIX}${panel}`;

export const isPanelTarget = (target: string): target is AtsPanelTarget =>
  target.startsWith(ATS_PANEL_PREFIX);

export const panelIdOf = (target: AtsPanelTarget): AtsPanelId =>
  target.slice(ATS_PANEL_PREFIX.length) as AtsPanelId;
