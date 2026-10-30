export type Gender = 'boy' | 'girl';
export type GameTheme = 'cyber_arcade' | 'magic_academy';

export interface Character {
  id: string;
  name: string;
  gender: Gender;
  title: string;
  bio: string;
  avatarUrl: string;
  hairColor: string;
  suitColor: string;
  visorColor: string;
  jetpackColor: string;
  flameColor: string;
  trailColor: string;
  broomstickColor?: string;
  flightType?: 'jetpack' | 'broomstick';
  customUploadedImage?: string;
}

export type MonsterTypeId = 'drone' | 'gargoyle' | 'glitch' | 'mine' | 'bludger' | 'dementor';

export interface MonsterConfig {
  id: MonsterTypeId;
  name: string;
  tagline: string;
  primaryColor: string;
  glowColor: string;
  secondaryColor: string;
  hazardColor: string;
  behavior: 'hover' | 'sine-wave' | 'pulse';
  hitboxRadius: number;
  dangerRating?: string;
  customImageDataUrl?: string;
}

export type CoinStyleId = 'token' | 'crystal' | 'diamond' | 'star' | 'custom';

export interface CoinConfig {
  id: CoinStyleId;
  name: string;
  description: string;
  primaryColor: string;
  glowColor: string;
  sparkleColor: string;
  customImageDataUrl?: string;
  pointValue: number;
}

export interface SkylineTheme {
  id: string;
  name: string;
  skyTop: string;
  skyBottom: string;
  backBuildings: string;
  frontBuildings: string;
  windowGlow: string;
  neonTrim: string;
  gridFloorColor: string;
}

export interface BrandingConfig {
  brandName: string;
  tagline: string;
  showBrandName?: boolean;
  showTagline?: boolean;
  logoUrl: string; // custom image or generated asset path
  neonColor: string;
  accentColor: string;
  billboardTextColor: string;
  buildingAccent: string;
  customLogoDataUrl?: string;
  callToActionUrl?: string;
  callToActionLabel: string;
}

export interface GameSettings {
  gravity: number; // default ~0.26 (gentle descent)
  thrust: number; // default ~0.55 (smooth continuous ascent while holding)
  maxFallSpeed: number; // default ~5.2 (terminal velocity)
  maxRiseSpeed: number; // default ~-6.0 (max climb speed)
  baseSpeed: number; // default ~3.4 (horizontal game speed)
  speedIncrementPerLevel: number; // default ~0.35
  monsterSpawnInterval: number; // horizontal distance between monster encounters ~320px
  soundEnabled: boolean;
  bgmEnabled: boolean;
  crtEffect: boolean;
  showHitboxes: boolean;
  gameDurationSeconds: number; // default 60 (countdown before time out)
  enableTimer: boolean; // default true
  addTimeOnCoin: boolean; // default true (add bonus time on coin collection)
  timeBonusSeconds: number; // default 2 (seconds added per coin collected)
  requireRegistration: boolean; // Pre-game login / attendee registration toggle
  activeEventId: string; // ID of active event to save registers to
  activeEventName: string; // Name of active event
  registrationTitle?: string; // Custom title for registration popup
  registrationSubtitle?: string; // Custom subtitle for registration popup
  instructionsTitle?: string; // Custom title for instructions popup
  instructionsSubtitle?: string; // Custom subtitle for instructions popup
  popupFooterText?: string; // Footer tag at bottom of popups (default "Presented by TIM")
  enablePrizes?: boolean; // Whether to award and display prizes on game over
  prizeTiers?: PrizeTier[]; // List of score thresholds and associated prizes
}

export interface PrizeTier {
  id: string;
  minScore: number;
  prizeName: string;
  description?: string;
  badgeColor?: string;
}

export interface AppConfig {
  theme: GameTheme;
  selectedCharacterId: string;
  characters: Character[];
  selectedMonsterId: MonsterTypeId;
  monsterConfigs: Record<MonsterTypeId, MonsterConfig>;
  selectedCoinStyleId: CoinStyleId;
  coinConfigs: Record<CoinStyleId, CoinConfig>;
  activeSkylineThemeId: string;
  customSkyline: SkylineTheme;
  branding: BrandingConfig;
  settings: GameSettings;
}

export interface ScoreEntry {
  id: string;
  playerName: string;
  characterName: string;
  score: number;
  coins: number;
  level: number;
  date: string;
}

export interface AttendeeRegistration {
  id: string;
  eventId: string;
  name: string;
  company: string;
  email: string;
  contactNumber: string;
  position: string;
  registeredAt: string;
  bestScore: number;
  coins: number;
  totalRuns: number;
  lastPlayedAt?: string;
}

export interface EventSession {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  isActive: boolean;
}
