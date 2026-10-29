import { AppConfig, Character, MonsterConfig, CoinConfig, SkylineTheme, GameTheme } from '../types/game';

// Generated asset paths
export const DEFAULT_BRAND_LOGO = '/assets/aistudio/TIM_LOGO_low_quality_d0071df0.png';
export const DEFAULT_SKYLINE_BG = '/src/assets/images/neon_city_skyline_1792721444005.jpg';
export const DEFAULT_BOY_AVATAR = '/src/assets/images/hero_boy_cyber_1792721445269.jpg';
export const DEFAULT_GIRL_AVATAR = '/src/assets/images/hero_girl_cyber_1792721445700.jpg';

// Magic Theme Assets
export const MAGIC_CASTLE_BG = '/src/assets/images/magic_castle_corridor_1792723808548.jpg';
export const WIZARD_BOY_IMG = '/src/assets/images/wizard_boy_broom_1792723808258.jpg';
export const WITCH_GIRL_IMG = '/src/assets/images/witch_girl_broom_1792723808601.jpg';
export const GOLDEN_SNITCH_IMG = '/src/assets/images/magic_golden_snitch_1792723809699.jpg';

// =====================================================================
// CYBERPUNK ARCADE CHARACTERS (3 BOYS, 3 GIRLS)
// =====================================================================
export const CYBER_CHARACTERS: Character[] = [
  // 3 Boys
  {
    id: 'cyber_boy_kai',
    name: 'Kai',
    gender: 'boy',
    title: 'Neon Aviator',
    bio: 'Dual cyan cyber goggles with high-altitude pulse turbine wings.',
    avatarUrl: DEFAULT_BOY_AVATAR,
    hairColor: '#00e5ff',
    suitColor: '#1e293b',
    visorColor: '#00f0ff',
    jetpackColor: '#ff9900',
    flameColor: '#00f0ff',
    trailColor: 'rgba(0, 240, 255, 0.7)',
    flightType: 'jetpack',
  },
  {
    id: 'cyber_boy_leo',
    name: 'Leo',
    gender: 'boy',
    title: 'Gold Thruster',
    bio: 'Heavy booster specialist sporting amber visors and gold turbines.',
    avatarUrl: DEFAULT_BOY_AVATAR,
    hairColor: '#f59e0b',
    suitColor: '#262626',
    visorColor: '#fbbf24',
    jetpackColor: '#eab308',
    flameColor: '#f97316',
    trailColor: 'rgba(245, 158, 11, 0.7)',
    flightType: 'jetpack',
  },
  {
    id: 'cyber_boy_ren',
    name: 'Ren',
    gender: 'boy',
    title: 'Shadow Ronin',
    bio: 'Stealth glider pilot with ultraviolet ion trails and night cowl.',
    avatarUrl: DEFAULT_BOY_AVATAR,
    hairColor: '#a855f7',
    suitColor: '#171717',
    visorColor: '#c084fc',
    jetpackColor: '#8b5cf6',
    flameColor: '#d946ef',
    trailColor: 'rgba(168, 85, 247, 0.7)',
    flightType: 'jetpack',
  },
  // 3 Girls
  {
    id: 'cyber_girl_aria',
    name: 'Aria',
    gender: 'girl',
    title: 'Neon Valkyrie',
    bio: 'Pink bang pilot equipped with digital HUD visor and impulse jump thrusters.',
    avatarUrl: DEFAULT_GIRL_AVATAR,
    hairColor: '#f43f5e',
    suitColor: '#0f172a',
    visorColor: '#38bdf8',
    jetpackColor: '#ec4899',
    flameColor: '#f43f5e',
    trailColor: 'rgba(244, 63, 94, 0.7)',
    flightType: 'jetpack',
  },
  {
    id: 'cyber_girl_maya',
    name: 'Maya',
    gender: 'girl',
    title: 'Matrix Glider',
    bio: 'Hacker prodigy piloting an overclocked magnetic hover glider.',
    avatarUrl: DEFAULT_GIRL_AVATAR,
    hairColor: '#10b981',
    suitColor: '#131920',
    visorColor: '#34d399',
    jetpackColor: '#059669',
    flameColor: '#10b981',
    trailColor: 'rgba(16, 185, 129, 0.7)',
    flightType: 'jetpack',
  },
  {
    id: 'cyber_girl_nova',
    name: 'Nova',
    gender: 'girl',
    title: 'Solar Flare',
    bio: 'High-speed speedster running on glowing plasma rocket injectors.',
    avatarUrl: DEFAULT_GIRL_AVATAR,
    hairColor: '#f97316',
    suitColor: '#1c1917',
    visorColor: '#fb923c',
    jetpackColor: '#dc2626',
    flameColor: '#fbbf24',
    trailColor: 'rgba(249, 115, 22, 0.7)',
    flightType: 'jetpack',
  },
];

