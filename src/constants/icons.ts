/**
 * Glyphs a skill group or an achievement can carry.
 *
 * `auto` is the default and picks from the words the user typed, which is right
 * almost always and free. The rest exist because "almost always" is not always:
 * nothing in "Soft Skills" or "Military Service" tells the matcher what the
 * group is about, and a wrong glyph is worse than a plain one.
 *
 * Only templates with an icon gutter draw these; the others ignore the field
 * entirely, so choosing one never costs anything elsewhere.
 *
 * A key, once published, is stored in saved documents and in exported PDFs: add
 * to this list, never rename or reorder what is there. See ADR-030.
 */

export const ICON_GROUPS = [
  'general',
  'tech',
  'data',
  'business',
  'creative',
  'people',
  'science',
  'industry',
] as const;

export type IconGroup = (typeof ICON_GROUPS)[number];

export const ICON_GROUP_LABEL: Record<IconGroup, { bn: string; en: string }> = {
  general: { bn: 'সাধারণ', en: 'General' },
  tech: { bn: 'প্রযুক্তি', en: 'Technology' },
  data: { bn: 'ডেটা ও হিসাব', en: 'Data & numbers' },
  business: { bn: 'ব্যবসা ও অফিস', en: 'Business & office' },
  creative: { bn: 'ক্রিয়েটিভ', en: 'Creative' },
  people: { bn: 'মানুষ ও শেখা', en: 'People & learning' },
  science: { bn: 'বিজ্ঞান ও স্বাস্থ্য', en: 'Science & health' },
  industry: { bn: 'শিল্প ও নির্মাণ', en: 'Industry & trade' },
};

