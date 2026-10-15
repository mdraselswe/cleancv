import { AUTO_ICON, type PickableIcon, type ResumeIconKey } from '@/constants';

import {
  BoltIcon,
  BookIcon,
  BriefcaseIcon,
  CertificateIcon,
  BrainIcon,
  CloudIcon,
  CrownIcon,
  DatabaseIcon,
  DiamondIcon,
  FlaskIcon,
  GlobeIcon,
  GraduationIcon,
  HandshakeIcon,
  HeartIcon,
  MicIcon,
  MonitorIcon,
  PaletteIcon,
  PersonIcon,
  PieIcon,
  PlugIcon,
  RocketIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
  WrenchIcon,
} from './Icons';
import { EXTRA_ICON_COMPONENTS } from './CatalogIcons';

/**
 * A glyph beside a skill group or an achievement.
 *
 * Inline SVG, so it adds nothing to the extracted text — an icon font would put
 * a Private Use Area codepoint immediately before "Frontend" and take the whole
 * line down with it. See ADR-003.
 *
 * The user may choose one. When they have not, it is guessed from the words
 * they typed, because those are the only signal available: nothing in the data
 * model says what kind of thing a group called "State & API" is. A guess that
 * finds nothing falls back to the caller's neutral mark rather than to a wrong
 * one — a trophy beside "Programming Languages" reads as a bug.
 */

type IconComponent = typeof MonitorIcon;

/** Every glyph a user can pick, keyed by the stored value. */
export const ICON_COMPONENTS: Record<PickableIcon, IconComponent> = {
  ...EXTRA_ICON_COMPONENTS,
  monitor: MonitorIcon,
  database: DatabaseIcon,
  chart: PieIcon,
  brain: BrainIcon,
  wrench: WrenchIcon,
  cloud: CloudIcon,
  palette: PaletteIcon,
  diamond: DiamondIcon,
  shield: ShieldIcon,
  bolt: BoltIcon,
  trophy: TrophyIcon,
  crown: CrownIcon,
  heart: HeartIcon,
  plug: PlugIcon,
  person: PersonIcon,
  star: StarIcon,
  target: TargetIcon,
  rocket: RocketIcon,
  book: BookIcon,
  globe: GlobeIcon,
  briefcase: BriefcaseIcon,
  graduation: GraduationIcon,
  certificate: CertificateIcon,
  flask: FlaskIcon,
  mic: MicIcon,
  handshake: HandshakeIcon,
};

const RULES: Array<{ match: RegExp; icon: PickableIcon }> = [
  { match: /front|ui\b|web|react|css|html/i, icon: 'monitor' },
  // Before the backend rule: "State & API" is about data flow, not servers.
  { match: /state|store|data|sql|analytic|query/i, icon: 'chart' },
  { match: /back|server|node|api|graphql|rest/i, icon: 'database' },
  { match: /\bai\b|\bml\b|machine|llm|intelligen/i, icon: 'brain' },
  { match: /tool|build|devop|workflow|test/i, icon: 'wrench' },
  { match: /cloud|infra|deploy|aws|azure/i, icon: 'cloud' },
  { match: /design|figma|brand|visual/i, icon: 'palette' },
  { match: /lead|team|mentor|manage|people/i, icon: 'diamond' },
  { match: /secur|auth|privacy/i, icon: 'shield' },
  { match: /perform|speed|optimi/i, icon: 'bolt' },
  { match: /health|care|medic|well/i, icon: 'heart' },
  { match: /integrat|connect|plugin|partner/i, icon: 'plug' },
  // "Programming Languages" is code, not a globe.
  { match: /program|coding|code|software/i, icon: 'code' },
  { match: /language|communicat|writ|speak/i, icon: 'globe' },
  { match: /learn|study|cours|train|educat/i, icon: 'book' },
  { match: /launch|growth|scale|startup/i, icon: 'rocket' },
  { match: /mobile|android|ios|flutter/i, icon: 'smartphone' },
  { match: /agile|scrum|project manag|planning/i, icon: 'clipboard-check' },
  { match: /market|seo|campaign|advertis/i, icon: 'megaphone' },
  { match: /sales|business dev|commerce|revenue/i, icon: 'trending-up' },
  { match: /financ|account|budget|payroll/i, icon: 'banknote' },
  { match: /legal|law|compliance/i, icon: 'scale' },
  { match: /photo|camera/i, icon: 'camera' },
  { match: /video|film|animation/i, icon: 'video' },
  { match: /support|customer|service desk/i, icon: 'headset' },
  { match: /interpersonal|collaborat|teamwork/i, icon: 'users' },
  { match: /nurs|clinic|surgeon|patient/i, icon: 'stethoscope' },
  { match: /civil|construct|architect/i, icon: 'hard-hat' },
  { match: /research|laborator|science/i, icon: 'flask' },
  { match: /monitor|observab|logging|incident/i, icon: 'monitoring' },
  { match: /cache|redis|caching/i, icon: 'cache' },
  { match: /git|version control|github|gitlab/i, icon: 'git-branch' },
  { match: /document|technical writing|docs/i, icon: 'documentation' },
];

/**
 * The key `auto` resolves to, or null when nothing matches.
 *
 * Returns a key rather than a component so callers look the component up from
 * the constant map — a function that hands back a component reads to React's
 * lint rules as one created during render.
 */
export const guessIcon = (label: string): PickableIcon | null =>
  RULES.find((rule) => rule.match.test(label))?.icon ?? null;

export interface CategoryIconProps {
  /** The group or achievement title the icon should suit. */
  label: string;
  /** The user's choice. `auto` (the default) guesses from `label`. */
  icon?: ResumeIconKey;
  /** Drawn when `auto` finds no match. */
  fallback?: PickableIcon;
}

export const CategoryIcon = ({ label, icon = AUTO_ICON, fallback = 'star' }: CategoryIconProps) => {
  const key = icon === AUTO_ICON ? (guessIcon(label) ?? fallback) : icon;
  const Icon = ICON_COMPONENTS[key];

  return (
    <span className="rz-cat-icon" aria-hidden="true">
      <Icon />
    </span>
  );
};
