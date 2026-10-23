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
