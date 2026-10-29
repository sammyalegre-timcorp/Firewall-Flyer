/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppConfig } from './types/game';
import { loadAppConfig, saveAppConfig } from './utils/defaultConfig';
import { GameCanvas } from './components/GameCanvas';
import { AdminPanel } from './components/AdminPanel';
import { usePWA } from './hooks/usePWA';
import { Download, WifiOff, X } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(loadAppConfig);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const { isOnline, isInstallable, isInstalled, isIOS, install } = usePWA();

  // Comprehensive route detection for /admin across Vercel direct links, subpaths, hash, and query params
  useEffect(() => {
    const checkRoute = () => {
      const rawPath = window.location.pathname.toLowerCase();
      const cleanPath = rawPath.replace(/\/+$/, '');
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      const isAdmin =
        cleanPath === '/admin' ||
        cleanPath.endsWith('/admin') ||
        hash === '#/admin' ||
        hash === '#admin' ||
        search.includes('admin=true') ||
        search.includes('admin=1') ||
        search === '?admin';

      setIsAdminRoute(isAdmin);
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const handleCloseAdmin = () => {
    try {
      window.history.pushState(null, '', '/');
    } catch {
      window.location.hash = '';
    }
    setIsAdminRoute(false);
  };

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    saveAppConfig(newConfig);
  };

  // If user navigated directly to /admin, render the admin dashboard
  if (isAdminRoute) {
    return (
      <AdminPanel
        config={config}
        onSaveConfig={handleSaveConfig}
        onClose={handleCloseAdmin}
      />
    );
  }

  // The main page is strictly the game (no header, no pilot selector, no sponsor card, no highscores, no admin links)
  return (
    <div className="relative min-h-screen w-full bg-[#04060f] flex flex-col items-center justify-center p-0 sm:p-4 overflow-hidden">
      
      {/* Offline Mode Status Banner (Non-intrusive floating indicator) */}
      {!isOnline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fadeIn">
          <div className="bg-amber-950/90 backdrop-blur-md border border-amber-500/50 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-amber-200 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Offline Mode &bull; Playing from cached storage</span>
          </div>
        </div>
      )}

      {/* PWA In-App Install Chip (Visible only when app is installable and not in standalone mode) */}
      {!isInstalled && (isInstallable || isIOS) && (
        <div className="fixed bottom-3 right-3 z-40">
          {isInstallable ? (
            <button
              onClick={install}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:text-white text-xs font-semibold backdrop-blur-md shadow-lg transition-all cursor-pointer transform hover:scale-105"
              title="Install game for offline play"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-amber-300 hover:text-white text-xs font-semibold backdrop-blur-md shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install on iOS</span>
            </button>
          ) : null}
        </div>
      )}

      {/* iOS Installation Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              Install on iPhone or iPad
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Play full-screen with offline support:
            </p>
            <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 mb-5">
              <li>Tap the <strong className="text-cyan-400">Share</strong> icon at the bottom of Safari.</li>
              <li>Scroll down and select <strong className="text-amber-400">Add to Home Screen</strong>.</li>
              <li>Launch from your home screen for full offline flight!</li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Main Game Frame */}
      <div className="w-full max-w-5xl h-screen sm:h-[92vh] sm:max-h-[850px] flex flex-col">
        <GameCanvas config={config} />
      </div>
    </div>
  );
}