// =====================================================================
// HARRY POTTER / MAGIC ACADEMY BROOMSTICK CHARACTERS (3 BOYS, 3 GIRLS)
// =====================================================================
export const WIZARD_CHARACTERS: Character[] = [
  // 3 Wizard Boys
  {
    id: 'wizard_boy_julian',
    name: 'Julian',
    gender: 'boy',
    title: 'Gryffindor Seeker',
    bio: 'Wears scarlet & gold scarf with round spectacles, riding a Nimbus broomstick.',
    avatarUrl: WIZARD_BOY_IMG,
    hairColor: '#27272a',
    suitColor: '#1e1b4b',
    visorColor: '#fbbf24',
    jetpackColor: '#78350f',
    flameColor: '#f59e0b',
    trailColor: 'rgba(251, 191, 36, 0.8)',
    broomstickColor: '#92400e',
    flightType: 'broomstick',
  },
  {
    id: 'wizard_boy_orion',
    name: 'Orion',
    gender: 'boy',
    title: 'Ravenclaw Chaser',
    bio: 'Midnight sapphire robes with bronze eagle clasp, riding a polished Comet broom.',
    avatarUrl: WIZARD_BOY_IMG,
    hairColor: '#3f3f46',
    suitColor: '#0f172a',
    visorColor: '#38bdf8',
    jetpackColor: '#451a03',
    flameColor: '#38bdf8',
    trailColor: 'rgba(56, 189, 248, 0.8)',
    broomstickColor: '#713f12',
    flightType: 'broomstick',
  },
  {
    id: 'wizard_boy_rowan',
    name: 'Rowan',
    gender: 'boy',
    title: 'Slytherin Beater',
    bio: 'Dark emerald scholar robes with silver trim and willow wand, riding an aerodynamic shadow broom.',
    avatarUrl: WIZARD_BOY_IMG,
    hairColor: '#18181b',
    suitColor: '#022c22',
    visorColor: '#34d399',
    jetpackColor: '#2e1065',
    flameColor: '#10b981',
    trailColor: 'rgba(16, 185, 129, 0.8)',
    broomstickColor: '#3f1f0a',
    flightType: 'broomstick',
  },
  // 3 Witch Girls
  {
    id: 'witch_girl_lyra',
    name: 'Lyra',
    gender: 'girl',
    title: 'Gryffindor Chaser',
    bio: 'Flowing amber curls and scarlet robes, flying a nimble silver birch broomstick.',
    avatarUrl: WITCH_GIRL_IMG,
    hairColor: '#f59e0b',
    suitColor: '#1e1b4b',
    visorColor: '#fef08a',
    jetpackColor: '#854d0e',
    flameColor: '#facc15',
    trailColor: 'rgba(250, 204, 21, 0.8)',
    broomstickColor: '#b45309',
    flightType: 'broomstick',
  },
  {
    id: 'witch_girl_seraphina',
    name: 'Seraphina',
    gender: 'girl',
    title: 'Ravenclaw Prefect',
    bio: 'Sapphire embroidered robes with enchanted crystal wand and swift Nimbus broom.',
    avatarUrl: WITCH_GIRL_IMG,
    hairColor: '#c084fc',
    suitColor: '#311042',
    visorColor: '#e879f9',
    jetpackColor: '#581c87',
    flameColor: '#d946ef',
    trailColor: 'rgba(217, 70, 239, 0.8)',
    broomstickColor: '#5c2b0c',
    flightType: 'broomstick',
  },
  {
    id: 'witch_girl_faye',
    name: 'Faye',
    gender: 'girl',
    title: 'Hufflepuff Keeper',
    bio: 'Braided hair with canary gold scarf, flying a steady oak wood broomstick.',
    avatarUrl: WITCH_GIRL_IMG,
    hairColor: '#d97706',
    suitColor: '#292524',
    visorColor: '#fde047',
    jetpackColor: '#713f12',
    flameColor: '#eab308',
    trailColor: 'rgba(234, 179, 8, 0.8)',
    broomstickColor: '#854d0e',
    flightType: 'broomstick',
  },
];

export const INITIAL_CHARACTERS: Character[] = CYBER_CHARACTERS;

