import React from 'react';
import { Gamepad2 } from 'lucide-react';

interface TopBarProps {
  onOpenAdmin: () => void;
  onScrollTo: (elementId: string) => void;
  brandName: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenAdmin, onScrollTo, brandName }) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/80 bg-[#080914]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <a 
        href="#" 
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="text-lg font-black tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
      >
        <Gamepad2 className="w-5 h-5 text-cyan-400" />
        <span>NEON GLIDE</span>
      </a>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
        <a 
          href="#game" 
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
        >
          Arcade
        </a>
        <a 
          href="#pilots" 
          onClick={(e) => {
            e.preventDefault();
            onScrollTo('pilots');
          }}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
        >
          Pilots
        </a>
        <a 
          href="#sponsor" 
          onClick={(e) => {
            e.preventDefault();
            onScrollTo('sponsor');
          }}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
        >
          Sponsor
        </a>
        <a 
          href="#leaderboard" 
          onClick={(e) => {
            e.preventDefault();
            onScrollTo('leaderboard');
          }}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
        >
          Scores
        </a>
        <a 
          href="/admin" 
          onClick={(e) => {
            e.preventDefault();
            onOpenAdmin();
          }}
          className="text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0 font-mono"
        >
          /admin
        </a>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenAdmin}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          Admin Panel
        </button>
      </div>
    </header>
  );
};
