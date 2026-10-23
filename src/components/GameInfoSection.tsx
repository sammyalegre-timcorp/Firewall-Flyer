import React from 'react';
import { AppConfig, Character } from '../types/game';
import { Trophy, Zap, Shield, Sparkles, ExternalLink, MousePointer, Flame, Check } from 'lucide-react';

interface GameInfoSectionProps {
  config: AppConfig;
  onSelectCharacter: (charId: string) => void;
  onOpenAdmin: () => void;
  highScores: Array<{
    id: string;
    playerName: string;
    characterName: string;
    score: number;
    coins: number;
    level: number;
    date: string;
  }>;
}

export const GameInfoSection: React.FC<GameInfoSectionProps> = ({
  config,
  onSelectCharacter,
  onOpenAdmin,
  highScores,
}) => {
  return (
    <div className="w-full space-y-10 pt-4 pb-12">
      {/* 1. Character Roster (Quick Picker) */}
      <section id="pilots" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
              Select Your Pilot
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Cyber Flight Squadron
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            6 Cybernetic Aviators · 3 Boys & 3 Girls
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {config.characters.map((char) => {
            const isSelected = config.selectedCharacterId === char.id;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/80 shadow-lg scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div>
                  <div 
                    className="w-12 h-12 rounded-full overflow-hidden border-2 mb-2 bg-slate-950 flex items-center justify-center mx-auto shadow-md"
                    style={{ borderColor: char.visorColor }}
                  >
                    {char.customUploadedImage || char.avatarUrl ? (
                      <img
                        src={char.customUploadedImage || char.avatarUrl}
                        alt={char.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-lg font-bold" style={{ color: char.hairColor }}>
                        {char.name[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                      <span>{char.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-cyan-400 stroke-[3]" />}
                    </div>
                    <div className="text-[10px] text-cyan-400 truncate">{char.title}</div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="capitalize">{char.gender}</span>
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: char.flameColor }} 
                    title="Exhaust flame color"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Brand Spotlight / Middle-World Skyscraper Preview */}
      <section id="sponsor" className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div 
            className="w-16 h-16 rounded-2xl border-2 p-1 bg-slate-950 shrink-0 shadow-lg flex items-center justify-center overflow-hidden"
            style={{ borderColor: config.branding.neonColor }}
          >
            {config.branding.customLogoDataUrl || config.branding.logoUrl ? (
              <img
                src={config.branding.customLogoDataUrl || config.branding.logoUrl}
                alt="Brand Sponsor Logo"
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-2xl">⚡</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Official In-Game Sponsor
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400">Middle World Skyscraper</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {config.branding.brandName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              {config.branding.tagline}. Fly past this glowing branded landmark in the heart of the cyber skyline!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {config.branding.callToActionUrl && (
            <a
              href={config.branding.callToActionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>{config.branding.callToActionLabel || 'Visit Sponsor'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={onOpenAdmin}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            Edit Branding (/admin)
          </button>
        </div>
      </section>

      {/* 3. High Scores & How to Play Grid */}
      <section id="leaderboard" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leaderboard Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Arcade High Scores</h3>
            </div>
            <span className="text-xs text-slate-500">Top Flights</span>
          </div>

          <div className="space-y-2">
            {highScores.map((entry, index) => (
              <div
                key={entry.id || index}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 font-bold font-mono ${
                    index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    #{index + 1}
                  </span>
                  <div>
                    <div className="font-bold text-white">{entry.playerName}</div>
                    <div className="text-[10px] text-slate-400">Pilot: {entry.characterName} · Lvl {entry.level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-cyan-400 font-mono-num">{entry.score} pts</div>
                  <div className="text-[10px] text-amber-300 font-mono-num">{entry.coins} coins</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Play & Controls Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Flight Directives</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 shrink-0">
                  <MousePointer className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Jetpack Continuous Propulsion</div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    <strong>HOLD</strong> click, tap the screen, or hold <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">SPACE</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">W</kbd> to fly upward. <strong>RELEASE</strong> to fall gently and run on the ground.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Safe Ground & Ceiling</div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Touching the ground lets your character run with spark dust, and the ceiling acts as a soft bumper. Neither one kills you!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-slate-800 text-rose-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Airborne Monster & Laser Dodging</div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Weave through open airspace to dodge incoming cyber drones, floating gargoyles, plasma mines, and electric laser zappers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Admin URL Access:</span>
            <code className="text-cyan-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono">
              /admin
            </code>
          </div>
        </div>
      </section>
    </div>
  );
};