export const MONSTER_CONFIGS: Record<string, MonsterConfig> = {
  drone: {
    id: 'drone',
    name: 'Neon Sentinel Drone',
    tagline: 'Hovering surveillance drone with rotating blade shields and targeting laser.',
    primaryColor: '#ef4444',
    glowColor: '#f87171',
    secondaryColor: '#1e1e2f',
    hazardColor: '#ff0055',
    behavior: 'hover',
    hitboxRadius: 24,
  },
  gargoyle: {
    id: 'gargoyle',
    name: 'Cyber Gargoyle',
    tagline: 'Mechanical winged cyber beast with sweeping neon arcs.',
    primaryColor: '#a855f7',
    glowColor: '#c084fc',
    secondaryColor: '#2e1065',
    hazardColor: '#e879f9',
    behavior: 'sine-wave',
    hitboxRadius: 26,
  },
  bludger: {
    id: 'bludger',
    name: 'Cursed Iron Bludger',
    tagline: 'Heavy enchanted iron sphere flying aggressively with crimson cursed runes.',
    primaryColor: '#dc2626',
    glowColor: '#ef4444',
    secondaryColor: '#1f2937',
    hazardColor: '#f87171',
    behavior: 'sine-wave',
    hitboxRadius: 22,
  },
  dementor: {
    id: 'dementor',
    name: 'Dementor Phantom',
    tagline: 'Gliding hooded wraith emanating a chilling aura of dark frost.',
    primaryColor: '#64748b',
    glowColor: '#94a3b8',
    secondaryColor: '#090d16',
    hazardColor: '#38bdf8',
    behavior: 'pulse',
    hitboxRadius: 25,
  },
  glitch: {
    id: 'glitch',
    name: 'Glitch Spectre',
    tagline: 'Distorted holographic entity that pulses with pixel anomalies.',
    primaryColor: '#06b6d4',
    glowColor: '#22d3ee',
    secondaryColor: '#083344',
    hazardColor: '#67e8f9',
    behavior: 'pulse',
    hitboxRadius: 25,
  },
  mine: {
    id: 'mine',
    name: 'Plasma Arc Mine',
    tagline: 'Magnetic spiked core emitting dangerous electrical discharges.',
    primaryColor: '#f59e0b',
    glowColor: '#fbbf24',
    secondaryColor: '#451a03',
    hazardColor: '#facc15',
    behavior: 'pulse',
    hitboxRadius: 22,
  },
};

export const COIN_CONFIGS: Record<string, CoinConfig> = {
  token: {
    id: 'token',
    name: 'Golden Arcade Token',
    description: 'Classic milled brass arcade token with glowing star imprint.',
    primaryColor: '#fbbf24',
    glowColor: '#f59e0b',
    sparkleColor: '#fef08a',
    pointValue: 10,
  },
  snitch: {
    id: 'star',
    name: 'Golden Snitch',
    description: 'Fluttering enchanted winged golden orb with shimmering stardust.',
    primaryColor: '#f59e0b',
    glowColor: '#fbbf24',
    sparkleColor: '#ffffff',
    customImageDataUrl: GOLDEN_SNITCH_IMG,
    pointValue: 25,
  },
  crystal: {
    id: 'crystal',
    name: 'Neon Cyber Bit',
    description: 'Hexagonal holographic data crystal with radiant cyan energy.',
    primaryColor: '#00f0ff',
    glowColor: '#38bdf8',
    sparkleColor: '#e0f2fe',
    pointValue: 15,
  },
  diamond: {
    id: 'diamond',
    name: 'Prism Gem',
    description: 'Facet-cut arcade jewel with magenta luminescence.',
    primaryColor: '#ec4899',
    glowColor: '#f43f5e',
    sparkleColor: '#fce7f3',
    pointValue: 20,
  },
  star: {
    id: 'star',
    name: 'Retro Power Star',
    description: '8-bit spinning gold star with flashing light points.',
    primaryColor: '#facc15',
    glowColor: '#eab308',
    sparkleColor: '#ffffff',
    pointValue: 25,
  },
  custom: {
    id: 'custom',
    name: 'Custom Image Coin',
    description: 'Your uploaded token or logo graphic floating inside the game.',
    primaryColor: '#8b5cf6',
    glowColor: '#a78bfa',
    sparkleColor: '#ede9fe',
    pointValue: 30,
  },
};

