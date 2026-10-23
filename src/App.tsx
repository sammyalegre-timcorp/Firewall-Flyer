/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppConfig } from './types/game';
import { loadAppConfig, saveAppConfig } from './utils/defaultConfig';
import { GameCanvas } from './components/GameCanvas';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(loadAppConfig);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Check URL pathname or hash for '/admin' strictly
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const isAdmin = path === '/admin' || path === '/admin/' || hash === '#/admin' || hash === '#admin';
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

  // If user navigated to /admin, render the admin dashboard directly
  if (isAdminRoute) {
    return (
      <AdminPanel
        config={config}
        onSaveConfig={handleSaveConfig}
        onClose={handleCloseAdmin}
      />
    );
  }

  // The main page is ONLY the game (no header, no pilot selector, no sponsor card, no highscores, no admin links)
  return (
    <div className="min-h-screen w-full bg-[#04060f] flex flex-col items-center justify-center p-0 sm:p-4 overflow-hidden select-none">
      <div className="w-full max-w-5xl h-screen sm:h-[92vh] sm:max-h-[850px] flex flex-col">
        <GameCanvas config={config} />
      </div>
    </div>
  );
}
