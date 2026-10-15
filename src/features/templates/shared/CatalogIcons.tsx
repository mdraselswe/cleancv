import type { SVGProps } from 'react';

import type { PickableIcon } from '@/constants';

import { CATALOG_ICON_MARKUP } from './catalogIconMarkup';

/**
 * The glyphs added to the picker after the first set.
 *
 * Drawn from plain SVG markup (`scripts/build-icon-markup.mjs` writes it from
 * Lucide), not from Lucide's React components: those are client components, and
 * the PDF route renders a template to a string on the server, where calling one
 * throws. The export was down for exactly that reason once. See ADR-003 and
 * `tests/unit/serverSafeIcons.spec.ts`.
 *
 * Each carries `rz-icon`, which holds the stroke and the sizing, so these sit
 * beside the hand-drawn set at the same size and weight.
 */

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

const glyph = (key: string): IconComponent => {
  const Glyph: IconComponent = ({ className, ...props }) => (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...props}
      className={`rz-icon ${className ?? ''}`.trim()}
      dangerouslySetInnerHTML={{ __html: CATALOG_ICON_MARKUP[key] ?? '' }}
    />
  );

  return Glyph;
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
  code: glyph('code'),
  terminal: glyph('terminal'),
  cpu: glyph('cpu'),
  server: glyph('server'),
  bot: glyph('bot'),
  sparkles: glyph('sparkles'),
  smartphone: glyph('smartphone'),
  laptop: glyph('laptop'),
  'git-branch': glyph('git-branch'),
  bug: glyph('bug'),
  lock: glyph('lock'),
  key: glyph('key'),
  network: glyph('network'),
  layers: glyph('layers'),
  package: glyph('package'),
  blocks: glyph('blocks'),
  component: glyph('component'),
  webhook: glyph('webhook'),
  wifi: glyph('wifi'),
  'hard-drive': glyph('hard-drive'),
  braces: glyph('braces'),
  workflow: glyph('workflow'),
  container: glyph('container'),
  'bar-chart': glyph('bar-chart'),
  'line-chart': glyph('line-chart'),
  'trending-up': glyph('trending-up'),
  table: glyph('table'),
  calculator: glyph('calculator'),
  percent: glyph('percent'),
  gauge: glyph('gauge'),
  activity: glyph('activity'),
  search: glyph('search'),
  funnel: glyph('funnel'),
  building: glyph('building'),
  store: glyph('store'),
  banknote: glyph('banknote'),
  wallet: glyph('wallet'),
  'credit-card': glyph('credit-card'),
  scale: glyph('scale'),
  gavel: glyph('gavel'),
  landmark: glyph('landmark'),
  'clipboard-check': glyph('clipboard-check'),
  calendar: glyph('calendar'),
  clock: glyph('clock'),
  megaphone: glyph('megaphone'),
  presentation: glyph('presentation'),
  'file-text': glyph('file-text'),
  mail: glyph('mail'),
  phone: glyph('phone'),
  headset: glyph('headset'),
  'shopping-cart': glyph('shopping-cart'),
  truck: glyph('truck'),
  map: glyph('map'),
  'pen-tool': glyph('pen-tool'),
  brush: glyph('brush'),
  camera: glyph('camera'),
  video: glyph('video'),
  film: glyph('film'),
  music: glyph('music'),
  image: glyph('image'),
  type: glyph('type'),
  layout: glyph('layout'),
  ruler: glyph('ruler'),
  shapes: glyph('shapes'),
  newspaper: glyph('newspaper'),
  'pen-line': glyph('pen-line'),
  users: glyph('users'),
  'user-check': glyph('user-check'),
  'message-square': glyph('message-square'),
  'heart-handshake': glyph('heart-handshake'),
  'hand-heart': glyph('hand-heart'),
  languages: glyph('languages'),
  'book-open': glyph('book-open'),
  school: glyph('school'),
  library: glyph('library'),
  baby: glyph('baby'),
  dumbbell: glyph('dumbbell'),
  coffee: glyph('coffee'),
  utensils: glyph('utensils'),
  gamepad: glyph('gamepad'),
  stethoscope: glyph('stethoscope'),
  pill: glyph('pill'),
  syringe: glyph('syringe'),
  hospital: glyph('hospital'),
  microscope: glyph('microscope'),
  atom: glyph('atom'),
  dna: glyph('dna'),
  leaf: glyph('leaf'),
  sprout: glyph('sprout'),
  hammer: glyph('hammer'),
  'hard-hat': glyph('hard-hat'),
  cog: glyph('cog'),
  factory: glyph('factory'),
  zap: glyph('zap'),
  flame: glyph('flame'),
  droplets: glyph('droplets'),
  sun: glyph('sun'),
  plane: glyph('plane'),
  car: glyph('car'),
  ship: glyph('ship'),
  anchor: glyph('anchor'),
  house: glyph('house'),
  satellite: glyph('satellite'),
  radio: glyph('radio'),
  cable: glyph('cable'),
  shirt: glyph('shirt'),
  scissors: glyph('scissors'),
  trees: glyph('trees'),
  bike: glyph('bike'),
  share: glyph('share'),
  flag: glyph('flag'),
  compass: glyph('compass'),
  lightbulb: glyph('lightbulb'),
  puzzle: glyph('puzzle'),
  'badge-check': glyph('badge-check'),
  award: glyph('award'),
  medal: glyph('medal'),
  'app-window': glyph('app-window'),
  'code-xml': glyph('code-xml'),
  console: glyph('console'),
  'file-code': glyph('file-code'),
  'file-json': glyph('file-json'),
  'git-pull-request': glyph('git-pull-request'),
  'git-merge': glyph('git-merge'),
  'git-fork': glyph('git-fork'),
  repository: glyph('repository'),
  responsive: glyph('responsive'),
  tablet: glyph('tablet'),
  interaction: glyph('interaction'),
  'design-system': glyph('design-system'),
  template: glyph('template'),
  dashboard: glyph('dashboard'),
  link: glyph('link'),
  secure: glyph('secure'),
  fingerprint: glyph('fingerprint'),
  monitoring: glyph('monitoring'),
  observability: glyph('observability'),
  testing: glyph('testing'),
  debugging: glyph('debugging'),
  cache: glyph('cache'),
  backup: glyph('backup'),
  'server-config': glyph('server-config'),
  'cloud-ops': glyph('cloud-ops'),
  upload: glyph('upload'),
  download: glyph('download'),
  settings: glyph('settings'),
  tuning: glyph('tuning'),
  circuit: glyph('circuit'),
  microchip: glyph('microchip'),
  binary: glyph('binary'),
  brackets: glyph('brackets'),
  archive: glyph('archive'),
  send: glyph('send'),
  inbox: glyph('inbox'),
  repeat: glyph('repeat'),
  sync: glyph('sync'),
  timer: glyph('timer'),
  alerts: glyph('alerts'),
  'machine-learning': glyph('machine-learning'),
  chatbot: glyph('chatbot'),
  'generative-ai': glyph('generative-ai'),
  memory: glyph('memory'),
  router: glyph('router'),
  'data-flow': glyph('data-flow'),
  api: glyph('api'),
  routing: glyph('routing'),
  branching: glyph('branching'),
  modules: glyph('modules'),
  regex: glyph('regex'),
  algorithms: glyph('algorithms'),
  'ci-cd': glyph('ci-cd'),
  keyboard: glyph('keyboard'),
  'qr-code': glyph('qr-code'),
  bluetooth: glyph('bluetooth'),
  command: glyph('command'),
  hash: glyph('hash'),
  documentation: glyph('documentation'),
  streaming: glyph('streaming'),
  kanban: glyph('kanban'),
  gantt: glyph('gantt'),
  dependencies: glyph('dependencies'),
  tasks: glyph('tasks'),
  goal: glyph('goal'),
  invoice: glyph('invoice'),
  'team-lead': glyph('team-lead'),
  management: glyph('management'),
  meetings: glyph('meetings'),
  'id-card': glyph('id-card'),
  headphones: glyph('headphones'),
  podcast: glyph('podcast'),
  coins: glyph('coins'),
  savings: glyph('savings'),
  business: glyph('business'),
  warehouse: glyph('warehouse'),
  approval: glyph('approval'),
  voting: glyph('voting'),
  cardiology: glyph('cardiology'),
  orthopedic: glyph('orthopedic'),
  temperature: glyph('temperature'),
  emergency: glyph('emergency'),
  exploration: glyph('exploration'),
  orbit: glyph('orbit'),
  tractor: glyph('tractor'),
  crops: glyph('crops'),
};
