import React, { useState, useEffect } from 'react';
import { AppConfig, Character, CoinStyleId, MonsterTypeId, SkylineTheme, GameTheme, PrizeTier } from '../types/game';
import { 
  SKYLINE_THEMES, 
  MONSTER_CONFIGS, 
  COIN_CONFIGS, 
  DEFAULT_APP_CONFIG,
  CYBER_CHARACTERS,
  WIZARD_CHARACTERS,
  DEFAULT_BRAND_LOGO,
  DEFAULT_PRIZE_TIERS,
  LAST_USED_LOGO_KEY,
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
  Gamepad2,
  Clock,
  ClipboardList,
  FileSpreadsheet,
  Download,
  Trash2,
  Search,
  Plus,
  UserCheck,
  CheckCircle2,
  Calendar,
  Database,
  Trophy,
  Award,
  Gift,
} from 'lucide-react';
import {
  getEvents,
  saveEvents,
  setActiveEventId,
  getRegistrationsForEvent,
  clearRegistrationsForEvent,
  exportEventToCSV,
  exportEventToJSON,
  deleteRegistration,
  mergeRemoteAttendees,
} from '../utils/eventStorage';
import { subscribeToEventAttendees } from '../lib/firebase';
import { EventSession, AttendeeRegistration } from '../types/game';