/** [key, group, Bangla name, English name, extra search words in both languages] */
const CATALOG = [
  // General
  ['star', 'general', 'তারা', 'Star', 'favourite best highlight প্রিয় সেরা'],
  ['diamond', 'general', 'হীরা', 'Diamond', 'premium value leadership মূল্যবান নেতৃত্ব'],
  ['crown', 'general', 'মুকুট', 'Crown', 'leader top king নেতা সেরা'],
  ['trophy', 'general', 'ট্রফি', 'Trophy', 'win award champion পুরস্কার জয়'],
  ['target', 'general', 'লক্ষ্য', 'Target', 'goal aim objective লক্ষ্য উদ্দেশ্য'],
  ['rocket', 'general', 'লঞ্চ', 'Launch', 'startup growth ship শুরু প্রবৃদ্ধি'],
  ['bolt', 'general', 'গতি', 'Speed', 'fast performance energy গতি দ্রুত'],
  ['shield', 'general', 'নিরাপত্তা', 'Security', 'safe protect privacy সুরক্ষা'],
  ['globe', 'general', 'ওয়েব', 'Web', 'world international language internet বিশ্ব ভাষা'],
  ['flag', 'general', 'মাইলফলক', 'Milestone', 'flag goal country পতাকা'],
  ['compass', 'general', 'কৌশল', 'Strategy', 'direction plan navigate দিকনির্দেশ পরিকল্পনা'],
  ['lightbulb', 'general', 'আইডিয়া', 'Idea', 'innovation think creative নতুন চিন্তা'],
  ['puzzle', 'general', 'সমস্যা সমাধান', 'Problem solving', 'puzzle solve logic সমাধান'],
  ['badge-check', 'general', 'যাচাইকৃত', 'Verified', 'certified approved trusted'],
  ['award', 'general', 'পুরস্কার', 'Award', 'prize honour recognition সম্মাননা'],
  ['medal', 'general', 'পদক', 'Medal', 'achievement rank সাফল্য'],
  // Technology
  ['monitor', 'tech', 'স্ক্রিন', 'Screen', 'frontend ui display desktop ফ্রন্টএন্ড'],
  ['code', 'tech', 'কোড', 'Code', 'programming developer software language প্রোগ্রামিং'],
  ['terminal', 'tech', 'টার্মিনাল', 'Terminal', 'command line shell cli bash'],
  ['cpu', 'tech', 'প্রসেসর', 'Processor', 'hardware chip embedded'],
  ['server', 'tech', 'সার্ভার', 'Server', 'backend hosting infrastructure ব্যাকএন্ড'],
  ['database', 'tech', 'ডেটাবেস', 'Database', 'sql storage data mongodb postgres'],
  ['cloud', 'tech', 'ক্লাউড', 'Cloud', 'aws azure gcp hosting deploy'],
  ['brain', 'tech', 'AI', 'AI', 'artificial intelligence machine learning ml llm'],
  ['bot', 'tech', 'বট', 'Bot', 'automation chatbot agent robot'],
  ['sparkles', 'tech', 'স্মার্ট', 'Smart', 'ai magic generative new'],
  ['smartphone', 'tech', 'মোবাইল', 'Mobile', 'android ios app phone flutter'],
  ['laptop', 'tech', 'ল্যাপটপ', 'Laptop', 'computer it device'],
  ['git-branch', 'tech', 'ভার্সন কন্ট্রোল', 'Version control', 'git github branch merge'],
  ['bug', 'tech', 'বাগ', 'Bug', 'testing qa debug quality'],
  ['lock', 'tech', 'লক', 'Lock', 'security encryption auth password'],
  ['key', 'tech', 'চাবি', 'Key', 'access auth credentials'],
  ['network', 'tech', 'নেটওয়ার্ক', 'Network', 'networking connectivity topology'],
  ['layers', 'tech', 'স্তর', 'Layers', 'stack architecture structure'],
  ['package', 'tech', 'প্যাকেজ', 'Package', 'npm library module delivery'],
  ['blocks', 'tech', 'ব্লক', 'Blocks', 'component modular blockchain'],
  ['component', 'tech', 'কম্পোনেন্ট', 'Component', 'design system ui library'],
  ['webhook', 'tech', 'ওয়েবহুক', 'Webhook', 'api integration events'],
  ['plug', 'tech', 'ইন্টিগ্রেশন', 'Integration', 'plugin connect api partner'],
  ['wrench', 'tech', 'টুলস', 'Tools', 'devops build maintenance repair'],
  ['wifi', 'tech', 'ওয়াইফাই', 'Wi-Fi', 'wireless internet connectivity'],
  ['hard-drive', 'tech', 'স্টোরেজ', 'Storage', 'disk backup drive'],
  ['braces', 'tech', 'কোড ব্লক', 'Braces', 'json syntax object'],
  ['workflow', 'tech', 'ওয়ার্কফ্লো', 'Workflow', 'pipeline process automation ci cd'],
  ['container', 'tech', 'কনটেইনার', 'Container', 'docker kubernetes deploy'],
  // Data & numbers
  ['chart', 'data', 'চার্ট', 'Pie chart', 'analytics share report'],
  ['bar-chart', 'data', 'বার চার্ট', 'Bar chart', 'statistics report dashboard'],
  ['line-chart', 'data', 'লাইন চার্ট', 'Line chart', 'trend forecast metrics'],
  ['trending-up', 'data', 'প্রবৃদ্ধি', 'Growth', 'sales increase improvement বৃদ্ধি'],
  ['table', 'data', 'টেবিল', 'Table', 'spreadsheet excel data grid'],
  ['calculator', 'data', 'হিসাব', 'Calculator', 'accounting math finance'],
  ['percent', 'data', 'শতাংশ', 'Percent', 'discount rate ratio'],
  ['gauge', 'data', 'মিটার', 'Gauge', 'kpi performance level'],
  ['activity', 'data', 'কার্যক্রম', 'Activity', 'monitoring pulse live'],
  ['search', 'data', 'খোঁজা', 'Search', 'seo research find discovery'],
  ['funnel', 'data', 'ফিল্টার', 'Filter', 'funnel pipeline conversion'],
  // Business & office
  ['briefcase', 'business', 'কাজ', 'Work', 'job career professional'],
  ['building', 'business', 'প্রতিষ্ঠান', 'Company', 'organisation office enterprise কোম্পানি'],
  ['store', 'business', 'দোকান', 'Store', 'retail shop ecommerce'],
  ['banknote', 'business', 'টাকা', 'Money', 'finance cash salary budget অর্থ'],
  ['wallet', 'business', 'ওয়ালেট', 'Wallet', 'payments finance'],
  ['credit-card', 'business', 'কার্ড', 'Payments', 'billing card checkout'],
  ['scale', 'business', 'আইন', 'Legal', 'law compliance justice balance'],
  ['gavel', 'business', 'বিচার', 'Law', 'court judge legal'],
  ['landmark', 'business', 'ব্যাংক', 'Bank', 'finance government institution'],
  ['clipboard-check', 'business', 'চেকলিস্ট', 'Checklist', 'project management agile scrum tasks'],
  ['calendar', 'business', 'ক্যালেন্ডার', 'Calendar', 'schedule planning events'],
  ['clock', 'business', 'সময়', 'Time', 'deadline hours schedule'],
  ['megaphone', 'business', 'মার্কেটিং', 'Marketing', 'campaign advertising brand pr'],
  ['presentation', 'business', 'প্রেজেন্টেশন', 'Presentation', 'slides pitch training'],
  ['file-text', 'business', 'ডকুমেন্ট', 'Document', 'report writing paper contract'],
  ['certificate', 'business', 'সার্টিফিকেট', 'Certificate', 'certification credential licence'],
  ['mail', 'business', 'ইমেইল', 'Email', 'communication newsletter outreach'],
  ['phone', 'business', 'ফোন', 'Phone', 'call contact support'],
  ['headset', 'business', 'সাপোর্ট', 'Support', 'customer service help desk'],
  ['shopping-cart', 'business', 'কেনাকাটা', 'Shopping', 'cart ecommerce procurement'],
  ['truck', 'business', 'ডেলিভারি', 'Delivery', 'logistics supply chain transport'],
  ['map', 'business', 'ম্যাপ', 'Map', 'location geography planning'],
  // Creative
  ['palette', 'creative', 'ডিজাইন', 'Design', 'ui ux figma brand colour'],
  ['pen-tool', 'creative', 'ডিজাইন টুল', 'Pen tool', 'vector illustration graphic'],
  ['brush', 'creative', 'ব্রাশ', 'Brush', 'art painting illustration'],
  ['camera', 'creative', 'ক্যামেরা', 'Photography', 'photo camera shoot'],
  ['video', 'creative', 'ভিডিও', 'Video', 'film editing production youtube'],
  ['film', 'creative', 'ফিল্ম', 'Film', 'cinema movie media'],
  ['music', 'creative', 'সংগীত', 'Music', 'audio sound song'],
  ['image', 'creative', 'ছবি', 'Image', 'picture graphic visual'],
  ['type', 'creative', 'টাইপোগ্রাফি', 'Typography', 'font text writing'],
  ['layout', 'creative', 'লেআউট', 'Layout', 'dashboard wireframe structure'],
  ['ruler', 'creative', 'মাপ', 'Ruler', 'measure drawing precision'],
  ['shapes', 'creative', 'আকার', 'Shapes', 'geometry graphics'],
  ['newspaper', 'creative', 'সংবাদ', 'News', 'journalism media press'],
  ['pen-line', 'creative', 'লেখালেখি', 'Writing', 'content copywriting blog author'],
  ['mic', 'creative', 'বক্তব্য', 'Speaking', 'talk conference podcast presentation'],
  // People & learning
  ['person', 'people', 'ব্যক্তি', 'Person', 'individual profile personal'],
  ['users', 'people', 'টিম', 'Team', 'leadership group collaboration soft skills'],
  ['user-check', 'people', 'নির্বাচিত ব্যক্তি', 'Verified person', 'hiring recruitment hr'],
  ['message-square', 'people', 'যোগাযোগ', 'Communication', 'chat feedback talk'],
  ['handshake', 'people', 'স্বেচ্ছাসেবা', 'Volunteering', 'partnership deal agreement community'],
  ['heart-handshake', 'people', 'সহযোগিতা', 'Collaboration', 'support charity cooperation'],
  ['hand-heart', 'people', 'দান', 'Charity', 'donation nonprofit ngo'],
  ['languages', 'people', 'ভাষা', 'Languages', 'translation bilingual english bangla'],
  ['book', 'people', 'শেখা', 'Learning', 'study reading education'],
  ['book-open', 'people', 'পাঠ', 'Reading', 'literature library publication'],
  ['graduation', 'people', 'পড়াশোনা', 'Study', 'degree university education graduation'],
  ['school', 'people', 'স্কুল', 'School', 'teaching teacher classroom'],
  ['library', 'people', 'লাইব্রেরি', 'Library', 'archive research books'],
  ['baby', 'people', 'শিশু', 'Childcare', 'children family parenting'],
  ['dumbbell', 'people', 'ফিটনেস', 'Fitness', 'sport gym training'],
  ['coffee', 'people', 'কফি', 'Coffee', 'hospitality cafe'],
  ['utensils', 'people', 'খাবার', 'Food', 'cooking restaurant catering chef'],
  ['gamepad', 'people', 'গেম', 'Gaming', 'game esports play'],
  // Science & health
  ['heart', 'science', 'স্বাস্থ্য', 'Health', 'care medical wellbeing'],
  ['stethoscope', 'science', 'চিকিৎসা', 'Medical', 'doctor nurse clinic healthcare'],
  ['pill', 'science', 'ওষুধ', 'Pharmacy', 'medicine pharma drug'],
  ['syringe', 'science', 'টিকা', 'Vaccine', 'injection lab clinical'],
  ['hospital', 'science', 'হাসপাতাল', 'Hospital', 'healthcare clinic'],
  ['flask', 'science', 'গবেষণা', 'Research', 'lab chemistry experiment science'],
  ['microscope', 'science', 'মাইক্রোস্কোপ', 'Microscope', 'biology lab analysis'],
  ['atom', 'science', 'পরমাণু', 'Physics', 'atom science engineering'],
  ['dna', 'science', 'ডিএনএ', 'Biotech', 'genetics biology bioinformatics'],
  ['leaf', 'science', 'পরিবেশ', 'Environment', 'sustainability green ecology'],
  ['sprout', 'science', 'কৃষি', 'Agriculture', 'farming plant growth agro'],
  // Industry & trade
  ['hammer', 'industry', 'নির্মাণ', 'Construction', 'build civil carpentry'],
  ['hard-hat', 'industry', 'ইঞ্জিনিয়ারিং', 'Engineering', 'site safety civil'],
  ['cog', 'industry', 'কারিগরি', 'Mechanical', 'settings machinery process'],
  ['factory', 'industry', 'কারখানা', 'Manufacturing', 'production plant industry'],
  ['zap', 'industry', 'বিদ্যুৎ', 'Electrical', 'power energy electric'],
  ['flame', 'industry', 'জ্বালানি', 'Fuel', 'energy oil gas heat'],
  ['droplets', 'industry', 'পানি', 'Water', 'utility irrigation plumbing'],
  ['sun', 'industry', 'সৌর', 'Solar', 'renewable energy power'],
  ['plane', 'industry', 'বিমান', 'Aviation', 'travel airline flight'],
  ['car', 'industry', 'গাড়ি', 'Automotive', 'vehicle driving transport'],
  ['ship', 'industry', 'জাহাজ', 'Shipping', 'marine cargo port'],
  ['anchor', 'industry', 'নৌ', 'Marine', 'maritime navy harbour'],
  ['house', 'industry', 'বাড়ি', 'Real estate', 'property home housing'],
  ['satellite', 'industry', 'স্যাটেলাইট', 'Satellite', 'space telecom communication'],
  ['radio', 'industry', 'রেডিও', 'Broadcast', 'radio telecom signal'],
  ['cable', 'industry', 'তার', 'Cabling', 'wiring telecom electrical'],
  ['shirt', 'industry', 'পোশাক', 'Fashion', 'garments apparel textile'],
  ['scissors', 'industry', 'কাঁচি', 'Tailoring', 'cutting craft garment'],
  ['trees', 'industry', 'বন', 'Forestry', 'nature wood environment'],
  ['bike', 'industry', 'সাইকেল', 'Cycling', 'bicycle sport transport'],
  ['share', 'industry', 'শেয়ার', 'Sharing', 'distribution social network'],
] as const;

