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
    description: 'জন্মতারিখ, জাতীয়তা, বৈবাহিক অবস্থা ও এ ধরনের ব্যক্তিগত তথ্য।',
  },
  contact: {
    key: 'contact',
    canonicalHeading: 'CONTACT',
    defaultHeading: 'Contact',
    kind: 'singleton',
    locked: true,
    defaultEnabled: true,
    headless: true,
    description: 'ফোন, ইমেইল, ঠিকানা আর প্রোফাইল লিংক। নামের নিচে বসে।',
  },
  summary: {
    key: 'summary',
    canonicalHeading: 'PROFESSIONAL SUMMARY',
    defaultHeading: 'Professional Summary',
    kind: 'singleton',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'যে পদের জন্য আবেদন করছেন, তার জন্য নিজেকে তুলে ধরার দুই থেকে চার লাইন।',
  },
  experience: {
    key: 'experience',
    canonicalHeading: 'WORK EXPERIENCE',
    defaultHeading: 'Work Experience',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'সাম্প্রতিক থেকে পুরনো ক্রমে পদগুলো, সঙ্গে মাপা যায় এমন বুলেট।',
  },
  education: {
    key: 'education',
    canonicalHeading: 'EDUCATION',
    defaultHeading: 'Education',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'ডিগ্রি, প্রতিষ্ঠান আর ফলাফল।',
  },
  skills: {
    key: 'skills',
    canonicalHeading: 'SKILLS',
    defaultHeading: 'Skills',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'গ্রুপ করে সাজানো টেকনিক্যাল ও পেশাগত দক্ষতা।',
  },
  projects: {
    key: 'projects',
    canonicalHeading: 'PROJECTS',
    defaultHeading: 'Projects',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'লিংক ও ফলাফলসহ ব্যক্তিগত বা পেশাগত কাজ।',
  },
  certifications: {
    key: 'certifications',
    canonicalHeading: 'CERTIFICATIONS',
    defaultHeading: 'Certifications',
    kind: 'list',
    locked: false,
    defaultEnabled: true,
    headless: false,
    description: 'প্রদানকারী প্রতিষ্ঠান ও তারিখসহ সার্টিফিকেট।',
  },
  achievements: {
    key: 'achievements',
    canonicalHeading: 'KEY ACHIEVEMENTS',
    defaultHeading: 'Key Achievements',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'আলাদা করে তুলে ধরার মতো উল্লেখযোগ্য অর্জন।',
  },
  awards: {
    key: 'awards',
    canonicalHeading: 'AWARDS AND HONORS',
    defaultHeading: 'Awards & Honors',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'পুরস্কার, বৃত্তি ও আনুষ্ঠানিক স্বীকৃতি।',
  },
  publications: {
    key: 'publications',
    canonicalHeading: 'PUBLICATIONS',
    defaultHeading: 'Publications',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'গবেষণাপত্র, প্রবন্ধ ও গবেষণার ফলাফল।',
  },
  training: {
    key: 'training',
    canonicalHeading: 'TRAINING AND WORKSHOPS',
    defaultHeading: 'Training & Workshops',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'আনুষ্ঠানিক সার্টিফিকেট নয়, এমন কোর্স ও ওয়ার্কশপ।',
  },
  languages: {
    key: 'languages',
    canonicalHeading: 'LANGUAGES',
    defaultHeading: 'Languages',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'কথা বলা ও লেখার ভাষা, সঙ্গে দক্ষতার স্তর।',
  },
  volunteering: {
    key: 'volunteering',
    canonicalHeading: 'VOLUNTEERING',
    defaultHeading: 'Volunteering',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'সমাজসেবা ও বিনা পারিশ্রমিকের কাজ।',
  },
  extracurricular: {
    key: 'extracurricular',
    canonicalHeading: 'EXTRACURRICULAR ACTIVITIES',
    defaultHeading: 'Extracurricular & Leadership',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'ক্লাব, সংগঠন ও নেতৃত্বের ভূমিকা।',
  },
  memberships: {
    key: 'memberships',
    canonicalHeading: 'PROFESSIONAL MEMBERSHIPS',
    defaultHeading: 'Professional Memberships',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'আপনি যেসব পেশাগত সংগঠনের সদস্য।',
  },
  conferences: {
    key: 'conferences',
    canonicalHeading: 'CONFERENCES AND TALKS',
    defaultHeading: 'Conferences & Talks',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'দেওয়া বক্তব্য ও অংশ নেওয়া সম্মেলন।',
  },
  patents: {
    key: 'patents',
    canonicalHeading: 'PATENTS',
    defaultHeading: 'Patents',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'নম্বরসহ অনুমোদিত বা অপেক্ষমাণ পেটেন্ট।',
  },
  interests: {
    key: 'interests',
    canonicalHeading: 'INTERESTS',
    defaultHeading: 'Interests & Hobbies',
    kind: 'singleton',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'ছোট ও নির্দিষ্ট একটি তালিকা। সাধারণ শখ লিখে লাভ নেই।',
  },
  references: {
    key: 'references',
    canonicalHeading: 'REFERENCES',
    defaultHeading: 'References',
    kind: 'list',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'পদবি ও যোগাযোগসহ রেফারি, অথবা "চাইলে দেওয়া হবে" লেখা।',
  },
  declaration: {
    key: 'declaration',
    canonicalHeading: 'DECLARATION',
    defaultHeading: 'Declaration',
    kind: 'singleton',
    locked: false,
    defaultEnabled: false,
    headless: false,
    description: 'তথ্য সঠিক হওয়ার আনুষ্ঠানিক ঘোষণা। দক্ষিণ এশিয়ার CV-তে প্রচলিত।',
  },
  signature: {
    key: 'signature',
    canonicalHeading: 'SIGNATURE',
    defaultHeading: 'Signature',
    kind: 'singleton',
    locked: false,
    defaultEnabled: false,
    headless: true,
    description: 'ডকুমেন্টের শেষে বসানো টাইপ করা বা আপলোড করা স্বাক্ষর।',
  },
};