interface AdminPanelProps {
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, onSaveConfig, onClose }) => {
  const [formData, setFormData] = useState<AppConfig>(JSON.parse(JSON.stringify(config)));
  const [activeTab, setActiveTab] = useState<'themes' | 'branding' | 'skyline' | 'characters' | 'monsters' | 'coins' | 'physics' | 'prizes' | 'events'>('themes');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [characterGenderFilter, setCharacterGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');

  // Prize Tiers state
  const [newPrizeScore, setNewPrizeScore] = useState<number>(15);
  const [newPrizeName, setNewPrizeName] = useState<string>('');
  const [newPrizeDesc, setNewPrizeDesc] = useState<string>('');
  const [newPrizeBadgeColor, setNewPrizeBadgeColor] = useState<string>('#38bdf8');

  // Event & Attendee Registers State
  const [eventsList, setEventsList] = useState<EventSession[]>(() => getEvents());
  const [selectedEventId, setSelectedEventId] = useState<string>(
    () => formData.settings.activeEventId || eventsList[0]?.id || 'tim_summit_2026'
  );
  const [attendeeRecords, setAttendeeRecords] = useState<AttendeeRegistration[]>(
    () => getRegistrationsForEvent(selectedEventId)
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventCode, setNewEventCode] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  const [isFirebaseSynced, setIsFirebaseSynced] = useState(true);

  const refreshAttendeeRecords = (eventId: string) => {
    setAttendeeRecords(getRegistrationsForEvent(eventId));
  };

  // Live Firestore subscription for attendee registers
  useEffect(() => {
    if (!selectedEventId) return;
    refreshAttendeeRecords(selectedEventId);

    const unsubscribe = subscribeToEventAttendees(selectedEventId, (firebaseAttendees) => {
      if (firebaseAttendees && firebaseAttendees.length > 0) {
        mergeRemoteAttendees(firebaseAttendees);
        refreshAttendeeRecords(selectedEventId);
        setIsFirebaseSynced(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedEventId]);

  const isMagic = formData.theme === 'magic_academy';

  const handleSave = () => {
    // Make sure the last used logo is permanently preserved
    const activeLogo = formData.branding.customLogoDataUrl || formData.branding.logoUrl;
    if (activeLogo) {
      try {
        localStorage.setItem(LAST_USED_LOGO_KEY, activeLogo);
      } catch (err) {
        console.warn('Could not save logo to localStorage', err);
      }
    }
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all game customizations and branding back to default values?')) {
      const activeLogo = localStorage.getItem(LAST_USED_LOGO_KEY);
      const resetConfig: AppConfig = JSON.parse(JSON.stringify(DEFAULT_APP_CONFIG));
      if (activeLogo) {
        resetConfig.branding.logoUrl = activeLogo;
        resetConfig.branding.customLogoDataUrl = activeLogo;
      }
      setFormData(resetConfig);
      onSaveConfig(resetConfig);
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
      try {
        localStorage.setItem(LAST_USED_LOGO_KEY, dataUrl);
      } catch (err) {
        console.warn('Could not cache logo in localStorage', err);
      }
      setFormData((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          logoUrl: dataUrl,
          customLogoDataUrl: dataUrl,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogoToDefault = () => {
    try {
      localStorage.setItem(LAST_USED_LOGO_KEY, DEFAULT_BRAND_LOGO);
    } catch {}
    setFormData((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        logoUrl: DEFAULT_BRAND_LOGO,
        customLogoDataUrl: undefined,
      },
    }));
  };

  // Prize Tiers CRUD helpers
  const handleAddPrizeTier = () => {
    if (!newPrizeName.trim()) return;
    const newTier: PrizeTier = {
      id: `tier_${Date.now()}`,
      minScore: Math.max(1, newPrizeScore),
      prizeName: newPrizeName.trim(),
      description: newPrizeDesc.trim() || undefined,
      badgeColor: newPrizeBadgeColor || '#f59e0b',
    };

    const currentTiers = formData.settings.prizeTiers || [];
    const updatedTiers = [...currentTiers, newTier].sort((a, b) => a.minScore - b.minScore);
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        prizeTiers: updatedTiers,
      },
    }));
    setNewPrizeName('');
    setNewPrizeDesc('');
    setNewPrizeScore(updatedTiers[updatedTiers.length - 1].minScore + 15);
  };

  const handleUpdatePrizeTier = (id: string, updates: Partial<PrizeTier>) => {
    const currentTiers = formData.settings.prizeTiers || [];
    const updatedTiers = currentTiers.map((t) => (t.id === id ? { ...t, ...updates } : t));
    if (updates.minScore !== undefined) {
      updatedTiers.sort((a, b) => a.minScore - b.minScore);
    }
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        prizeTiers: updatedTiers,
      },
    }));
  };

  const handleDeletePrizeTier = (id: string) => {
    const currentTiers = formData.settings.prizeTiers || [];
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        prizeTiers: currentTiers.filter((t) => t.id !== id),
      },
    }));
  };

  const handleResetPrizeTiers = () => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        prizeTiers: DEFAULT_PRIZE_TIERS,
      },
    }));
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

  const handleMonsterImageUpload = (monsterId: MonsterTypeId, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        selectedMonsterId: monsterId,
        monsterConfigs: {
          ...prev.monsterConfigs,
          [monsterId]: {
            ...prev.monsterConfigs[monsterId],
            customImageDataUrl: dataUrl,
          },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMonsterImage = (monsterId: MonsterTypeId, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData((prev) => ({
      ...prev,
      monsterConfigs: {
        ...prev.monsterConfigs,
        [monsterId]: {
          ...prev.monsterConfigs[monsterId],
          customImageDataUrl: undefined,
        },
      },
    }));
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

          <button
            onClick={() => setActiveTab('prizes')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'prizes'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Score Prizes & Rewards</span>
            </div>
            {formData.settings.prizeTiers && formData.settings.prizeTiers.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-mono">
                {formData.settings.prizeTiers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              refreshAttendeeRecords(selectedEventId);
              setActiveTab('events');
            }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-4 h-4 shrink-0 text-purple-400" />
              <span>Event Registers & Login</span>
            </div>
            {attendeeRecords.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-mono">
                {attendeeRecords.length}
              </span>
            )}
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

                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-400 mb-3 bg-white flex items-center justify-center shadow-xl p-1.5">
                      {formData.branding.customLogoDataUrl || formData.branding.logoUrl ? (
                        <img 
                          src={formData.branding.customLogoDataUrl || formData.branding.logoUrl} 
                          alt="Brand Logo" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-amber-400">⚡</span>
                      )}
                    </div>
                    {formData.branding.showBrandName !== false && Boolean(formData.branding.brandName) && (
                      <div className="text-base font-bold text-amber-200 uppercase tracking-widest mb-0.5">
                        {formData.branding.brandName}
                      </div>
                    )}
                    {formData.branding.showTagline !== false && Boolean(formData.branding.tagline) && (
                      <div className="text-xs font-mono text-amber-400">
                        {formData.branding.tagline}
                      </div>
                    )}
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
                      className="w-24 h-24 rounded-full overflow-hidden border-2 mb-3 bg-white flex items-center justify-center shadow-inner p-1.5"
                      style={{ borderColor: formData.branding.neonColor }}
                    >
                      {formData.branding.customLogoDataUrl || formData.branding.logoUrl ? (
                        <img 
                          src={formData.branding.customLogoDataUrl || formData.branding.logoUrl} 
                          alt="Brand Logo" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-cyan-400">⚡</span>
                      )}
                    </div>
                    {formData.branding.showBrandName !== false && Boolean(formData.branding.brandName) && (
                      <div 
                        className="text-base font-extrabold uppercase tracking-wider mb-0.5"
                        style={{ color: formData.branding.billboardTextColor || '#ffffff' }}
                      >
                        {formData.branding.brandName}
                      </div>
                    )}
                    {formData.branding.showTagline !== false && Boolean(formData.branding.tagline) && (
                      <div 
                        className="text-xs font-mono font-medium tracking-wide"
                        style={{ color: formData.branding.neonColor }}
                      >
                        {formData.branding.tagline}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Controls with On/Off Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand Name Control */}
                <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">
                      Brand Name / Inscription
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={formData.branding.showBrandName !== false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branding: { ...formData.branding, showBrandName: e.target.checked },
                          })
                        }
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer accent-cyan-500"
                      />
                      <span>Show in Game</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={formData.branding.showBrandName === false}
                    value={formData.branding.brandName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, brandName: e.target.value },
                      })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-white focus:outline-none transition-colors ${
                      formData.branding.showBrandName === false
                        ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                        : 'bg-slate-800 border-slate-700 focus:border-cyan-400'
                    }`}
                    placeholder="e.g. TIM"
                  />
                  {formData.branding.showBrandName === false && (
                    <p className="text-[11px] text-amber-400 font-medium">Brand name is disabled and hidden everywhere.</p>
                  )}
                </div>

                {/* Tagline Control */}
                <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">
                      Tagline / Motto
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={formData.branding.showTagline !== false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branding: { ...formData.branding, showTagline: e.target.checked },
                          })
                        }
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer accent-cyan-500"
                      />
                      <span>Show in Game</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={formData.branding.showTagline === false}
                    value={formData.branding.tagline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, tagline: e.target.value },
                      })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-white focus:outline-none transition-colors ${
                      formData.branding.showTagline === false
                        ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                        : 'bg-slate-800 border-slate-700 focus:border-cyan-400'
                    }`}
                    placeholder="e.g. INNOVATION & TECHNOLOGY"
                  />
                  {formData.branding.showTagline === false && (
                    <p className="text-[11px] text-amber-400 font-medium">Tagline is disabled and hidden everywhere.</p>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Upload Custom Brand Logo Image
                    </label>
                    {(Boolean(formData.branding.customLogoDataUrl) || formData.branding.logoUrl !== DEFAULT_BRAND_LOGO) && (
                      <button
                        type="button"
                        onClick={handleResetLogoToDefault}
                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to TIM Logo</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <label className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-sm text-slate-200 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span className="truncate">
                        {formData.branding.customLogoDataUrl ? 'Replace Uploaded Logo Image' : 'Choose Logo File (PNG/JPG)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.branding.customLogoDataUrl && (
                      <div className="px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5 shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Custom Logo Active &amp; Saved</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Whatever logo is uploaded or set last will be permanently remembered and maintained across game reloads, events, and theme switches.</span>
                  </p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(formData.monsterConfigs).map((monster) => {
                  const isSelected = formData.selectedMonsterId === monster.id;
                  
                  // Visual symbol & avatar style per monster
                  let symbol = '🛸';
                  let iconBg = 'bg-slate-900';
                  let iconBorder = 'border-rose-500';
                  
                  if (monster.id === 'dementor') {
                    symbol = '👻';
                    iconBg = 'bg-slate-950';
                    iconBorder = 'border-cyan-400';
                  } else if (monster.id === 'bludger') {
                    symbol = '⚡';
                    iconBg = 'bg-red-950/60';
                    iconBorder = 'border-red-500';
                  } else if (monster.id === 'gargoyle') {
                    symbol = '🦇';
                    iconBg = 'bg-purple-950/60';
                    iconBorder = 'border-purple-400';
                  } else if (monster.id === 'glitch') {
                    symbol = '👾';
                    iconBg = 'bg-cyan-950/60';
                    iconBorder = 'border-cyan-400';
                  } else if (monster.id === 'mine') {
                    symbol = '💥';
                    iconBg = 'bg-amber-950/60';
                    iconBorder = 'border-amber-400';
                  }

                  return (
                    <div
                      key={monster.id}
                      onClick={() => setFormData({ ...formData, selectedMonsterId: monster.id })}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-rose-400 bg-rose-950/30 ring-2 ring-rose-400/80 shadow-xl'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                      }`}
                    >
                      <div>
                        {/* Visual Avatar Preview */}
                        {monster.customImageDataUrl ? (
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl border-2 overflow-hidden flex items-center justify-center shadow-lg transition-transform bg-slate-950 ${iconBorder} ${isSelected ? 'scale-105' : ''}`}>
                            <img
                              src={monster.customImageDataUrl}
                              alt={monster.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                        ) : (
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-lg transition-transform ${iconBg} ${iconBorder} ${isSelected ? 'scale-105' : ''}`}>
                            {symbol}
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-white">{monster.name}</span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-500/40 uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">{monster.tagline}</p>
                      </div>

                      {/* Custom Monster Image Option */}
                      <div className="pt-3 border-t border-slate-700/50 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <label className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-[11px] font-semibold text-slate-200 cursor-pointer transition-colors">
                          <Upload className="w-3 h-3 text-rose-400" />
                          <span>{monster.customImageDataUrl ? 'Change Image' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleMonsterImageUpload(monster.id, e)}
                            className="hidden"
                          />
                        </label>
                        {monster.customImageDataUrl && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveMonsterImage(monster.id, e)}
                            className="w-full text-center text-[10px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer py-0.5"
                          >
                            Remove Custom Image
                          </button>
                        )}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400 font-mono text-[10px] uppercase">
                            {monster.behavior}
                          </span>
                          <span className={`font-bold text-[11px] ${isSelected ? 'text-rose-400' : 'text-slate-500'}`}>
                            {isSelected ? '✓ Equipped' : 'Click to Equip'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Color Customizer for Selected Monster */}
              {formData.monsterConfigs[formData.selectedMonsterId] && (
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Customize {formData.monsterConfigs[formData.selectedMonsterId].name} Colors
                      </h3>
                      <p className="text-xs text-slate-400">
                        Adjust aura, glow, and hazard highlights in real time.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Primary / Shield Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.monsterConfigs[formData.selectedMonsterId].primaryColor}
                          onChange={(e) => {
                            const curId = formData.selectedMonsterId;
                            setFormData({
                              ...formData,
                              monsterConfigs: {
                                ...formData.monsterConfigs,
                                [curId]: {
                                  ...formData.monsterConfigs[curId],
                                  primaryColor: e.target.value,
                                },
                              },
                            });
                          }}
                          className="w-9 h-9 rounded-lg border border-slate-700 cursor-pointer bg-slate-800 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-300 uppercase">
                          {formData.monsterConfigs[formData.selectedMonsterId].primaryColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Glow / Aura Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.monsterConfigs[formData.selectedMonsterId].glowColor}
                          onChange={(e) => {
                            const curId = formData.selectedMonsterId;
                            setFormData({
                              ...formData,
                              monsterConfigs: {
                                ...formData.monsterConfigs,
                                [curId]: {
                                  ...formData.monsterConfigs[curId],
                                  glowColor: e.target.value,
                                },
                              },
                            });
                          }}
                          className="w-9 h-9 rounded-lg border border-slate-700 cursor-pointer bg-slate-800 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-300 uppercase">
                          {formData.monsterConfigs[formData.selectedMonsterId].glowColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Hazard / Eye Laser Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.monsterConfigs[formData.selectedMonsterId].hazardColor}
                          onChange={(e) => {
                            const curId = formData.selectedMonsterId;
                            setFormData({
                              ...formData,
                              monsterConfigs: {
                                ...formData.monsterConfigs,
                                [curId]: {
                                  ...formData.monsterConfigs[curId],
                                  hazardColor: e.target.value,
                                },
                              },
                            });
                          }}
                          className="w-9 h-9 rounded-lg border border-slate-700 cursor-pointer bg-slate-800 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-300 uppercase">
                          {formData.monsterConfigs[formData.selectedMonsterId].hazardColor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

          {/* 7. PHYSICS & TIMER */}
          {activeTab === 'physics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Flight Physics & Timer Bar</h2>
                <p className="text-xs text-slate-400">
                  Calibrate flight controls, countdown timer duration, and coin time bonuses.
                </p>
              </div>

              {/* Timer Bar Settings */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Flight Countdown Timer</h3>
                      <p className="text-xs text-slate-400">
                        Limits game duration. Character expires when the timer bar reaches zero.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.settings.enableTimer ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: { ...formData.settings, enableTimer: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-700"
                    />
                    <span className="text-xs font-semibold text-slate-300">Enable Timer</span>
                  </label>
                </div>

                {(formData.settings.enableTimer ?? true) && (
                  <div className="space-y-4 pt-3 border-t border-slate-800">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-200">
                          Total Game Flight Time (Seconds)
                        </label>
                        <span className="text-xs font-bold font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                          {formData.settings.gameDurationSeconds ?? 60}s ({Math.floor((formData.settings.gameDurationSeconds ?? 60) / 60)}m {(formData.settings.gameDurationSeconds ?? 60) % 60}s)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="300"
                        step="5"
                        value={formData.settings.gameDurationSeconds ?? 60}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            settings: { ...formData.settings, gameDurationSeconds: parseInt(e.target.value, 10) },
                          })
                        }
                        className="w-full accent-amber-400"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>15s (Short Blitz)</span>
                        <span>60s (Default)</span>
                        <span>120s (2 mins)</span>
                        <span>300s (5 mins)</span>
                      </div>
                    </div>

                    {/* Add Time on Coin Collect */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Add Extra Time on Coin / Snitch Collection
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Extends the countdown timer bar whenever the player collects a coin or snitch.
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.settings.addTimeOnCoin ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                settings: { ...formData.settings, addTimeOnCoin: e.target.checked },
                              })
                            }
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-800 border-slate-700"
                          />
                          <span className="text-xs font-semibold text-slate-300">Active</span>
                        </label>
                      </div>

                      {(formData.settings.addTimeOnCoin ?? true) && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Time Added Per Coin / Snitch
                            </label>
                            <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              +{formData.settings.timeBonusSeconds ?? 2} seconds
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={formData.settings.timeBonusSeconds ?? 2}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                settings: { ...formData.settings, timeBonusSeconds: parseInt(e.target.value, 10) },
                              })
                            }
                            className="w-full accent-emerald-400"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                            <span>+1s</span>
                            <span>+2s (Default)</span>
                            <span>+5s</span>
                            <span>+10s</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Thrust & Gravity Physics */}
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

          {/* 8. SCORE PRIZES & REWARDS MANAGEMENT */}
          {activeTab === 'prizes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span>Tournament Prizes &amp; Score Rewards</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure multiple score thresholds and the prizes players win when collecting coins or snitches. When the game ends, their score, best record, and won prize are showcased.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetPrizeTiers}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 self-start cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Default Tiers</span>
                </button>
              </div>

              {/* Master Toggle */}
              <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-white block">
                    Show Prizes on Game Over Screen
                  </label>
                  <p className="text-xs text-slate-400">
                    Displays the prize unlocked (or next prize threshold) right below the final score card when the run terminates or time runs out.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.settings.enablePrizes !== false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          enablePrizes: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-400">
                    {formData.settings.enablePrizes !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* Existing Prize Tiers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>Configured Prize Tiers ({formData.settings.prizeTiers?.length || 0})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Sorted by score required (ascending)
                  </span>
                </div>

                {(!formData.settings.prizeTiers || formData.settings.prizeTiers.length === 0) ? (
                  <div className="p-8 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700 text-center text-slate-400">
                    <Gift className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-medium">No prize tiers currently set.</p>
                    <p className="text-xs text-slate-500 mt-1">Use the form below to add your first score milestone and prize.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.settings.prizeTiers.map((tier, idx) => (
                      <div
                        key={tier.id}
                        className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: tier.badgeColor || '#f59e0b' }}
                            />
                            <span className="text-xs font-mono font-bold text-slate-400">
                              TIER #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                              Requires {tier.minScore} {formData.theme === 'magic_academy' ? 'snitches' : 'coins'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {/* Color Selector */}
                            <div className="flex items-center gap-1">
                              {['#cd7f32', '#94a3b8', '#f59e0b', '#00f0ff', '#a855f7', '#10b981'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => handleUpdatePrizeTier(tier.id, { badgeColor: c })}
                                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                                    tier.badgeColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                                  }`}
                                  style={{ backgroundColor: c }}
                                  title={`Badge color ${c}`}
                                />
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeletePrizeTier(tier.id)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                              title="Delete prize tier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Score Needed */}
                          <div className="sm:col-span-3">
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Score Needed
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="9999"
                              value={tier.minScore}
                              onChange={(e) =>
                                handleUpdatePrizeTier(tier.id, { minScore: Math.max(1, parseInt(e.target.value, 10) || 1) })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {/* Prize Name */}
                          <div className="sm:col-span-5">
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Prize Title
                            </label>
                            <input
                              type="text"
                              value={tier.prizeName}
                              onChange={(e) =>
                                handleUpdatePrizeTier(tier.id, { prizeName: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                              placeholder="e.g. TIM Fast Charge Cable"
                            />
                          </div>

                          {/* Prize Description */}
                          <div className="sm:col-span-4">
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Details / How to Claim
                            </label>
                            <input
                              type="text"
                              value={tier.description || ''}
                              onChange={(e) =>
                                handleUpdatePrizeTier(tier.id, { description: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-cyan-400"
                              placeholder="e.g. Claim at Booth #4"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Prize Tier Form */}
              <div className="bg-slate-850/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Add New Prize Milestone</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Score Needed ({formData.theme === 'magic_academy' ? 'Snitches' : 'Coins'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="9999"
                      value={newPrizeScore}
                      onChange={(e) => setNewPrizeScore(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Prize Name / Reward Title
                    </label>
                    <input
                      type="text"
                      value={newPrizeName}
                      onChange={(e) => setNewPrizeName(e.target.value)}
                      placeholder="e.g. TIM Premium Wireless Earbuds"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Claim Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={newPrizeDesc}
                      onChange={(e) => setNewPrizeDesc(e.target.value)}
                      placeholder="e.g. Show score to booth attendant to redeem"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">Badge Color:</span>
                    <div className="flex items-center gap-1.5">
                      {['#cd7f32', '#94a3b8', '#f59e0b', '#00f0ff', '#a855f7', '#10b981', '#f43f5e'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewPrizeBadgeColor(c)}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            newPrizeBadgeColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPrizeTier}
                    disabled={!newPrizeName.trim()}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newPrizeName.trim()
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Prize Tier ({newPrizeScore} coins)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 9. EVENT REGISTERS & LOGIN MANAGEMENT */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-purple-400" />
                      <span>Event Registers & Attendee Data Files</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Incoming player check-ins and scores are filed per event. Download attendance lists and scoreboards as CSV or JSON files.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-[11px] font-semibold text-purple-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Admin Only &bull; Hidden from Game Screen</span>
                  </div>
                </div>
              </div>

              {/* Top Settings: Registration Switch & Active Event Target */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Pre-Game Login Toggle */}
                <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-purple-400" />
                        <h3 className="text-sm font-bold text-white">Pre-Game Login / Registration</h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          formData.settings.requireRegistration
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                        }`}
                      >
                        {formData.settings.requireRegistration ? 'Active (Required)' : 'Deactivated'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                      When activated, a non-scrollable check-in modal appears before starting the game requesting:
                      <span className="block mt-1 font-mono text-[11px] text-purple-300">
                        Name &bull; Company &bull; Email &bull; Contact Number &bull; Position
                      </span>
                    </p>
                  </div>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/80 cursor-pointer hover:bg-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.settings.requireRegistration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            requireRegistration: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 rounded text-purple-500 focus:ring-purple-400 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Require Attendee Registration Before Flight
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Uncheck to let anyone fly immediately without check-in.
                      </span>
                    </div>
                  </label>
                </div>

                {/* 2. Active Event File Selector */}
                <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">Target Event File</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <Database className="w-3 h-3 text-emerald-400" />
                          <span>Firebase Firestore Synced</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateEventForm(!showCreateEventForm)}
                          className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{showCreateEventForm ? 'Cancel' : 'New Event File'}</span>
                        </button>
                      </div>
                    </div>

                    {showCreateEventForm ? (
                      <div className="space-y-2.5 p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 mb-3 animate-fadeIn">
                        <div>
                          <label className="text-[11px] font-medium text-slate-300 block mb-1">
                            Event Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. TIM Tech Summit 2026"
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-medium text-slate-300 block mb-1">
                              Event Code
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. TIM-EXPO-26"
                              value={newEventCode}
                              onChange={(e) => setNewEventCode(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-300 block mb-1">
                              Description (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Annual Booth"
                              value={newEventDesc}
                              onChange={(e) => setNewEventDesc(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newEventName.trim()) return;
                            const evId = `event_${Date.now()}`;
                            const newEv: EventSession = {
                              id: evId,
                              name: newEventName.trim(),
                              code: newEventCode.trim() || `EV-${Date.now().toString().slice(-4)}`,
                              description: newEventDesc.trim(),
                              createdAt: new Date().toISOString(),
                              isActive: true,
                            };
                            const updatedEvents = [newEv, ...eventsList.map((e) => ({ ...e, isActive: false }))];
                            saveEvents(updatedEvents);
                            setActiveEventId(evId);
                            setEventsList(updatedEvents);
                            setSelectedEventId(evId);
                            setFormData((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                activeEventId: evId,
                                activeEventName: newEv.name,
                              },
                            }));
                            setShowCreateEventForm(false);
                            setNewEventName('');
                            setNewEventCode('');
                            setNewEventDesc('');
                            refreshAttendeeRecords(evId);
                          }}
                          className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                        >
                          Create & Set as Active Event
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 mb-3">
                        Incoming registrations will automatically be tagged to this file:
                      </p>
                    )}

                    <div className="space-y-2">
                      <select
                        value={selectedEventId}
                        onChange={(e) => {
                          const evId = e.target.value;
                          setSelectedEventId(evId);
                          const chosen = eventsList.find((ev) => ev.id === evId);
                          if (chosen) {
                            setActiveEventId(evId);
                            setFormData((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                activeEventId: evId,
                                activeEventName: chosen.name,
                              },
                            }));
                          }
                          refreshAttendeeRecords(evId);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                      >
                        {eventsList.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name} ({ev.code || 'NO-CODE'})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800">
                        <span>Currently Recording Into:</span>
                        <strong className="text-cyan-400 font-mono">
                          {eventsList.find((e) => e.id === selectedEventId)?.name || 'Default Event'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Popups Customization: Title, Subtitle, and Footer Tagline */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Popups Customization (Instructions & Registration)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Customize the titles, subtitles, and footer branding displayed on both modals.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Registration Popup Titles */}
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-xs font-bold text-purple-300 block uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      Registration Pop Up
                    </span>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Modal Title
                      </label>
                      <input
                        type="text"
                        placeholder="Pilot Registration & Check-In"
                        value={formData.settings.registrationTitle ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            settings: {
                              ...formData.settings,
                              registrationTitle: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Modal Subtitle
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Fill in your details below to save your flight run & tournament scores for this event."
                        value={formData.settings.registrationSubtitle ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            settings: {
                              ...formData.settings,
                              registrationSubtitle: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Instructions Popup Titles */}
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-xs font-bold text-cyan-300 block uppercase tracking-wider flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-cyan-400" />
                      Instructions Pop Up
                    </span>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Modal Title
                      </label>
                      <input
                        type="text"
                        placeholder="Pilot Flight Protocol"
                        value={formData.settings.instructionsTitle ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            settings: {
                              ...formData.settings,
                              instructionsTitle: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Modal Subtitle
                      </label>
                      <input
                        type="text"
                        placeholder="Flight rules & mission controls"
                        value={formData.settings.instructionsSubtitle ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            settings: {
                              ...formData.settings,
                              instructionsSubtitle: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Tagline for both popups */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-0.5">
                      Bottom Footer Tagline (Both Popups)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Appears at the very bottom of both the Registration and Instructions modals.
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Presented by TIM"
                    value={formData.settings.popupFooterText ?? 'Presented by TIM'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          popupFooterText: e.target.value,
                        },
                      })
                    }
                    className="w-full sm:max-w-xs bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white font-semibold"
                  />
                </div>
              </div>

              {/* Event Statistics & Export Bar */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                      Registered Attendees
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      {attendeeRecords.length}
                    </span>
                  </div>
                  <div className="h-8 w-[1px] bg-slate-800" />
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                      Top Event Score
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {attendeeRecords.length > 0
                        ? Math.max(...attendeeRecords.map((r) => r.bestScore || 0))
                        : 0}
                    </span>
                  </div>
                  <div className="h-8 w-[1px] bg-slate-800" />
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                      Total Flight Runs
                    </span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">
                      {attendeeRecords.reduce((acc, curr) => acc + (curr.totalRuns || 0), 0)}
                    </span>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = eventsList.find((e) => e.id === selectedEventId);
                      exportEventToCSV(selectedEventId, cur?.name);
                    }}
                    disabled={attendeeRecords.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    title="Export attendee registers to CSV for Excel / Google Sheets"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cur = eventsList.find((e) => e.id === selectedEventId);
                      exportEventToJSON(selectedEventId, cur?.name);
                    }}
                    disabled={attendeeRecords.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    title="Export backup file as JSON"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>

                  {attendeeRecords.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to clear all ${attendeeRecords.length} registrations for this event?`)) {
                          clearRegistrationsForEvent(selectedEventId);
                          refreshAttendeeRecords(selectedEventId);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700/50 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Clear records for this event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Event</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Attendee Registers Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search attendee by name, company, position..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Showing {
                      attendeeRecords.filter(
                        (r) =>
                          r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          r.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          r.position.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          r.email.toLowerCase().includes(searchFilter.toLowerCase())
                      ).length
                    } of {attendeeRecords.length}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Attendee / Pilot</th>
                        <th className="py-3 px-4">Company & Position</th>
                        <th className="py-3 px-4">Contact Info</th>
                        <th className="py-3 px-4 text-center">Best Score</th>
                        <th className="py-3 px-4 text-center">Runs</th>
                        <th className="py-3 px-4">Registered Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {attendeeRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ClipboardList className="w-8 h-8 text-slate-600 stroke-1" />
                              <span className="font-semibold text-slate-400">
                                No attendee registrations recorded for this event yet.
                              </span>
                              <span className="text-[11px] text-slate-500 max-w-sm">
                                When attendees enter the game and fill out the pre-game login form, their credentials and high scores will appear here in real-time.
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        attendeeRecords
                          .filter(
                            (r) =>
                              r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                              r.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
                              r.position.toLowerCase().includes(searchFilter.toLowerCase()) ||
                              r.email.toLowerCase().includes(searchFilter.toLowerCase())
                          )
                          .map((record, idx) => (
                            <tr key={record.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-500 font-bold text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-white text-xs">{record.name}</div>
                                <div className="text-[10px] text-purple-400 font-mono">
                                  ID: {record.id.slice(-6)}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-slate-200 font-medium text-xs">
                                  {record.company || '—'}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {record.position || '—'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-cyan-300 font-mono text-[11px]">
                                  {record.email}
                                </div>
                                <div className="text-slate-400 font-mono text-[11px]">
                                  {record.contactNumber || '—'}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full font-mono font-black text-amber-300 bg-amber-950/60 border border-amber-500/30 text-xs">
                                  {record.bestScore}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-slate-300 font-semibold text-xs">
                                {record.totalRuns || 0}
                              </td>
                              <td className="py-3 px-4 text-slate-400 text-[11px]">
                                {new Date(record.registeredAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Remove registration for ${record.name}?`)) {
                                      deleteRegistration(selectedEventId, record.id);
                                      refreshAttendeeRecords(selectedEventId);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