type CatalogRow = (typeof CATALOG)[number];

export const RESUME_ICON_KEYS = ['auto', ...CATALOG.map((row) => row[0])] as unknown as readonly [
  'auto',
  ...CatalogRow[0][],
];

export type ResumeIconKey = 'auto' | CatalogRow[0];

/** Every glyph except `auto`, which resolves to one of these. */
export type PickableIcon = Exclude<ResumeIconKey, 'auto'>;

/** Kept as the literal type so a comparison against it narrows the union. */
export const AUTO_ICON = 'auto' satisfies ResumeIconKey;

export interface IconCatalogEntry {
  key: PickableIcon;
  group: IconGroup;
  bn: string;
  en: string;
  /** Lower-cased search text: both names and the synonyms people type. */
  search: string;
}

export const ICON_CATALOG: readonly IconCatalogEntry[] = CATALOG.map(
  ([key, group, bn, en, words]) => ({
    key,
    group,
    bn,
    en,
    search: `${key} ${bn} ${en} ${words}`.toLowerCase(),
  }),
);

export const RESUME_ICON_LABEL: Record<ResumeIconKey, string> = {
  auto: 'স্বয়ংক্রিয়',
  ...(Object.fromEntries(CATALOG.map((row) => [row[0], row[2]])) as Record<PickableIcon, string>),
};
