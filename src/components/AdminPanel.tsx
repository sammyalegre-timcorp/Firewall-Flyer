import React, { useState } from 'react';
import { AppConfig, Character, CoinStyleId, MonsterTypeId, SkylineTheme, GameTheme } from '../types/game';
import { 
  SKYLINE_THEMES, 
  MONSTER_CONFIGS, 
  COIN_CONFIGS, 
  DEFAULT_APP_CONFIG,
  CYBER_CHARACTERS,
  WIZARD_CHARACTERS
} from '../utils/defaultConfig';
import { 
  Building2, 
  Image as ImageIcon, 
  Users, 
  Skull, 
  Coins, 
  Sliders, 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  Upload, 
  Check, 
  Sparkles,
  Wand2,
  Gamepad2
} from 'lucide-react';

interface AdminPanelProps {
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, onSaveConfig, onClose }) => {
  const [formData, setFormData] = useState<AppConfig>(JSON.parse(JSON.stringify(config)));
  const [activeTab, setActiveTab] = useState<'themes' | 'branding' | 'skyline' | 'characters' | 'monsters' | 'coins' | 'physics'>('themes');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [characterGenderFilter, setCharacterGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');

  const isMagic = formData.theme === 'magic_academy';

  const handleSave = () => {
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all game customizations and branding back to default values?')) {
      setFormData(JSON.parse(JSON.stringify(DEFAULT_APP_CONFIG)));
      onSaveConfig(DEFAULT_APP_CONFIG);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Switch Theme (Cyberpunk Arcade vs Harry Potter / Magic Academy)
  const handleSelectTheme = (newTheme: GameTheme) => {
    if (newTheme === 'magic_academy') {
      setFormData((prev) => ({
        ...prev,
        theme: 'magic_academy',
        characters: WIZARD_CHARACTERS,
        selectedCharacterId: 'wizard_boy_julian',
        activeSkylineThemeId: 'hogwarts_castle',
        customSkyline: SKYLINE_THEMES.hogwarts_castle,
        selectedMonsterId: 'bludger',
        selectedCoinStyleId: 'star', // snitch
        branding: {
          ...prev.branding,
          brandName: prev.branding.brandName === 'CYBERNETIX' ? 'MAGIC ACADEMY' : prev.branding.brandName,
          tagline: prev.branding.tagline === 'FUTURE TECH LABS' ? 'HOUSE OF WONDERS' : prev.branding.tagline,
          neonColor: '#f59e0b', // Golden torch glow
          accentColor: '#fbbf24',
          billboardTextColor: '#fef08a',
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        theme: 'cyber_arcade',
        characters: CYBER_CHARACTERS,
        selectedCharacterId: 'cyber_boy_kai',
        activeSkylineThemeId: 'cyber_night',
        customSkyline: SKYLINE_THEMES.cyber_night,
        selectedMonsterId: 'drone',
        selectedCoinStyleId: 'token',
        branding: {
          ...prev.branding,
          brandName: prev.branding.brandName === 'MAGIC ACADEMY' ? 'CYBERNETIX' : prev.branding.brandName,
          tagline: prev.branding.tagline === 'HOUSE OF WONDERS' ? 'FUTURE TECH LABS' : prev.branding.tagline,
          neonColor: '#00f0ff',
          accentColor: '#ff007f',
          billboardTextColor: '#ffffff',
        },
      }));
    }
  };

  // Upload helpers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          customLogoDataUrl: dataUrl,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCoinImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        selectedCoinStyleId: 'custom',
        coinConfigs: {
          ...prev.coinConfigs,
          custom: {
            ...prev.coinConfigs.custom,
            customImageDataUrl: dataUrl,
          },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCharacterImageUpload = (charId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        characters: prev.characters.map((c) =>
          c.id === charId ? { ...c, customUploadedImage: dataUrl } : c
        ),
      }));
    };
    reader.readAsDataURL(file);
  };

  const filteredCharacters = formData.characters.filter((c) => {
    if (characterGenderFilter === 'boy') return c.gender === 'boy';
    if (characterGenderFilter === 'girl') return c.gender === 'girl';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070914] text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0d1024]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Game</span>
          </button>
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Admin Configuration Center
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Game World & Branding Manager</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                isMagic ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
              }`}>
                {isMagic ? '🪄 Magic Academy' : '⚡ Cyber Arcade'}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>Saved & Applied!</span>
            </span>
          )}
          <button
            onClick={handleResetDefaults}
            className="text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset all settings to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="text-xs font-bold px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md hover:shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-6 pt-6 flex-1 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <nav className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('themes')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wand2 className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Game Theme (Cyber / Magic)</span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'characters'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 text-pink-400" />
            <span>Characters (3 Boys, 3 Girls)</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Logo & Frame / Billboard</span>
          </button>

          <button
            onClick={() => setActiveTab('skyline')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'skyline'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>{isMagic ? 'Castle Corridor & Torches' : 'Buildings & Skyline'}</span>
          </button>

          <button
            onClick={() => setActiveTab('monsters')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'monsters'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Skull className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Monsters & Hazards</span>
          </button>

          <button
            onClick={() => setActiveTab('coins')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'coins'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Coins & Custom Image</span>
          </button>

          <button
            onClick={() => setActiveTab('physics')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'physics'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Physics & Flight Speed</span>
          </button>
        </nav>

        {/* Tab Content Panel */}
        <section className="flex-1 min-w-0 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
          {/* 1. THEMES & UNIVERSE SELECTOR */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Select Game Universe & Theme</h2>
                <p className="text-xs text-slate-400">
                  Switch between the futuristic Cyber Arcade and the Harry Potter-inspired Magic Academy theme with flying broomsticks!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Theme 1: Retro Cyberpunk Arcade */}
                <div
                  onClick={() => handleSelectTheme('cyber_arcade')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.theme === 'cyber_arcade'
                      ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-400/80 shadow-xl'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-base font-extrabold text-white">Retro Cyber Arcade</h3>
                      </div>
                      {formData.theme === 'cyber_arcade' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500 text-slate-950 uppercase">
                          Active Theme
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mb-4">
                      Fly futuristic jetpacks through a neon cityscape at night. Weave past surveillance drones and showcase your logo on a towering skyscraper billboard.
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div>• <strong>Vehicle:</strong> Dual Pulse Jetpacks with flame exhausts</div>
                      <div>• <strong>Environment:</strong> Night skyline with neon glow</div>
                      <div>• <strong>Logo Display:</strong> Giant Skyscraper Illuminated Billboard</div>
                      <div>• <strong>Collectibles:</strong> Golden Arcade Tokens & Cyber Bits</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectTheme('cyber_arcade')}
                    className={`mt-5 w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                      formData.theme === 'cyber_arcade'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {formData.theme === 'cyber_arcade' ? '✓ Currently Selected' : 'Switch to Cyber Arcade'}
                  </button>
                </div>

                {/* Theme 2: Harry Potter / Magic Academy */}
                <div
                  onClick={() => handleSelectTheme('magic_academy')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.theme === 'magic_academy'
                      ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/80 shadow-xl'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base font-extrabold text-white">Magic Academy (Harry Potter)</h3>
                      </div>
                      {formData.theme === 'magic_academy' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 uppercase">
                          Active Theme
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mb-4">
                      Fly magical wooden broomsticks through an ancient Gothic castle corridor with floating candles. Showcase your logo in an ornate carved golden portrait frame!
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div>• <strong>Vehicle:</strong> Enchanted Wooden Broomsticks with stardust trails</div>
                      <div>• <strong>Environment:</strong> Castle wall with Slytherin, Hufflepuff, Ravenclaw & Gryffindor crests</div>
                      <div>• <strong>Logo Display:</strong> Ornate Golden Gilded Picture Frame</div>
                      <div>• <strong>Collectibles:</strong> Flying Golden Snitches with silver wings</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectTheme('magic_academy')}
                    className={`mt-5 w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                      formData.theme === 'magic_academy'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {formData.theme === 'magic_academy' ? '✓ Currently Selected' : 'Switch to Magic Academy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. CHARACTERS: 3 BOYS, 3 GIRLS (SHOWS EXACTLY HOW THEY LOOK) */}
          {activeTab === 'characters' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Characters Design (3 Boys, 3 Girls)
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isMagic 
                      ? '6 young witches and wizards on flying broomsticks. Customize appearance, robes, and broom colors.'
                      : '6 cybernetic aviators with high-tech jetpacks. Customize flight suits, visors, and thrusters.'}
                  </p>
                </div>

                {/* Filter Controls (Segmented Tabs) */}
                <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700 self-start">
                  <button
                    type="button"
                    onClick={() => setCharacterGenderFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      characterGenderFilter === 'all'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All (6)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCharacterGenderFilter('boy')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      characterGenderFilter === 'boy'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    3 Boys
                  </button>
                  <button
                    type="button"
                    onClick={() => setCharacterGenderFilter('girl')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      characterGenderFilter === 'girl'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    3 Girls
                  </button>
                </div>
              </div>

              {/* Characters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCharacters.map((char) => {
                  const isSelected = formData.selectedCharacterId === char.id;
                  const isBroom = char.flightType === 'broomstick' || isMagic;

                  return (
                    <div
                      key={char.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? isMagic 
                            ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/80 shadow-xl' 
                            : 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-400/80 shadow-xl'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                      }`}
                    >
                      <div>
                        {/* Visual Portrait & Live Sprite Preview */}
                        <div className="relative mb-3 flex items-center justify-center p-3 rounded-xl bg-slate-950/80 border border-slate-700/60 overflow-hidden">
                          {/* Live Flight Silhouette / Character Art */}
                          <div 
                            className="w-20 h-20 rounded-full overflow-hidden border-2 bg-slate-900 shadow-lg flex items-center justify-center relative"
                            style={{ borderColor: char.visorColor || char.flameColor }}
                          >
                            {char.customUploadedImage || char.avatarUrl ? (
                              <img
                                src={char.customUploadedImage || char.avatarUrl}
                                alt={char.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-3xl font-black" style={{ color: char.hairColor }}>
                                {char.name[0]}
                              </span>
                            )}
                          </div>

                          {/* Flight Gear Mini Tag */}
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                            {isBroom ? '🧹 Broomstick' : '🚀 Jetpack'}
                          </div>
                        </div>

                        {/* Name & Gender Badge */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base font-extrabold text-white">{char.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            char.gender === 'boy'
                              ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                              : 'bg-pink-950 text-pink-300 border border-pink-500/30'
                          }`}>
                            {char.gender}
                          </span>
                        </div>

                        <div className={`text-xs font-bold mb-2 ${isMagic ? 'text-amber-400' : 'text-cyan-400'}`}>
                          {char.title}
                        </div>

                        <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                          {char.bio}
                        </p>

                        {/* Color Palette Indicators */}
                        <div className="flex items-center gap-2 mb-4 text-[11px] text-slate-400">
                          <span>Theme:</span>
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: char.hairColor }} title="Hair Color" />
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: char.suitColor }} title="Robes / Suit Color" />
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: char.flameColor }} title="Spark / Flame Color" />
                        </div>
                      </div>

                      {/* Select & Custom Avatar Actions */}
                      <div className="space-y-2 pt-2 border-t border-slate-700/50">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, selectedCharacterId: char.id })}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? isMagic ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-cyan-500 text-slate-950 shadow-md'
                              : 'bg-slate-750 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Active Pilot</span>
                            </>
                          ) : (
                            <span>Select This Character</span>
                          )}
                        </button>

                        <label className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 cursor-pointer border border-slate-700/60 transition-colors">
                          <Upload className="w-3 h-3 text-cyan-400" />
                          <span>Upload Custom Portrait</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCharacterImageUpload(char.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. LOGO & BILLBOARD / ORNATE FRAME */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {isMagic ? 'Logo & Ornate Castle Picture Frame' : 'Logo & Skyscraper Billboard'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isMagic 
                    ? 'In the Magic Academy theme, your logo is mounted inside an antique carved golden heraldic frame on the castle stone corridor wall.'
                    : 'In the Cyber Arcade theme, your logo is mounted on a massive illuminated billboard in the center skyscraper.'}
                </p>
              </div>

              {/* Live Preview of Frame / Billboard */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-700/60 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
                <div className="text-[10px] font-mono text-slate-400 mb-3 tracking-widest uppercase">
                  {isMagic ? 'Castle Corridor Ornate Golden Frame Preview' : 'City Skyscraper Billboard Preview'}
                </div>
                
                {isMagic ? (
                  // MAGIC THEME: ORNATE CARVED GOLDEN FRAME
                  <div className="w-full max-w-sm p-5 rounded-2xl bg-[#141a28] border-4 border-amber-500 shadow-2xl flex flex-col items-center justify-center relative">
                    <div className="absolute -top-3 -left-3 text-amber-400 text-lg">⚜</div>
                    <div className="absolute -top-3 -right-3 text-amber-400 text-lg">⚜</div>
                    <div className="absolute -bottom-3 -left-3 text-amber-400 text-lg">⚜</div>
                    <div className="absolute -bottom-3 -right-3 text-amber-400 text-lg">⚜</div>

                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-400 mb-3 bg-slate-950 flex items-center justify-center shadow-xl">
                      {formData.branding.customLogoDataUrl || formData.branding.logoUrl ? (
                        <img 
                          src={formData.branding.customLogoDataUrl || formData.branding.logoUrl} 
                          alt="Brand Logo" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-amber-400">⚡</span>
                      )}
                    </div>
                    <div className="text-base font-bold text-amber-200 uppercase tracking-widest mb-0.5">
                      {formData.branding.brandName || 'MAGIC ACADEMY'}
                    </div>
                    <div className="text-xs font-mono text-amber-400">
                      {formData.branding.tagline || 'HOUSE OF WONDERS'}
                    </div>
                  </div>
                ) : (
                  // CYBER THEME: NEON BILLBOARD
                  <div 
                    className="w-full max-w-sm p-5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-2xl"
                    style={{ 
                      backgroundColor: '#070a1c',
                      borderColor: formData.branding.neonColor,
                      boxShadow: `0 0 24px ${formData.branding.neonColor}33`
                    }}
                  >
                    <div 
                      className="w-24 h-24 rounded-full overflow-hidden border-2 mb-3 bg-slate-900 flex items-center justify-center shadow-inner"
                      style={{ borderColor: formData.branding.neonColor }}
                    >
                      {formData.branding.customLogoDataUrl || formData.branding.logoUrl ? (
                        <img 
                          src={formData.branding.customLogoDataUrl || formData.branding.logoUrl} 
                          alt="Brand Logo" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-cyan-400">⚡</span>
                      )}
                    </div>
                    <div 
                      className="text-base font-extrabold uppercase tracking-wider mb-0.5"
                      style={{ color: formData.branding.billboardTextColor || '#ffffff' }}
                    >
                      {formData.branding.brandName || 'CYBERNETIX'}
                    </div>
                    <div 
                      className="text-xs font-mono font-medium tracking-wide"
                      style={{ color: formData.branding.neonColor }}
                    >
                      {formData.branding.tagline || 'FUTURE TECH LABS'}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Brand Name / Inscription
                  </label>
                  <input
                    type="text"
                    value={formData.branding.brandName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, brandName: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    placeholder="e.g. DATA BOOSTER"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Tagline / Crest Motto
                  </label>
                  <input
                    type="text"
                    value={formData.branding.tagline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, tagline: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    placeholder="e.g. EMPOWERING YOUR FLIGHT"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Upload Custom Logo Image
                  </label>
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-sm text-slate-200 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span className="truncate">
                      {formData.branding.customLogoDataUrl ? 'Replace Custom Logo Image' : 'Choose Logo File (PNG/JPG)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 4. ENVIRONMENT COLORS */}
          {activeTab === 'skyline' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {isMagic ? 'Castle Corridor & Stone Masonry Colors' : 'City Skyline & Building Colors'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isMagic 
                    ? 'Customize stone masonry shades, warm torchlight glow, and gothic cathedral arches.'
                    : 'Customize skyline skyscraper gradients, window illumination, and neon accents.'}
                </p>
              </div>

              {/* Theme Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.values(SKYLINE_THEMES).map((theme) => {
                  const isSelected = formData.activeSkylineThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          activeSkylineThemeId: theme.id,
                          customSkyline: { ...theme },
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/30 shadow-md ring-1 ring-cyan-400'
                          : 'border-slate-700/80 bg-slate-800/40 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 h-6 mb-2 rounded-md overflow-hidden border border-slate-700">
                        <div className="flex-1 h-full" style={{ backgroundColor: theme.skyTop }} />
                        <div className="flex-1 h-full" style={{ backgroundColor: theme.frontBuildings }} />
                        <div className="flex-1 h-full" style={{ backgroundColor: theme.windowGlow }} />
                        <div className="flex-1 h-full" style={{ backgroundColor: theme.neonTrim }} />
                      </div>
                      <div className="text-xs font-bold text-white truncate">{theme.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. MONSTERS & OBSTACLES */}
          {activeTab === 'monsters' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Monsters & Obstacles</h2>
                <p className="text-xs text-slate-400">
                  Choose which creature or hazard patrols the airspace.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(formData.monsterConfigs).map((monster) => {
                  const isSelected = formData.selectedMonsterId === monster.id;
                  return (
                    <div
                      key={monster.id}
                      onClick={() => setFormData({ ...formData, selectedMonsterId: monster.id })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-rose-400 bg-rose-950/20 ring-1 ring-rose-400/80 shadow-lg'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">{monster.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/30">
                            Active Monster
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{monster.tagline}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. COINS */}
          {activeTab === 'coins' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Collectibles & Coins</h2>
                <p className="text-xs text-slate-400">
                  Choose between classic arcade tokens, flying Golden Snitches, crystals, or your own custom coin image.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(formData.coinConfigs).map((coin) => {
                  const isSelected = formData.selectedCoinStyleId === coin.id;
                  return (
                    <div
                      key={coin.id}
                      onClick={() => setFormData({ ...formData, selectedCoinStyleId: coin.id })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/80 shadow-lg'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                      }`}
                    >
                      <div>
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center bg-slate-950 border border-slate-700 shadow-inner">
                          {coin.id === 'custom' && coin.customImageDataUrl ? (
                            <img
                              src={coin.customImageDataUrl}
                              alt="Custom Coin"
                              className="w-12 h-12 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 shadow-md"
                              style={{ backgroundColor: coin.primaryColor }}
                            >
                              {coin.id === 'token' && '★'}
                              {coin.id === 'crystal' && '◆'}
                              {coin.id === 'diamond' && '♦'}
                              {coin.id === 'star' && '⚡'}
                              {coin.id === 'custom' && '⚙'}
                            </div>
                          )}
                        </div>

                        <div className="text-center mb-2">
                          <div className="text-sm font-bold text-white">{coin.name}</div>
                        </div>
                        <p className="text-xs text-slate-400 text-center mb-3">{coin.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-700/50">
                        {coin.id === 'custom' ? (
                          <label 
                            onClick={(e) => e.stopPropagation()}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{coin.customImageDataUrl ? 'Change Image' : 'Add Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoinImageUpload}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="text-center text-xs font-semibold text-slate-400">
                            {isSelected ? '✓ Selected' : 'Click to Select'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. PHYSICS */}
          {activeTab === 'physics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Flight Physics</h2>
                <p className="text-xs text-slate-400">
                  Calibrate upward flight thrust, descent gravity, and speed.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Continuous Thrust Power ({formData.settings.thrust})
                  </label>
                  <input
                    type="range"
                    min="0.35"
                    max="0.75"
                    step="0.02"
                    value={formData.settings.thrust}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, thrust: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Descent Gravity ({formData.settings.gravity})
                  </label>
                  <input
                    type="range"
                    min="0.16"
                    max="0.45"
                    step="0.01"
                    value={formData.settings.gravity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, gravity: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
