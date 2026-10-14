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
 */

export const RESUME_ICON_KEYS = [
  'auto',
  'monitor',
  'database',
  'chart',
  'brain',
  'wrench',
  'cloud',
  'palette',
  'diamond',
  'shield',
  'bolt',
  'trophy',
  'crown',
  'heart',
  'plug',
  'person',
  'star',
  'target',
  'rocket',
  'book',
  'globe',
  'briefcase',
  'graduation',
  'certificate',
  'flask',
  'mic',
  'handshake',
] as const;

export type ResumeIconKey = (typeof RESUME_ICON_KEYS)[number];

/** Every glyph except `auto`, which resolves to one of these. */
export type PickableIcon = Exclude<ResumeIconKey, 'auto'>;

/** Kept as the literal type so a comparison against it narrows the union. */
export const AUTO_ICON = 'auto' satisfies ResumeIconKey;

export const RESUME_ICON_LABEL: Record<ResumeIconKey, string> = {
  auto: 'স্বয়ংক্রিয়',
  monitor: 'স্ক্রিন',
  database: 'ডেটাবেস',
  chart: 'চার্ট',
  brain: 'AI',
  wrench: 'টুলস',
  cloud: 'ক্লাউড',
  palette: 'ডিজাইন',
  diamond: 'হীরা',
  shield: 'নিরাপত্তা',
  bolt: 'গতি',
  trophy: 'ট্রফি',
  crown: 'মুকুট',
  heart: 'স্বাস্থ্য',
  plug: 'ইন্টিগ্রেশন',
  person: 'ব্যক্তি',
  star: 'তারা',
  target: 'লক্ষ্য',
  rocket: 'লঞ্চ',
  book: 'শেখা',
  globe: 'ওয়েব',
  briefcase: 'কাজ',
  graduation: 'পড়াশোনা',
  certificate: 'সার্টিফিকেট',
  flask: 'গবেষণা',
  mic: 'বক্তব্য',
  handshake: 'স্বেচ্ছাসেবা',
};