/**
 * The name the *interface* gives a section.
 *
 * Separate from `defaultHeading` on purpose: that one is printed on the CV and
 * is the English an ATS looks for, while this one labels tabs and settings in
 * the editor, in the language the reader works in.
 */
export const SECTION_UI_LABEL: Record<SectionKey, string> = {
  personal: 'ব্যক্তিগত তথ্য',
  contact: 'প্রোফাইল',
  summary: 'সারসংক্ষেপ',
  experience: 'কাজের অভিজ্ঞতা',
  education: 'শিক্ষা',
  skills: 'দক্ষতা',
  projects: 'প্রজেক্ট',
  certifications: 'সার্টিফিকেশন',
  achievements: 'প্রধান অর্জন',
  awards: 'পুরস্কার ও সম্মাননা',
  publications: 'প্রকাশনা',
  training: 'প্রশিক্ষণ ও ওয়ার্কশপ',
  languages: 'ভাষা',
  volunteering: 'স্বেচ্ছাসেবা',
  extracurricular: 'সহশিক্ষা ও নেতৃত্ব',
  memberships: 'পেশাগত সদস্যপদ',
  conferences: 'সম্মেলন ও বক্তব্য',
  patents: 'পেটেন্ট',
  interests: 'আগ্রহ ও শখ',
  references: 'রেফারেন্স',
  declaration: 'ঘোষণা',
  signature: 'স্বাক্ষর',
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
  paragraph: 'অনুচ্ছেদ',
  bullets: 'বুলেট তালিকা',
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
    label: 'অভিজ্ঞ',
    description: 'অভিজ্ঞতা আগে। এটিই ডিফল্ট, আর বেশির ভাগ রিক্রুটার এটাই আশা করেন।',
    order: [...DEFAULT_SECTION_ORDER],
  },
  {
    id: 'fresher',
    label: 'ফ্রেশার / শিক্ষার্থী',
    description: 'শিক্ষা আর প্রজেক্ট আগে, তারপর সংক্ষিপ্ত কাজের ইতিহাস।',
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
    label: 'একাডেমিক CV',
    description: 'চাকরির আগে শিক্ষা, প্রকাশনা ও সম্মেলন।',
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
    label: 'আনুষ্ঠানিক / সরকারি',
    description: 'ব্যক্তিগত তথ্য দিয়ে শুরু, ঘোষণা দিয়ে শেষ।',
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
