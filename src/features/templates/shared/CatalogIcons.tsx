import {
  Activity,
  Anchor,
  Atom,
  Award,
  Baby,
  BadgeCheck,
  Banknote,
  Bike,
  Blocks,
  Bot,
  BookOpen,
  Braces,
  Brush,
  Bug,
  Building2,
  Cable,
  Calculator,
  Calendar,
  Camera,
  Car,
  ChartColumn,
  ChartLine,
  ClipboardCheck,
  Clock,
  Code,
  Coffee,
  Cog,
  Compass,
  Component,
  Container,
  Cpu,
  CreditCard,
  Dna,
  Droplets,
  Dumbbell,
  Factory,
  FileText,
  Film,
  Flag,
  Flame,
  Funnel,
  Gamepad2,
  Gauge,
  Gavel,
  GitBranch,
  HandHeart,
  Hammer,
  HardDrive,
  HardHat,
  Headset,
  HeartHandshake,
  Hospital,
  House,
  Image as ImageGlyph,
  KeyRound,
  Landmark,
  Languages,
  Laptop,
  Layers,
  LayoutDashboard,
  Leaf,
  Library,
  Lightbulb,
  Lock,
  Mail,
  Map as MapGlyph,
  Medal,
  Megaphone,
  MessageSquare,
  Microscope,
  Music,
  Network,
  Newspaper,
  Package,
  PenLine,
  PenTool,
  Percent,
  Phone,
  Pill,
  Plane,
  Presentation,
  Puzzle,
  Radio,
  Ruler,
  Satellite,
  Scale,
  School,
  Scissors,
  Search,
  Server,
  Shapes,
  Share2,
  Ship,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Sprout,
  Stethoscope,
  Store,
  Sun,
  Syringe,
  Table,
  Terminal,
  TrendingUp,
  Trees,
  Truck,
  Type as TypeGlyph,
  UserCheck,
  Users,
  Utensils,
  Video,
  Wallet,
  Webhook,
  Wifi,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { SVGProps } from 'react';

import type { PickableIcon } from '@/constants';

/**
 * The glyphs added to the picker after the first set.
 *
 * Lucide's are inline SVG paths, like the hand-drawn ones beside them, so they
 * contribute nothing to the PDF's text layer. Each is wrapped to carry `rz-icon`,
 * which holds the stroke and the sizing - a bare Lucide component would be drawn
 * at its own default size and weight and sit differently from its neighbours.
 */

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

const wrap = (Glyph: LucideIcon): IconComponent => {
  const Wrapped: IconComponent = ({ className, ...props }) => (
    <Glyph
      {...props}
      aria-hidden="true"
      focusable="false"
      className={`rz-icon ${className ?? ''}`.trim()}
    />
  );

  return Wrapped;
};

type ExtraKey = Exclude<
  PickableIcon,
  | 'monitor'
  | 'database'
  | 'chart'
  | 'brain'
  | 'wrench'
  | 'cloud'
  | 'palette'
  | 'diamond'
  | 'shield'
  | 'bolt'
  | 'trophy'
  | 'crown'
  | 'heart'
  | 'plug'
  | 'person'
  | 'star'
  | 'target'
  | 'rocket'
  | 'book'
  | 'globe'
  | 'briefcase'
  | 'graduation'
  | 'certificate'
  | 'flask'
  | 'mic'
  | 'handshake'
>;

export const EXTRA_ICON_COMPONENTS: Record<ExtraKey, IconComponent> = {
  code: wrap(Code),
  terminal: wrap(Terminal),
  cpu: wrap(Cpu),
  server: wrap(Server),
  bot: wrap(Bot),
  sparkles: wrap(Sparkles),
  smartphone: wrap(Smartphone),
  laptop: wrap(Laptop),
  'git-branch': wrap(GitBranch),
  bug: wrap(Bug),
  lock: wrap(Lock),
  key: wrap(KeyRound),
  network: wrap(Network),
  layers: wrap(Layers),
  package: wrap(Package),
  blocks: wrap(Blocks),
  component: wrap(Component),
  webhook: wrap(Webhook),
  wifi: wrap(Wifi),
  'hard-drive': wrap(HardDrive),
  braces: wrap(Braces),
  workflow: wrap(Workflow),
  container: wrap(Container),
  'bar-chart': wrap(ChartColumn),
  'line-chart': wrap(ChartLine),
  'trending-up': wrap(TrendingUp),
  table: wrap(Table),
  calculator: wrap(Calculator),
  percent: wrap(Percent),
  gauge: wrap(Gauge),
  activity: wrap(Activity),
  search: wrap(Search),
  funnel: wrap(Funnel),
  building: wrap(Building2),
  store: wrap(Store),
  banknote: wrap(Banknote),
  wallet: wrap(Wallet),
  'credit-card': wrap(CreditCard),
  scale: wrap(Scale),
  gavel: wrap(Gavel),
  landmark: wrap(Landmark),
  'clipboard-check': wrap(ClipboardCheck),
  calendar: wrap(Calendar),
  clock: wrap(Clock),
  megaphone: wrap(Megaphone),
  presentation: wrap(Presentation),
  'file-text': wrap(FileText),
  mail: wrap(Mail),
  phone: wrap(Phone),
  headset: wrap(Headset),
  'shopping-cart': wrap(ShoppingCart),
  truck: wrap(Truck),
  map: wrap(MapGlyph),
  'pen-tool': wrap(PenTool),
  brush: wrap(Brush),
  camera: wrap(Camera),
  video: wrap(Video),
  film: wrap(Film),
  music: wrap(Music),
  image: wrap(ImageGlyph),
  type: wrap(TypeGlyph),
  layout: wrap(LayoutDashboard),
  ruler: wrap(Ruler),
  shapes: wrap(Shapes),
  newspaper: wrap(Newspaper),
  'pen-line': wrap(PenLine),
  users: wrap(Users),
  'user-check': wrap(UserCheck),
  'message-square': wrap(MessageSquare),
  'heart-handshake': wrap(HeartHandshake),
  'hand-heart': wrap(HandHeart),
  languages: wrap(Languages),
  'book-open': wrap(BookOpen),
  school: wrap(School),
  library: wrap(Library),
  baby: wrap(Baby),
  dumbbell: wrap(Dumbbell),
  coffee: wrap(Coffee),
  utensils: wrap(Utensils),
  gamepad: wrap(Gamepad2),
  stethoscope: wrap(Stethoscope),
  pill: wrap(Pill),
  syringe: wrap(Syringe),
  hospital: wrap(Hospital),
  microscope: wrap(Microscope),
  atom: wrap(Atom),
  dna: wrap(Dna),
  leaf: wrap(Leaf),
  sprout: wrap(Sprout),
  hammer: wrap(Hammer),
  'hard-hat': wrap(HardHat),
  cog: wrap(Cog),
  factory: wrap(Factory),
  zap: wrap(Zap),
  flame: wrap(Flame),
  droplets: wrap(Droplets),
  sun: wrap(Sun),
  plane: wrap(Plane),
  car: wrap(Car),
  ship: wrap(Ship),
  anchor: wrap(Anchor),
  house: wrap(House),
  satellite: wrap(Satellite),
  radio: wrap(Radio),
  cable: wrap(Cable),
  shirt: wrap(Shirt),
  scissors: wrap(Scissors),
  trees: wrap(Trees),
  bike: wrap(Bike),
  share: wrap(Share2),
  flag: wrap(Flag),
  compass: wrap(Compass),
  lightbulb: wrap(Lightbulb),
  puzzle: wrap(Puzzle),
  'badge-check': wrap(BadgeCheck),
  award: wrap(Award),
  medal: wrap(Medal),
};