export const SKYLINE_THEMES: Record<string, SkylineTheme> = {
  cyber_night: {
    id: 'cyber_night',
    name: 'Synthwave Midnight',
    skyTop: '#060714',
    skyBottom: '#180e29',
    backBuildings: '#13112c',
    frontBuildings: '#090a18',
    windowGlow: '#00f0ff',
    neonTrim: '#ff007f',
    gridFloorColor: '#ff007f',
  },
  hogwarts_castle: {
    id: 'hogwarts_castle',
    name: 'Gothic Castle Corridor',
    skyTop: '#040714',
    skyBottom: '#111728',
    backBuildings: '#1e2638',
    frontBuildings: '#141a28',
    windowGlow: '#f59e0b',
    neonTrim: '#d97706',
    gridFloorColor: '#f59e0b',
  },
  neon_matrix: {
    id: 'neon_matrix',
    name: 'Matrix Cyberpunk',
    skyTop: '#030d09',
    skyBottom: '#062016',
    backBuildings: '#09251a',
    frontBuildings: '#04120c',
    windowGlow: '#00ff88',
    neonTrim: '#10b981',
    gridFloorColor: '#00ff88',
  },
  tokyo_sunset: {
    id: 'tokyo_sunset',
    name: 'Tokyo Sunset',
    skyTop: '#160824',
    skyBottom: '#3b1238',
    backBuildings: '#260d2b',
    frontBuildings: '#110517',
    windowGlow: '#f59e0b',
    neonTrim: '#f43f5e',
    gridFloorColor: '#f59e0b',
  },
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  theme: 'cyber_arcade',
  selectedCharacterId: 'cyber_boy_kai',
  characters: CYBER_CHARACTERS,
  selectedMonsterId: 'drone',
  monsterConfigs: MONSTER_CONFIGS,
  selectedCoinStyleId: 'token',
  coinConfigs: COIN_CONFIGS,
  activeSkylineThemeId: 'cyber_night',
  customSkyline: SKYLINE_THEMES.cyber_night,
  branding: {
    brandName: 'TIM',
    tagline: 'INNOVATION & TECHNOLOGY',
    showBrandName: true,
    showTagline: true,
    logoUrl: DEFAULT_BRAND_LOGO,
    neonColor: '#00f0ff',
    accentColor: '#ff007f',
    billboardTextColor: '#ffffff',
    buildingAccent: '#00f0ff',
    callToActionUrl: 'https://yourbrand.data-booster.com/',
    callToActionLabel: 'Learn More',
  },
  settings: {
    gravity: 0.26,
    thrust: 0.54,
    maxFallSpeed: 5.2,
    maxRiseSpeed: -5.8,
    baseSpeed: 3.4,
    speedIncrementPerLevel: 0.35,
    monsterSpawnInterval: 320,
    soundEnabled: true,
    bgmEnabled: false,
    crtEffect: true,
    showHitboxes: false,
    gameDurationSeconds: 60,
    enableTimer: true,
    addTimeOnCoin: true,
    timeBonusSeconds: 2,
  },
};

const STORAGE_KEY = 'neon_glide_config_v7';
const PREV_STORAGE_KEY = 'neon_glide_config_v6';
const SCORES_KEY = 'neon_glide_highscores_v6';

export function loadAppConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(PREV_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_CONFIG;
    const parsed = JSON.parse(raw);
    const theme: GameTheme = parsed.theme || 'cyber_arcade';
    const fallbackChars = theme === 'magic_academy' ? WIZARD_CHARACTERS : CYBER_CHARACTERS;

    // Migrate previous placeholder/cyber logo to TIM default logo across all themes
    const savedLogo = parsed.branding?.logoUrl;
    const isOldLogo =
      !savedLogo ||
      savedLogo.includes('brand_cyber_logo') ||
      savedLogo.includes('1792721443107');

    const effectiveLogo = isOldLogo ? DEFAULT_BRAND_LOGO : savedLogo;

    // Merge monster configs with custom images preserved
    const mergedMonsters: Record<string, MonsterConfig> = { ...MONSTER_CONFIGS };
    if (parsed.monsterConfigs) {
      Object.keys(parsed.monsterConfigs).forEach((mKey) => {
        if (mergedMonsters[mKey]) {
          mergedMonsters[mKey] = {
            ...mergedMonsters[mKey],
            ...parsed.monsterConfigs[mKey],
          };
        }
      });
    }

    return {
      ...DEFAULT_APP_CONFIG,
      ...parsed,
      theme,
      branding: {
        ...DEFAULT_APP_CONFIG.branding,
        ...(parsed.branding || {}),
        logoUrl: effectiveLogo,
        showBrandName: parsed.branding?.showBrandName !== undefined ? parsed.branding.showBrandName : true,
        showTagline: parsed.branding?.showTagline !== undefined ? parsed.branding.showTagline : true,
      },
      settings: {
        ...DEFAULT_APP_CONFIG.settings,
        ...(parsed.settings || {}),
        gameDurationSeconds: parsed.settings?.gameDurationSeconds ?? 60,
        enableTimer: parsed.settings?.enableTimer ?? true,
        addTimeOnCoin: parsed.settings?.addTimeOnCoin ?? true,
        timeBonusSeconds: parsed.settings?.timeBonusSeconds ?? 2,
      },
      customSkyline: { ...DEFAULT_APP_CONFIG.customSkyline, ...(parsed.customSkyline || {}) },
      characters: parsed.characters && parsed.characters.length === 6 ? parsed.characters : fallbackChars,
      monsterConfigs: mergedMonsters as any,
      coinConfigs: { ...COIN_CONFIGS, ...(parsed.coinConfigs || {}) },
    };
  } catch {
    return DEFAULT_APP_CONFIG;
  }
}

export function saveAppConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save config to localStorage', err);
  }
}
