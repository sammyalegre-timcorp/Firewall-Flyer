import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppConfig } from '../types/game';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Pause, Play, Zap, Sparkles } from 'lucide-react';

interface GameCanvasProps {
  config: AppConfig;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface CoinItem {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  radius: number;
  bobOffset: number;
}

interface MonsterItem {
  id: number;
  x: number;
  y: number;
  vy: number;
  radius: number;
  bobTimer: number;
  hazardType: 'monster' | 'zapper';
  zapperHeight?: number;
  passed: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ config }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isMagicTheme = config.theme === 'magic_academy';

  // UI state: READY (hovering, background moving, waiting for first click), PLAYING, PAUSED, GAME_OVER
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('READY');
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [levelUpBanner, setLevelUpBanner] = useState<string | null>(null);

  // Preloaded images
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const charImgRef = useRef<HTMLImageElement | null>(null);
  const customCoinImgRef = useRef<HTMLImageElement | null>(null);
  const snitchImgRef = useRef<HTMLImageElement | null>(null);
  const castleBgImgRef = useRef<HTMLImageElement | null>(null);

  // Mutable Game Loop State
  const stateRef = useRef({
    gameState: 'READY' as 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER',
    isThrusting: false,
    playerX: 130,
    playerY: 260,
    playerVy: 0,
    playerAngle: 0,
    hoverTimer: 0,
    cameraX: 0,
    coins: 0,
    level: 1,
    nextMonsterDist: 500,
    nextCoinGroupDist: 220,
    monsters: [] as MonsterItem[],
    coinsList: [] as CoinItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    lastFrameTime: performance.now(),
    nextId: 1,
    canvasWidth: 800,
    canvasHeight: 560,
  });

  const activeChar = config.characters.find((c) => c.id === config.selectedCharacterId) || config.characters[0];
  const activeMonster = config.monsterConfigs[config.selectedMonsterId] || config.monsterConfigs.drone;
  const activeCoin = config.coinConfigs[config.selectedCoinStyleId] || config.coinConfigs.token;

  // Load highscore (coins only)
  useEffect(() => {
    try {
      const key = isMagicTheme ? 'magic_flight_best_snitches' : 'neon_glide_best_coins';
      const raw = localStorage.getItem(key);
      if (raw) setHighScore(parseInt(raw, 10));
    } catch {}
  }, [isMagicTheme]);

  // Preload Images
  useEffect(() => {
    // 1. Logo
    const logoSrc = config.branding.customLogoDataUrl || config.branding.logoUrl;
    if (logoSrc) {
      const img = new Image();
      img.src = logoSrc;
      img.onload = () => { logoImgRef.current = img; };
    }

    // 2. Character
    const charSrc = activeChar.customUploadedImage || activeChar.avatarUrl;
    if (charSrc) {
      const img = new Image();
      img.src = charSrc;
      img.onload = () => { charImgRef.current = img; };
    } else {
      charImgRef.current = null;
    }

    // 3. Custom Coin Image
    if (config.selectedCoinStyleId === 'custom' && activeCoin.customImageDataUrl) {
      const img = new Image();
      img.src = activeCoin.customImageDataUrl;
      img.onload = () => { customCoinImgRef.current = img; };
    } else {
      customCoinImgRef.current = null;
    }

    // 4. Magic Assets
    const snitchImg = new Image();
    snitchImg.src = '/src/assets/images/magic_golden_snitch_1792723809699.jpg';
    snitchImg.onload = () => { snitchImgRef.current = snitchImg; };

    const castleImg = new Image();
    castleImg.src = '/src/assets/images/magic_castle_corridor_1792723808548.jpg';
    castleImg.onload = () => { castleBgImgRef.current = castleImg; };
  }, [config, activeChar, activeCoin]);

  // Audio background toggle sync
  useEffect(() => {
    sound.setBgm(config.settings.bgmEnabled && gameState === 'PLAYING');
    return () => {
      sound.stopBgm();
      sound.stopJetpack();
    };
  }, [config.settings.bgmEnabled, gameState]);

  // Canvas Resize observer
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      stateRef.current.canvasWidth = w;
      stateRef.current.canvasHeight = h;

      if (stateRef.current.gameState === 'READY') {
        stateRef.current.playerY = h * 0.45;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // -----------------------------------------------------------------
  // Input Handling: Hold to fly, Release to fall
  // -----------------------------------------------------------------
  const startThrust = useCallback(() => {
    if (stateRef.current.gameState === 'READY') {
      stateRef.current.gameState = 'PLAYING';
      stateRef.current.isThrusting = true;
      stateRef.current.playerVy = -3.5;
      setGameState('PLAYING');
      sound.startJetpack(config.settings.soundEnabled);
      sound.setBgm(config.settings.bgmEnabled);
      return;
    }

    if (stateRef.current.gameState === 'GAME_OVER') return;
    if (stateRef.current.gameState !== 'PLAYING') return;

    stateRef.current.isThrusting = true;
    sound.startJetpack(config.settings.soundEnabled);
  }, [config]);

  const stopThrust = useCallback(() => {
    if (stateRef.current.gameState === 'PLAYING') {
      stateRef.current.isThrusting = false;
      sound.stopJetpack();
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    startThrust();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    stopThrust();
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (!stateRef.current.isThrusting) {
          startThrust();
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        stopThrust();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startThrust, stopThrust]);

  const resetToReady = () => {
    const h = stateRef.current.canvasHeight || 560;
    stateRef.current.gameState = 'READY';
    stateRef.current.isThrusting = false;
    stateRef.current.playerX = 130;
    stateRef.current.playerY = h * 0.45;
    stateRef.current.playerVy = 0;
    stateRef.current.playerAngle = 0;
    stateRef.current.hoverTimer = 0;
    stateRef.current.coins = 0;
    stateRef.current.level = 1;
    stateRef.current.monsters = [];
    stateRef.current.coinsList = [];
    stateRef.current.particles = [];
    stateRef.current.floatingTexts = [];
    stateRef.current.nextMonsterDist = stateRef.current.cameraX + 500;
    stateRef.current.nextCoinGroupDist = stateRef.current.cameraX + 220;

    setCoinsCollected(0);
    setCurrentLevel(1);
    setIsNewHighScore(false);
    setGameState('READY');
    sound.stopJetpack();
    sound.stopBgm();
  };

  const togglePause = () => {
    if (stateRef.current.gameState === 'PLAYING') {
      stateRef.current.gameState = 'PAUSED';
      stateRef.current.isThrusting = false;
      sound.stopJetpack();
      sound.stopBgm();
      setGameState('PAUSED');
    } else if (stateRef.current.gameState === 'PAUSED') {
      stateRef.current.gameState = 'PLAYING';
      setGameState('PLAYING');
      sound.setBgm(config.settings.bgmEnabled);
    }
  };

  const triggerGameOver = () => {
    stateRef.current.gameState = 'GAME_OVER';
    stateRef.current.isThrusting = false;
    sound.stopJetpack();
    sound.stopBgm();
    sound.playHit(config.settings.soundEnabled);
    setGameState('GAME_OVER');

    const finalCoins = stateRef.current.coins;

    if (finalCoins > highScore) {
      setIsNewHighScore(true);
      setHighScore(finalCoins);
      const key = isMagicTheme ? 'magic_flight_best_snitches' : 'neon_glide_best_coins';
      try {
        localStorage.setItem(key, String(finalCoins));
      } catch {}
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: isMagicTheme ? ['#ffd700', '#f59e0b', '#c084fc'] : ['#00f0ff', '#ff007f', '#ffd700'],
      });
    }
  };

  // -----------------------------------------------------------------
  // MAIN ANIMATION LOOP
  // -----------------------------------------------------------------
  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const state = stateRef.current;
      const w = state.canvasWidth;
      const h = state.canvasHeight;
      if (w <= 0 || h <= 0) return;

      const dtMs = Math.min(time - state.lastFrameTime, 35);
      state.lastFrameTime = time;
      const dt = dtMs / 16.666;

      const floorY = h - 45; // Floor death threshold
      const ceilingY = 25;   // Soft top boundary
      const playerRadius = 18;

      const baseScrollSpeed = (config.settings.baseSpeed + (state.level - 1) * config.settings.speedIncrementPerLevel) * dt;
      state.cameraX += baseScrollSpeed;

      // -------------------------------------------------------------
      // 1. UPDATE PHYSICS (READY VS PLAYING)
      // -------------------------------------------------------------
      if (state.gameState === 'READY') {
        state.hoverTimer += 0.05 * dt;
        state.playerY = (h * 0.45) + Math.sin(state.hoverTimer) * 12;
        state.playerVy = 0;
        state.playerAngle = Math.sin(state.hoverTimer * 0.8) * 0.06;

        // Gentle idle thruster / stardust sparks
        if (Math.random() < 0.35) {
          state.particles.push({
            x: state.playerX - 18,
            y: state.playerY + 8,
            vx: -baseScrollSpeed * 0.5 - Math.random() * 2,
            vy: Math.random() * 2 + 1,
            size: Math.random() * 3 + 1.5,
            color: isMagicTheme ? '#fde047' : activeChar.flameColor,
            alpha: 0.8,
            life: 0,
            maxLife: 16,
          });
        }
      } else if (state.gameState === 'PLAYING') {
        if (state.isThrusting) {
          state.playerVy -= config.settings.thrust * dt;
          if (state.playerVy < config.settings.maxRiseSpeed) {
            state.playerVy = config.settings.maxRiseSpeed;
          }

          // Exhaust particles (Broom stardust vs Jet flame)
          const px = state.playerX - 16;
          const py = state.playerY + 8;
          for (let i = 0; i < 2; i++) {
            state.particles.push({
              x: px + (Math.random() * 4 - 2),
              y: py,
              vx: -baseScrollSpeed * 0.4 - Math.random() * 3,
              vy: Math.random() * 4 + 3,
              size: Math.random() * 4 + 2,
              color: isMagicTheme ? (i % 2 === 0 ? '#ffd700' : '#f59e0b') : (i % 2 === 0 ? activeChar.flameColor : '#fffa65'),
              alpha: 0.9,
              life: 0,
              maxLife: 20 + Math.random() * 10,
            });
          }
        } else {
          state.playerVy += config.settings.gravity * dt;
          if (state.playerVy > config.settings.maxFallSpeed) {
            state.playerVy = config.settings.maxFallSpeed;
          }
        }

        state.playerY += state.playerVy * dt;

        // CEILING CHECK: Soft limit
        if (state.playerY - playerRadius <= ceilingY) {
          state.playerY = ceilingY + playerRadius;
          state.playerVy = Math.max(0.2, state.playerVy * 0.1);
        }

        // FLOOR CHECK: Fall into floor kills player!
        if (state.playerY + playerRadius >= floorY) {
          triggerGameOver();
          return;
        }

        // Tilt angle
        const targetAngle = state.isThrusting ? -0.22 : Math.min(0.28, state.playerVy * 0.05);
        state.playerAngle += (targetAngle - state.playerAngle) * 0.18 * dt;

        // Level up every 8 coins
        const calculatedLvl = 1 + Math.floor(state.coins / 8);
        if (calculatedLvl > state.level) {
          state.level = calculatedLvl;
          setCurrentLevel(calculatedLvl);
          sound.playLevelUp(config.settings.soundEnabled);
          setLevelUpBanner(`LEVEL ${calculatedLvl} - SPEED BOOST!`);
          setTimeout(() => setLevelUpBanner(null), 1800);
        }

        // -------------------------------------------------------------
        // SPAWN MONSTERS / HAZARDS
        // -------------------------------------------------------------
        if (state.cameraX >= state.nextMonsterDist) {
          const spawnY = ceilingY + 30 + Math.random() * (floorY - ceilingY - 70);
          const isZapper = Math.random() < 0.35;

          state.monsters.push({
            id: state.nextId++,
            x: w + 50,
            y: spawnY,
            vy: (Math.random() - 0.5) * 1.5,
            radius: activeMonster.hitboxRadius,
            bobTimer: Math.random() * Math.PI * 2,
            hazardType: isZapper ? 'zapper' : 'monster',
            zapperHeight: isZapper ? Math.floor(65 + Math.random() * 40) : undefined,
            passed: false,
          });

          state.nextMonsterDist = state.cameraX + config.settings.monsterSpawnInterval + Math.random() * 80;
        }

        // Spawn Coins in wave patterns
        if (state.cameraX >= state.nextCoinGroupDist) {
          const coinPattern = Math.random();
          const baseCoinY = ceilingY + 40 + Math.random() * (floorY - ceilingY - 80);
          const numCoins = Math.floor(Math.random() * 4) + 3;

          for (let c = 0; c < numCoins; c++) {
            const coinY =
              coinPattern > 0.5
                ? baseCoinY + Math.sin(c * 0.7) * 35
                : baseCoinY + (c % 2 === 0 ? -15 : 15);

            state.coinsList.push({
              id: state.nextId++,
              x: w + 50 + c * 38,
              y: Math.max(ceilingY + 20, Math.min(floorY - 20, coinY)),
              collected: false,
              radius: 12,
              bobOffset: Math.random() * Math.PI * 2,
            });
          }

          state.nextCoinGroupDist = state.cameraX + 240 + Math.random() * 120;
        }

        // -------------------------------------------------------------
        // COLLISION WITH MONSTERS / HAZARDS ONLY
        // -------------------------------------------------------------
        for (let i = state.monsters.length - 1; i >= 0; i--) {
          const m = state.monsters[i];
          m.x -= baseScrollSpeed;

          m.bobTimer += 0.04 * dt;
          if (m.hazardType === 'monster') {
            m.y += Math.sin(m.bobTimer) * 1.2 * dt;
          }

          const hitRadius = playerRadius * 0.65;

          if (m.hazardType === 'monster') {
            const monsterCoreRadius = m.radius * 0.65;
            const dist = Math.hypot(state.playerX - m.x, state.playerY - m.y);
            if (dist < hitRadius + monsterCoreRadius) {
              triggerGameOver();
              return;
            }
          } else {
            const zH = m.zapperHeight || 70;
            const zHalf = zH / 2;
            const inZapperX = Math.abs(state.playerX - m.x) < hitRadius + 8;
            const inZapperY = state.playerY > m.y - zHalf && state.playerY < m.y + zHalf;
            if (inZapperX && inZapperY) {
              triggerGameOver();
              return;
            }
          }

          if (m.x < -100) {
            state.monsters.splice(i, 1);
          }
        }

        // -------------------------------------------------------------
        // COIN COLLECTION: PURELY COIN SCORING
        // -------------------------------------------------------------
        for (let i = state.coinsList.length - 1; i >= 0; i--) {
          const coin = state.coinsList[i];
          coin.x -= baseScrollSpeed;
          coin.bobOffset += 0.06 * dt;

          const coinY = coin.y + Math.sin(coin.bobOffset) * 3;
          const dist = Math.hypot(state.playerX - coin.x, state.playerY - coinY);

          if (!coin.collected && dist < playerRadius + coin.radius + 10) {
            coin.collected = true;
            state.coins++;
            setCoinsCollected(state.coins);
            sound.playCoin(config.settings.soundEnabled);

            for (let p = 0; p < 8; p++) {
              state.particles.push({
                x: coin.x,
                y: coinY,
                vx: Math.random() * 5 - 2.5,
                vy: Math.random() * 5 - 2.5,
                size: Math.random() * 3 + 2,
                color: isMagicTheme ? '#fde047' : activeCoin.sparkleColor,
                alpha: 1,
                life: 0,
                maxLife: 20,
              });
            }

            state.floatingTexts.push({
              x: coin.x,
              y: coinY - 12,
              text: isMagicTheme ? '+1 SNITCH' : '+1 COIN',
              color: isMagicTheme ? '#ffd700' : activeCoin.glowColor,
              alpha: 1,
              vy: -1.4,
            });
          }

          if (coin.collected || coin.x < -40) {
            state.coinsList.splice(i, 1);
          }
        }
      }

      // -------------------------------------------------------------
      // DRAW BACKGROUND: CYBER CITY SKYLINE VS GOTHIC CASTLE CORRIDOR
      // -------------------------------------------------------------
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const skyline = config.customSkyline;

      if (isMagicTheme) {
        // ==============================================================
        // HARRY POTTER / MAGIC ACADEMY CASTLE CORRIDOR THEME
        // A whole continuous stone wall with other frames, windows, & logo frame
        // ==============================================================
        const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
        wallGrad.addColorStop(0, '#101524');
        wallGrad.addColorStop(0.5, '#1e2638');
        wallGrad.addColorStop(1, '#0e1320');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, w, h);

        // Stone masonry block texture across the entire wall
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.lineWidth = 1.5;
        const blockH = 28;
        const blockW = 60;
        const wallScrollX = (state.cameraX * 0.7) % blockW;

        for (let y = 0; y < floorY; y += blockH) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();

          const rowOffset = ((y / blockH) % 2 === 0 ? 0 : blockW / 2) - wallScrollX;
          for (let x = rowOffset - blockW; x < w + blockW; x += blockW) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + blockH);
            ctx.stroke();
          }
        }

        // Top gothic ceiling rib vault arches
        ctx.strokeStyle = '#2d3a52';
        ctx.lineWidth = 3;
        for (let archX = -((state.cameraX * 0.7) % 180); archX < w + 180; archX += 180) {
          ctx.beginPath();
          ctx.moveTo(archX, 0);
          ctx.quadraticCurveTo(archX + 90, 45, archX + 180, 0);
          ctx.stroke();
        }

        // ==============================================================
        // CORRIDOR SEQUENCE: OTHER FRAMES -> WINDOWS -> LOGO FRAME (Looping)
        // ==============================================================
        const corridorLoop = 2200;
        const scrollX = state.cameraX % corridorLoop;

        for (let cycle = -1; cycle <= 1; cycle++) {
          const baseOffset = cycle * corridorLoop - scrollX;
          if (baseOffset + corridorLoop < -100 || baseOffset > w + 200) continue;

          // 1. TALL ARCHED STAINED GLASS WINDOW (at offset 120)
          const win1X = baseOffset + 120;
          if (win1X > -150 && win1X < w + 150) {
            const winW = 110;
            const winH = floorY - 110;
            const winY = 40;

            // Deep night starry sky through window
            ctx.fillStyle = '#05091c';
            ctx.fillRect(win1X, winY + 25, winW, winH - 25);
            ctx.beginPath();
            ctx.arc(win1X + winW / 2, winY + 25, winW / 2, Math.PI, 0);
            ctx.fill();

            // Stars & Moon through window
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(win1X + winW * 0.7, winY + 45, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#05091c';
            ctx.beginPath();
            ctx.arc(win1X + winW * 0.7 + 4, winY + 42, 10, 0, Math.PI * 2);
            ctx.fill();

            // Stained Glass decorative jewel tracery
            ctx.strokeStyle = '#3b4c68';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(win1X, winY + 25, winW, winH - 25);
            ctx.beginPath();
            ctx.arc(win1X + winW / 2, winY + 25, winW / 2, Math.PI, 0);
            ctx.stroke();

            // Gothic window cross bars
            ctx.beginPath();
            ctx.moveTo(win1X + winW / 2, winY);
            ctx.lineTo(win1X + winW / 2, winY + winH);
            ctx.moveTo(win1X, winY + winH * 0.5);
            ctx.lineTo(win1X + winW, winY + winH * 0.5);
            ctx.stroke();

            // Stone sill
            ctx.fillStyle = '#1c2536';
            ctx.fillRect(win1X - 8, winY + winH, winW + 16, 12);
          }

          // 2. HOGWARTS HOUSE CREST 1: HUFFLEPUFF (at offset 340)
          const frame1X = baseOffset + 340;
          if (frame1X > -140 && frame1X < w + 140) {
            const fW = 98;
            const fH = 125;
            const fY = 80;

            // Carved Honey/Dark Oak Moulding with Gold Filigree
            ctx.fillStyle = '#78350f';
            ctx.fillRect(frame1X, fY, fW, fH);
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(frame1X, fY, fW, fH);

            // Corner gold studs
            ctx.fillStyle = '#fde047';
            ctx.fillRect(frame1X + 2, fY + 2, 4, 4);
            ctx.fillRect(frame1X + fW - 6, fY + 2, 4, 4);
            ctx.fillRect(frame1X + 2, fY + fH - 6, 4, 4);
            ctx.fillRect(frame1X + fW - 6, fY + fH - 6, 4, 4);

            // Inner Velvet Canvas: Hufflepuff Canary Yellow & Midnight Black
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(frame1X + 6, fY + 6, fW - 12, fH - 12);

            // Diagonal yellow banner
            ctx.fillStyle = '#ca8a04';
            ctx.beginPath();
            ctx.moveTo(frame1X + 6, fY + 6);
            ctx.lineTo(frame1X + fW - 6, fY + 6);
            ctx.lineTo(frame1X + 6, fY + fH - 24);
            ctx.closePath();
            ctx.fill();

            // Hufflepuff Loyal Badger Crest
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 6;
            ctx.font = 'bold 28px serif';
            ctx.textAlign = 'center';
            ctx.fillText('🦡', frame1X + fW / 2, fY + 60);
            ctx.shadowBlur = 0;

            // Brass Nameplate: HUFFLEPUFF
            ctx.fillStyle = '#713f12';
            ctx.fillRect(frame1X + 10, fY + fH - 20, fW - 20, 14);
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1;
            ctx.strokeRect(frame1X + 10, fY + fH - 20, fW - 20, 14);

            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 9.5px "JetBrains Mono", serif';
            ctx.textAlign = 'center';
            ctx.fillText('HUFFLEPUFF', frame1X + fW / 2, fY + fH - 9);
          }

          // 3. WALL TORCH SCONCE (at offset 540)
          const torch1X = baseOffset + 540;
          if (torch1X > -50 && torch1X < w + 50) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(torch1X - 3, 160, 6, 26);
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(torch1X, 154, 7 + Math.sin(time * 0.02) * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(torch1X, 156, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // 4. SECOND GOTHIC WINDOW (at offset 680)
          const win2X = baseOffset + 680;
          if (win2X > -150 && win2X < w + 150) {
            const winW = 100;
            const winH = floorY - 120;
            const winY = 45;

            ctx.fillStyle = '#060b20';
            ctx.fillRect(win2X, winY + 25, winW, winH - 25);
            ctx.beginPath();
            ctx.arc(win2X + winW / 2, winY + 25, winW / 2, Math.PI, 0);
            ctx.fill();

            // Stained glass rosy tone
            ctx.strokeStyle = '#4338ca';
            ctx.lineWidth = 2;
            ctx.strokeRect(win2X, winY + 25, winW, winH - 25);
            ctx.beginPath();
            ctx.arc(win2X + winW / 2, winY + 25, winW / 2, Math.PI, 0);
            ctx.stroke();

            // Mountain silhouette through glass
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(win2X, winY + winH);
            ctx.lineTo(win2X + 40, winY + winH - 40);
            ctx.lineTo(win2X + winW, winY + winH - 10);
            ctx.lineTo(win2X + winW, winY + winH);
            ctx.closePath();
            ctx.fill();
          }

          // 5. HOGWARTS HOUSE CREST 2: GRYFFINDOR (at offset 880)
          const frame2X = baseOffset + 880;
          if (frame2X > -140 && frame2X < w + 140) {
            const fW = 98;
            const fH = 125;
            const fY = 80;

            // Carved Royal Mahogany with Gleaming Gilded Gold Moulding
            ctx.fillStyle = '#78350f';
            ctx.fillRect(frame2X, fY, fW, fH);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(frame2X, fY, fW, fH);

            // Corner gold rosettes
            ctx.fillStyle = '#fde047';
            ctx.fillRect(frame2X + 2, fY + 2, 4, 4);
            ctx.fillRect(frame2X + fW - 6, fY + 2, 4, 4);
            ctx.fillRect(frame2X + 2, fY + fH - 6, 4, 4);
            ctx.fillRect(frame2X + fW - 6, fY + fH - 6, 4, 4);

            // Inner Velvet Canvas: Deep Crimson & Gold Trim
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(frame2X + 6, fY + 6, fW - 12, fH - 12);

            // Golden diagonal slash
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.moveTo(frame2X + 6, fY + 6);
            ctx.lineTo(frame2X + fW - 6, fY + 6);
            ctx.lineTo(frame2X + 6, fY + fH - 24);
            ctx.closePath();
            ctx.fill();

            // Gryffindor Brave Lion Crest
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 6;
            ctx.font = 'bold 28px serif';
            ctx.textAlign = 'center';
            ctx.fillText('🦁', frame2X + fW / 2, fY + 60);
            ctx.shadowBlur = 0;

            // Brass Nameplate: GRYFFINDOR
            ctx.fillStyle = '#831843';
            ctx.fillRect(frame2X + 10, fY + fH - 20, fW - 20, 14);
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1;
            ctx.strokeRect(frame2X + 10, fY + fH - 20, fW - 20, 14);

            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 9.5px "JetBrains Mono", serif';
            ctx.textAlign = 'center';
            ctx.fillText('GRYFFINDOR', frame2X + fW / 2, fY + fH - 9);
          }

          // ==============================================================
          // 6. THE GRAND CENTERPIECE ORNATE GOLDEN FRAME FOR THE LOGO!
          // (At offset 1150, MUCH BIGGER with double wall torches!)
          // ==============================================================
          const logoFrameX = baseOffset + 1150;
          if (logoFrameX > -380 && logoFrameX < w + 380) {
            const frameW = 320;
            const frameH = 210;
            const frameY = 55;

            // Grand Wall Backing / Arch Column behind frame
            ctx.fillStyle = '#182030';
            ctx.fillRect(logoFrameX - 25, 25, frameW + 50, floorY - 25);
            ctx.strokeStyle = '#2f3d54';
            ctx.lineWidth = 3;
            ctx.strokeRect(logoFrameX - 25, 25, frameW + 50, floorY - 25);

            // Double Medieval Torches flanking the logo frame
            const leftTorchX = logoFrameX - 12;
            const rightTorchX = logoFrameX + frameW + 12;
            const torchY = frameY + 70;

            [leftTorchX, rightTorchX].forEach((tx) => {
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(tx - 4, torchY, 8, 28);
              ctx.fillStyle = '#f97316';
              ctx.beginPath();
              ctx.arc(tx, torchY - 8, 9 + Math.sin(time * 0.02) * 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(tx, torchY - 6, 4.5, 0, Math.PI * 2);
              ctx.fill();
            });

            // Outer Carved Gold Baroque Gilded Frame
            ctx.fillStyle = '#b45309';
            ctx.fillRect(logoFrameX - 10, frameY - 10, frameW + 20, frameH + 20);
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 4.5;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 14;
            ctx.strokeRect(logoFrameX - 10, frameY - 10, frameW + 20, frameH + 20);
            ctx.shadowBlur = 0; // reset

            // Ornate Corner Crown Carvings
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(logoFrameX - 16, frameY - 16, 14, 14);
            ctx.fillRect(logoFrameX + frameW + 2, frameY - 16, 14, 14);
            ctx.fillRect(logoFrameX - 16, frameY + frameH + 2, 14, 14);
            ctx.fillRect(logoFrameX + frameW + 2, frameY + frameH + 2, 14, 14);

            // Heraldic Top Crest Flourish
            ctx.beginPath();
            ctx.moveTo(logoFrameX + frameW / 2 - 35, frameY - 10);
            ctx.lineTo(logoFrameX + frameW / 2, frameY - 32);
            ctx.lineTo(logoFrameX + frameW / 2 + 35, frameY - 10);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fde047';
            ctx.stroke();

            // Inner Portrait Canvas
            ctx.fillStyle = '#121216';
            ctx.fillRect(logoFrameX, frameY, frameW, frameH);

            // USER'S LOGO (BIG & PROMINENT INSIDE THE GOLDEN FRAME)
            const logoSize = 100;
            const lx = logoFrameX + (frameW - logoSize) / 2;
            const ly = frameY + 20;

            if (logoImgRef.current && logoImgRef.current.complete) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(logoImgRef.current, lx, ly, logoSize, logoSize);
              ctx.restore();

              // Gilded glowing rim
              ctx.strokeStyle = '#fde047';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2 + 2, 0, Math.PI * 2);
              ctx.stroke();
            } else {
              ctx.fillStyle = '#fbbf24';
              ctx.font = 'bold 40px serif';
              ctx.textAlign = 'center';
              ctx.fillText('⚡', logoFrameX + frameW / 2, ly + 68);
            }

            // Gilded Brass Plaque with Brand Name
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 16px "Outfit", serif';
            ctx.textAlign = 'center';
            ctx.fillText(config.branding.brandName || 'MAGIC ACADEMY', logoFrameX + frameW / 2, frameY + 152);

            ctx.fillStyle = '#f59e0b';
            ctx.font = '700 10.5px "JetBrains Mono", monospace';
            ctx.fillText(config.branding.tagline || 'HOUSE OF WONDERS', logoFrameX + frameW / 2, frameY + 175);
          }

          // 7. HOGWARTS HOUSE CREST 3: SLYTHERIN (at offset 1600)
          const frame3X = baseOffset + 1600;
          if (frame3X > -140 && frame3X < w + 140) {
            const fW = 98;
            const fH = 125;
            const fY = 80;

            // Dark Obsidian Serpentine Frame with Polished Silver Trim
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(frame3X, fY, fW, fH);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(frame3X, fY, fW, fH);

            // Corner silver studs
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(frame3X + 2, fY + 2, 4, 4);
            ctx.fillRect(frame3X + fW - 6, fY + 2, 4, 4);
            ctx.fillRect(frame3X + 2, fY + fH - 6, 4, 4);
            ctx.fillRect(frame3X + fW - 6, fY + fH - 6, 4, 4);

            // Inner Velvet Canvas: Deep Emerald Green & Silver Slash
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(frame3X + 6, fY + 6, fW - 12, fH - 12);

            // Emerald darker shadow
            ctx.fillStyle = '#022c22';
            ctx.beginPath();
            ctx.moveTo(frame3X + 6, fY + 6);
            ctx.lineTo(frame3X + fW - 6, fY + 6);
            ctx.lineTo(frame3X + 6, fY + fH - 24);
            ctx.closePath();
            ctx.fill();

            // Slytherin Mystic Serpent Crest
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 6;
            ctx.font = 'bold 28px serif';
            ctx.textAlign = 'center';
            ctx.fillText('🐍', frame3X + fW / 2, fY + 60);
            ctx.shadowBlur = 0;

            // Silver Nameplate: SLYTHERIN
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(frame3X + 10, fY + fH - 20, fW - 20, 14);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.strokeRect(frame3X + 10, fY + fH - 20, fW - 20, 14);

            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 9.5px "JetBrains Mono", serif';
            ctx.textAlign = 'center';
            ctx.fillText('SLYTHERIN', frame3X + fW / 2, fY + fH - 9);
          }

          // 8. THIRD GOTHIC CATHEDRAL WINDOW (at offset 1820)
          const win3X = baseOffset + 1820;
          if (win3X > -150 && win3X < w + 150) {
            const winW = 105;
            const winH = floorY - 115;
            const winY = 42;

            ctx.fillStyle = '#040817';
            ctx.fillRect(win3X, winY + 25, winW, winH - 25);
            ctx.beginPath();
            ctx.arc(win3X + winW / 2, winY + 25, winW / 2, Math.PI, 0);
            ctx.fill();

            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2;
            ctx.strokeRect(win3X, winY + 25, winW, winH - 25);
            ctx.beginPath();
            ctx.arc(win3X + winW / 2, winY + 25, winW / 2, Math.PI, 0);
            ctx.stroke();
          }

          // 9. HOGWARTS HOUSE CREST 4: RAVENCLAW (at offset 2020)
          const frame4X = baseOffset + 2020;
          if (frame4X > -140 && frame4X < w + 140) {
            const fW = 98;
            const fH = 125;
            const fY = 80;

            // Deep Walnut Wood with Bronze & Sapphire Trim
            ctx.fillStyle = '#451a03';
            ctx.fillRect(frame4X, fY, fW, fH);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(frame4X, fY, fW, fH);

            // Corner bronze studs
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(frame4X + 2, fY + 2, 4, 4);
            ctx.fillRect(frame4X + fW - 6, fY + 2, 4, 4);
            ctx.fillRect(frame4X + 2, fY + fH - 6, 4, 4);
            ctx.fillRect(frame4X + fW - 6, fY + fH - 6, 4, 4);

            // Inner Velvet Canvas: Midnight Sapphire Blue & Bronze
            ctx.fillStyle = '#082f49';
            ctx.fillRect(frame4X + 6, fY + 6, fW - 12, fH - 12);

            // Sapphire deeper tone
            ctx.fillStyle = '#172554';
            ctx.beginPath();
            ctx.moveTo(frame4X + 6, fY + 6);
            ctx.lineTo(frame4X + fW - 6, fY + 6);
            ctx.lineTo(frame4X + 6, fY + fH - 24);
            ctx.closePath();
            ctx.fill();

            // Ravenclaw Wise Eagle Crest
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 6;
            ctx.font = 'bold 28px serif';
            ctx.textAlign = 'center';
            ctx.fillText('🦅', frame4X + fW / 2, fY + 60);
            ctx.shadowBlur = 0;

            // Bronze Nameplate: RAVENCLAW
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(frame4X + 10, fY + fH - 20, fW - 20, 14);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.strokeRect(frame4X + 10, fY + fH - 20, fW - 20, 14);

            ctx.fillStyle = '#bae6fd';
            ctx.font = 'bold 9.5px "JetBrains Mono", serif';
            ctx.textAlign = 'center';
            ctx.fillText('RAVENCLAW', frame4X + fW / 2, fY + fH - 9);
          }
        }

        // ==============================================================
        // FLOATING ENCHANTED CANDLES: MOVING RIGHT TO LEFT!
        // "also change the way the candles move, it should move from right to left."
        // ==============================================================
        const candleSpacing = 160;
        const candleSpeedFactor = 0.95; // Moves from right to left with corridor flight
        const candleMinWorldX = state.cameraX * candleSpeedFactor - 80;
        const candleMaxWorldX = state.cameraX * candleSpeedFactor + w + 80;
        const startCandleIdx = Math.floor(candleMinWorldX / candleSpacing);
        const endCandleIdx = Math.ceil(candleMaxWorldX / candleSpacing);

        for (let ci = startCandleIdx; ci <= endCandleIdx; ci++) {
          const cx = ci * candleSpacing - state.cameraX * candleSpeedFactor;
          // Deterministic seed per candle index so it never pops while scrolling across
          const seed = Math.sin(ci * 77.13) * 10000;
          const pseudoRand = seed - Math.floor(seed);
          const cy = 38 + pseudoRand * 48 + Math.sin(time * 0.003 + ci) * 7;

          // Candle body
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(cx - 3, cy, 6, 22);

          // Golden wax dripping lines
          ctx.fillStyle = '#fde68a';
          ctx.fillRect(cx - 4, cy + 3, 2, 6);

          // Warm candle glow aura
          const glowGrad = ctx.createRadialGradient(cx, cy - 4, 1, cx, cy - 4, 18);
          glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(cx, cy - 4, 18, 0, Math.PI * 2);
          ctx.fill();

          // Golden flame with gentle flicker
          const flicker = Math.sin(time * 0.025 + ci * 2) * 1.5;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(cx, cy - 5, 4.5 + flicker, 0, Math.PI * 2);
          ctx.fill();

          // White-hot core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy - 4, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // ==============================================================
        // RETRO CYBER ARCADE THEME
        // ==============================================================
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, skyline.skyTop);
        skyGrad.addColorStop(0.7, skyline.skyBottom);
        skyGrad.addColorStop(1, '#050713');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Synthwave Sun
        const sunY = h * 0.22;
        const sunX = w * 0.5;
        const sunRadius = 46;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, sunRadius);
        sunGrad.addColorStop(0, '#fff4cc');
        sunGrad.addColorStop(0.4, '#ff007f');
        sunGrad.addColorStop(0.9, '#7928ca');
        sunGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        for (let s = 0; s < 5; s++) {
          const lineY = sunY + 6 + s * 7;
          ctx.fillRect(sunX - sunRadius, lineY, sunRadius * 2, 1 + s * 0.9);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        for (let st = 0; st < 30; st++) {
          const sx = (st * 97) % w;
          const sy = (st * 43) % (h * 0.42);
          ctx.fillRect(sx, sy, st % 4 === 0 ? 2 : 1, st % 4 === 0 ? 2 : 1);
        }

        // Far Skyline
        ctx.fillStyle = skyline.backBuildings;
        const farLoopW = 1200;
        const farScroll = (state.cameraX * 0.2) % farLoopW;
        for (let fx = -farScroll; fx < w + farLoopW; fx += 80) {
          const bh = 140 + Math.sin(fx * 0.15) * 55;
          ctx.fillRect(fx, floorY - bh, 76, bh);
        }

        // Looping Midground Skyline with BIG LOGO BUILDING
        const loopWidth = 1800;
        const scrollOffset = state.cameraX % loopWidth;

        for (let cycle = -1; cycle <= 1; cycle++) {
          const cycleBaseX = cycle * loopWidth - scrollOffset;
          if (cycleBaseX + loopWidth < -100 || cycleBaseX > w + 200) continue;

          const buildingLayout = [
            { relX: 40, w: 90, h: 220 },
            { relX: 150, w: 110, h: 180 },
            { relX: 280, w: 95, h: 260 },
            { relX: 395, w: 120, h: 190 },
            { relX: 580, w: 310, h: floorY * 0.85, isLogoBuilding: true },
            { relX: 920, w: 100, h: 210 },
            { relX: 1040, w: 130, h: 270 },
            { relX: 1190, w: 90, h: 175 },
            { relX: 1300, w: 120, h: 240 },
            { relX: 1440, w: 105, h: 200 },
            { relX: 1565, w: 120, h: 260 },
            { relX: 1705, w: 85, h: 190 },
          ];

          buildingLayout.forEach((b) => {
            const bx = cycleBaseX + b.relX;
            if (bx + b.w < -50 || bx > w + 50) return;

            if (b.isLogoBuilding) {
              const bY = floorY - b.h;
              const bGrad = ctx.createLinearGradient(bx, 0, bx + b.w, 0);
              bGrad.addColorStop(0, '#090c24');
              bGrad.addColorStop(0.5, '#161c47');
              bGrad.addColorStop(1, '#090c24');
              ctx.fillStyle = bGrad;
              ctx.fillRect(bx, bY, b.w, b.h);

              ctx.strokeStyle = config.branding.neonColor;
              ctx.lineWidth = 3;
              ctx.strokeRect(bx + 1, bY, b.w - 2, b.h);

              // Antenna
              ctx.strokeStyle = config.branding.accentColor;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(bx + b.w / 2, bY);
              ctx.lineTo(bx + b.w / 2, bY - 45);
              ctx.stroke();

              // Big Billboard & Much Bigger Logo
              const boardW = b.w - 30;
              const boardH = 175;
              const boardX = bx + 15;
              const boardY = bY + 25;

              ctx.fillStyle = 'rgba(5, 7, 22, 0.95)';
              ctx.fillRect(boardX, boardY, boardW, boardH);
              ctx.strokeStyle = config.branding.neonColor;
              ctx.lineWidth = 2.5;
              ctx.shadowColor = config.branding.neonColor;
              ctx.shadowBlur = 14;
              ctx.strokeRect(boardX, boardY, boardW, boardH);
              ctx.shadowBlur = 0;

              const logoSize = 100;
              const lx = boardX + (boardW - logoSize) / 2;
              const ly = boardY + 12;

              if (logoImgRef.current && logoImgRef.current.complete) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(logoImgRef.current, lx, ly, logoSize, logoSize);
                ctx.restore();

                ctx.strokeStyle = config.branding.neonColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2 + 1, 0, Math.PI * 2);
                ctx.stroke();
              } else {
                ctx.fillStyle = config.branding.accentColor;
                ctx.font = 'bold 36px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('⚡', boardX + boardW / 2, ly + 62);
              }

              ctx.fillStyle = config.branding.billboardTextColor || '#ffffff';
              ctx.font = 'bold 15px "Outfit", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(config.branding.brandName || 'CYBERNETIX', boardX + boardW / 2, boardY + 138);

              ctx.fillStyle = config.branding.neonColor;
              ctx.font = '700 10px "JetBrains Mono", monospace';
              ctx.fillText(config.branding.tagline || 'FUTURE TECH LABS', boardX + boardW / 2, boardY + 158);
            } else {
              ctx.fillStyle = skyline.frontBuildings;
              ctx.fillRect(bx, floorY - b.h, b.w, b.h);
              ctx.fillStyle = skyline.neonTrim;
              ctx.fillRect(bx, floorY - b.h, b.w, 3);
            }
          });
        }
      }

      // -------------------------------------------------------------
      // DRAW HAZARDS / MONSTERS
      // -------------------------------------------------------------
      state.monsters.forEach((m) => {
        ctx.save();
        ctx.translate(m.x, m.y);

        if (m.hazardType === 'monster') {
          const r = m.radius;

          if (isMagicTheme || activeMonster.id === 'bludger') {
            // Cursed Iron Bludger (spiked dark enchanted quidditch ball with red runes)
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Glowing red runes
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 12px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', 0, 0);

            // Spikes
            for (let sp = 0; sp < 6; sp++) {
              const ang = (sp * Math.PI) / 3 + time * 0.01;
              ctx.strokeStyle = '#ef4444';
              ctx.beginPath();
              ctx.moveTo(Math.cos(ang) * (r * 0.8), Math.sin(ang) * (r * 0.8));
              ctx.lineTo(Math.cos(ang) * (r * 1.2), Math.sin(ang) * (r * 1.2));
              ctx.stroke();
            }
          } else if (activeMonster.id === 'dementor') {
            // Floating Dementor
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(0, -6, r * 0.65, 0, Math.PI * 2);
            ctx.fill();
            // Cloak
            ctx.beginPath();
            ctx.moveTo(-r * 0.6, -6);
            ctx.lineTo(-r * 0.9, r);
            ctx.lineTo(r * 0.9, r);
            ctx.lineTo(r * 0.6, -6);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            // Cyber Sentinel Drone
            ctx.fillStyle = activeMonster.secondaryColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = activeMonster.primaryColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            const bladeAngle = time * 0.03;
            ctx.save();
            ctx.rotate(bladeAngle);
            ctx.strokeStyle = activeMonster.glowColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-r * 1.3, 0);
            ctx.lineTo(r * 1.3, 0);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = activeMonster.hazardColor;
            ctx.beginPath();
            ctx.arc(Math.sin(time * 0.01) * 4, 0, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Zapper / Cursed Lightning Arc Hazard
          const zH = m.zapperHeight || 70;
          const halfH = zH / 2;

          ctx.fillStyle = isMagicTheme ? '#78350f' : '#1e293b';
          ctx.beginPath();
          ctx.arc(0, -halfH, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isMagicTheme ? '#f59e0b' : '#f43f5e';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, halfH, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          const laserColor = isMagicTheme ? '#fbbf24' : '#f43f5e';
          ctx.strokeStyle = laserColor;
          ctx.lineWidth = 3;
          ctx.shadowColor = laserColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -halfH + 8);
          const midArc = (Math.random() - 0.5) * 6;
          ctx.lineTo(midArc, 0);
          ctx.lineTo(0, halfH - 8);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });

      // -------------------------------------------------------------
      // DRAW COINS / GOLDEN SNITCHES
      // -------------------------------------------------------------
      state.coinsList.forEach((coin) => {
        const coinY = coin.y + Math.sin(coin.bobOffset) * 3;
        const r = coin.radius;

        ctx.save();
        ctx.translate(coin.x, coinY);

        if (isMagicTheme) {
          // GOLDEN SNITCH (with flapping silver wings!)
          const wingFlap = Math.sin(time * 0.04 + coin.bobOffset) * 0.8;

          // Left Wing
          ctx.save();
          ctx.rotate(-wingFlap * 0.5);
          ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-14, -6, 12, 4, -0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Right Wing
          ctx.save();
          ctx.rotate(wingFlap * 0.5);
          ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
          ctx.beginPath();
          ctx.ellipse(14, -6, 12, 4, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Golden Sphere Body
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Gleam
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-2, -2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (activeCoin.id === 'custom' && customCoinImgRef.current && customCoinImgRef.current.complete) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(customCoinImgRef.current, -r, -r, r * 2, r * 2);
          ctx.restore();

          ctx.strokeStyle = activeCoin.glowColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = activeCoin.primaryColor;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#fef3c7';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', 0, 1);
        }

        ctx.restore();
      });

      // -------------------------------------------------------------
      // DRAW PARTICLES & FLOATING TEXTS
      // -------------------------------------------------------------
      for (let pIdx = state.particles.length - 1; pIdx >= 0; pIdx--) {
        const pt = state.particles[pIdx];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.5, pt.size * pt.alpha), 0, Math.PI * 2);
        ctx.fill();

        if (pt.life >= pt.maxLife) {
          state.particles.splice(pIdx, 1);
        }
      }
      ctx.globalAlpha = 1.0;

      for (let fIdx = state.floatingTexts.length - 1; fIdx >= 0; fIdx--) {
        const ft = state.floatingTexts[fIdx];
        ft.y += ft.vy;
        ft.alpha -= 0.025;

        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);

        if (ft.alpha <= 0) {
          state.floatingTexts.splice(fIdx, 1);
        }
      }
      ctx.globalAlpha = 1.0;

      // -------------------------------------------------------------
      // DRAW FLYING CHARACTER: BROOMSTICK VS JETPACK
      // -------------------------------------------------------------
      ctx.save();
      ctx.translate(state.playerX, state.playerY);
      ctx.rotate(state.playerAngle);

      if (isMagicTheme || activeChar.flightType === 'broomstick') {
        // ==============================================================
        // FLYING ON A WOODEN BROOMSTICK! (Harry Potter Style)
        // Full-body person riding the broom with billowing robes & wand
        // ==============================================================
        const broomWood = activeChar.broomstickColor || '#78350f';
        const isGirl = activeChar.gender === 'girl';
        const robeWave = Math.sin(time * 0.05) * 3.5;
        const scarfWave = Math.sin(time * 0.08) * 4;

        // 1. Billowing Wizard Cloak / Robes (Back Layer trailing in wind)
        ctx.fillStyle = activeChar.suitColor || '#1e1b4b';
        ctx.beginPath();
        ctx.moveTo(-4, -10);
        ctx.quadraticCurveTo(-20, -12 + robeWave * 0.5, -36, -4 + robeWave);
        ctx.lineTo(-30, 10 + robeWave * 0.8);
        ctx.quadraticCurveTo(-16, 8, -4, 5);
        ctx.closePath();
        ctx.fill();

        // Inner silk lining trim showing along cloak edge
        ctx.strokeStyle = activeChar.flameColor || '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-36, -4 + robeWave);
        ctx.lineTo(-30, 10 + robeWave * 0.8);
        ctx.stroke();

        // 2. The Broomstick (Polished wood handle & golden bristle tail)
        ctx.strokeStyle = broomWood;
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-30, 10);
        ctx.lineTo(26, -2);
        ctx.stroke();

        // Straw/Twig Tail Bristles
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(-22, 9);
        ctx.lineTo(-46, 17);
        ctx.lineTo(-44, 4);
        ctx.closePath();
        ctx.fill();

        // Twig fiber detail lines
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-24, 8);
        ctx.lineTo(-44, 11);
        ctx.moveTo(-24, 10);
        ctx.lineTo(-45, 14);
        ctx.stroke();

        // Double Gold Bristle Bands
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-24, 6);
        ctx.lineTo(-24, 13);
        ctx.moveTo(-27, 7);
        ctx.lineTo(-27, 14);
        ctx.stroke();

        // Trailing magical stardust / sparks from broom tail
        if (state.isThrusting || state.gameState === 'READY') {
          const magicSparks = state.isThrusting ? 20 : 10;
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(-45 - Math.random() * magicSparks, 10 + (Math.random() * 8 - 4), 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = activeChar.flameColor || '#f59e0b';
          ctx.beginPath();
          ctx.arc(-42 - Math.random() * (magicSparks * 0.7), 11 + (Math.random() * 6 - 3), 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Rider's Legs & Boots (Seated astride the broom)
        // School trousers / tights
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.moveTo(-4, 4);
        ctx.lineTo(8, 5); // Thigh forward along broom
        ctx.lineTo(4, 12); // Calf down
        ctx.lineTo(-1, 10);
        ctx.closePath();
        ctx.fill();

        // Dark riding boot with brass buckle
        ctx.fillStyle = '#291c10';
        ctx.beginPath();
        ctx.ellipse(3, 12, 5, 2.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24'; // Boot buckle
        ctx.fillRect(1, 10.5, 2.5, 2);

        // Broom footrest pedal
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(3, 10);
        ctx.lineTo(3, 14);
        ctx.stroke();

        // 4. Rider's Torso & School Jumper (Leaning forward in flight)
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.moveTo(-4, 4);
        ctx.lineTo(-3, -10);
        ctx.lineTo(5, -12);
        ctx.lineTo(10, -5);
        ctx.lineTo(5, 5);
        ctx.closePath();
        ctx.fill();

        // White collared shirt peek
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(5, -12);
        ctx.lineTo(7, -8);
        ctx.lineTo(9, -11);
        ctx.closePath();
        ctx.fill();

        // House Crest on chest
        ctx.fillStyle = activeChar.flameColor || '#f59e0b';
        ctx.beginPath();
        ctx.arc(4, -6, 2, 0, Math.PI * 2);
        ctx.fill();

        // 5. Flowing House Scarf (Trailing in the wind)
        ctx.fillStyle = activeChar.flameColor || '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(2, -12);
        ctx.lineTo(9, -11);
        ctx.lineTo(7, -8);
        ctx.lineTo(1, -9);
        ctx.closePath();
        ctx.fill();

        // Scarf tail waving backward
        ctx.fillStyle = activeChar.flameColor || '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(1, -10);
        ctx.quadraticCurveTo(-14, -12 + scarfWave * 0.5, -26, -8 + scarfWave);
        ctx.lineTo(-24, -3 + scarfWave);
        ctx.quadraticCurveTo(-12, -7, 2, -8);
        ctx.closePath();
        ctx.fill();

        // Scarf contrasting house stripes
        ctx.strokeStyle = isGirl ? '#047857' : '#b91c1c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-8, -10 + scarfWave * 0.2);
        ctx.lineTo(-8, -6 + scarfWave * 0.2);
        ctx.moveTo(-16, -10 + scarfWave * 0.5);
        ctx.lineTo(-16, -5 + scarfWave * 0.5);
        ctx.stroke();

        // Scarf gold fringes at tip
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-26, -8 + scarfWave);
        ctx.lineTo(-29, -7 + scarfWave);
        ctx.moveTo(-25, -5 + scarfWave);
        ctx.lineTo(-28, -4 + scarfWave);
        ctx.stroke();

        // 6. Rear Arm (Gloved hand gripping broom handle)
        ctx.strokeStyle = activeChar.suitColor || '#1e1b4b';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-1, -8);
        ctx.lineTo(1, -2);
        ctx.lineTo(6, 1);
        ctx.stroke();

        // Leather riding glove on broom
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(6, 1, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 7. Forward Arm (Reaching forward casting with Magic Wand)
        ctx.strokeStyle = activeChar.suitColor || '#1e1b4b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(6, -8);
        ctx.lineTo(12, -7);
        ctx.lineTo(18, -8);
        ctx.stroke();

        // Outstretched casting hand
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(18, -8, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Carved Magic Wand
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(18, -8);
        ctx.lineTo(30, -14);
        ctx.stroke();

        // Wand Tip Magical Starlight
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(30, -14, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing magical aura from wand
        const wandGlow = ctx.createRadialGradient(30, -14, 0, 30, -14, 8);
        wandGlow.addColorStop(0, 'rgba(253, 224, 71, 0.7)');
        wandGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = wandGlow;
        ctx.beginPath();
        ctx.arc(30, -14, 8, 0, Math.PI * 2);
        ctx.fill();

        // Magic spark glyph
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', 31, -14);

        // 8. Head & Face (Determined expression looking forward)
        // Neck & Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(7, -16, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Determined eye focused ahead
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(9.5, -16, 1.2, 0, Math.PI * 2);
        ctx.fill();

        if (isGirl) {
          // ==========================================
          // WITCH: Pointed Witch Hat + Billowing Hair
          // ==========================================
          // Billowing hair flowing behind in the wind
          ctx.fillStyle = activeChar.hairColor;
          ctx.beginPath();
          ctx.moveTo(4, -18);
          ctx.quadraticCurveTo(-8, -16 + robeWave * 0.4, -18, -8 + robeWave);
          ctx.quadraticCurveTo(-6, -10, 4, -13);
          ctx.closePath();
          ctx.fill();

          // Pointed Witch Hat Brim
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.ellipse(7, -18, 11, 3.5, -0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#312e81';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Hat Cone curving backward dynamically
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.moveTo(2, -19);
          ctx.quadraticCurveTo(0, -28, -6, -34); // Hooked tip
          ctx.quadraticCurveTo(4, -28, 11, -19);
          ctx.closePath();
          ctx.fill();

          // Gold Hat Band & Buckle
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(3, -20);
          ctx.lineTo(10, -20);
          ctx.stroke();

          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(5.5, -21.5, 3, 3);
        } else {
          // ==========================================
          // WIZARD: Tousled Flying Hair + Spectacles
          // ==========================================
          // Tousled windblown wizard hair
          ctx.fillStyle = activeChar.hairColor;
          ctx.beginPath();
          ctx.arc(6, -17.5, 6, 0, Math.PI * 2);
          ctx.fill();

          // Windblown hair tufts streaming back
          ctx.beginPath();
          ctx.moveTo(4, -20);
          ctx.lineTo(-6, -21 + robeWave * 0.3);
          ctx.lineTo(2, -16);
          ctx.moveTo(3, -17);
          ctx.lineTo(-7, -15 + robeWave * 0.3);
          ctx.lineTo(3, -13);
          ctx.fill();

          // Round Wizard Spectacles (Harry Potter style)
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(9.5, -16, 3, 0, Math.PI * 2);
          ctx.stroke();

          // Glass glint reflection
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.beginPath();
          ctx.arc(8.5, -17, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // ==============================================================
        // JETPACK AVIATOR FLIGHT
        // ==============================================================
        const jpW = 12;
        const jpH = 22;
        ctx.fillStyle = activeChar.jetpackColor;
        ctx.fillRect(-18, -jpH / 2 + 2, jpW, jpH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-18, -jpH / 2 + 2, jpW, jpH);

        if (state.isThrusting || state.gameState === 'READY') {
          const flameLength = state.isThrusting ? 16 + Math.random() * 10 : 8 + Math.random() * 4;
          ctx.fillStyle = activeChar.flameColor;
          ctx.beginPath();
          ctx.moveTo(-18, -2);
          ctx.lineTo(-18 - flameLength, 5);
          ctx.lineTo(-18, 12);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(-18 - flameLength * 0.6, 5);
          ctx.lineTo(-18, 10);
          ctx.closePath();
          ctx.fill();
        }

        if (charImgRef.current && charImgRef.current.complete) {
          const pSize = 36;
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, pSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(charImgRef.current, -pSize / 2, -pSize / 2, pSize, pSize);
          ctx.restore();

          ctx.strokeStyle = activeChar.visorColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, pSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = activeChar.hairColor;
          ctx.beginPath();
          ctx.arc(0, -6, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = activeChar.suitColor;
          ctx.fillRect(-8, 3, 16, 16);

          ctx.fillStyle = activeChar.visorColor;
          ctx.fillRect(0, -7, 12, 6);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(0, -7, 12, 6);
        }
      }

      ctx.restore();

      // -------------------------------------------------------------
      // CEILING & DANGEROUS GROUND LASER / FLOOR
      // -------------------------------------------------------------
      ctx.fillStyle = isMagicTheme ? '#1e1b4b' : '#0a0d24';
      ctx.fillRect(0, 0, w, ceilingY);
      ctx.strokeStyle = isMagicTheme ? '#f59e0b' : skyline.neonTrim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, ceilingY);
      ctx.lineTo(w, ceilingY);
      ctx.stroke();

      // Ground Floor
      ctx.fillStyle = isMagicTheme ? '#0f172a' : '#08000f';
      ctx.fillRect(0, floorY, w, h - floorY);

      // Hazard line
      ctx.strokeStyle = isMagicTheme ? '#f59e0b' : '#f43f5e';
      ctx.lineWidth = 3;
      ctx.shadowColor = isMagicTheme ? '#f59e0b' : '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(w, floorY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Dashes
      ctx.strokeStyle = isMagicTheme ? 'rgba(245, 158, 11, 0.4)' : 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 1.5;
      const roadOffset = (state.cameraX * 1.5) % 36;
      for (let rx = -roadOffset; rx < w; rx += 36) {
        ctx.beginPath();
        ctx.moveTo(rx, floorY);
        ctx.lineTo(rx - 14, h);
        ctx.stroke();
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [config, activeChar, activeMonster, activeCoin, isMagicTheme]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] bg-[#070817] sm:rounded-2xl overflow-hidden select-none border border-slate-800 shadow-2xl flex flex-col items-center justify-center cursor-pointer"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />

      {/* CRT Scanlines */}
      {config.settings.crtEffect && (
        <div className="absolute inset-0 crt-overlay pointer-events-none z-10 opacity-70" />
      )}

      {/* In-Game HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/40 shadow-lg flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] text-slate-900 font-black">
              {isMagicTheme ? '⚡' : '★'}
            </span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {isMagicTheme ? 'Snitches' : 'Score'}
            </span>
            <span className="text-2xl font-black text-amber-300 font-mono-num leading-none">{coinsCollected}</span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">LVL</span>
            <span className="text-sm font-bold text-cyan-400 font-mono-num">{currentLevel}</span>
          </div>
        </div>

        {/* Pause Button */}
        {gameState === 'PLAYING' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePause();
            }}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors pointer-events-auto shadow-md"
            title="Pause (P or Esc)"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Level Up Banner */}
      {levelUpBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300 animate-bounce">
          <div className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-extrabold text-sm uppercase tracking-wider shadow-xl border border-white/40 flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-950" />
            <span>{levelUpBanner}</span>
          </div>
        </div>
      )}

      {/* READY MODE PROMPT */}
      {gameState === 'READY' && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-pulse">
          <div className="bg-slate-950/85 backdrop-blur-md px-6 py-3 rounded-2xl border border-amber-400/50 shadow-2xl flex items-center gap-3 text-center">
            {isMagicTheme ? (
              <Sparkles className="w-4 h-4 text-amber-400" />
            ) : (
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            )}
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white">
              {isMagicTheme ? 'CLICK & HOLD TO FLY BROOMSTICK' : 'CLICK & HOLD TO ENGAGE JETPACK'}
            </span>
          </div>
        </div>
      )}

      {/* PAUSED Screen */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-xs w-full">
            <h2 className="text-2xl font-bold text-white mb-2">FLIGHT PAUSED</h2>
            <p className="text-xs text-slate-400 mb-5">Click Resume or press P to continue.</p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePause();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors mb-2"
            >
              Resume Flight
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetToReady();
              }}
              className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Restart
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER Screen */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="max-w-sm w-full bg-slate-900/95 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col items-center">
            
            {/* PROMINENT BRAND LOGO IN FRAME */}
            <div 
              className={`w-20 h-20 rounded-2xl overflow-hidden border-2 mb-3 bg-slate-950 flex items-center justify-center shadow-xl p-1 ${
                isMagicTheme ? 'border-amber-400 ring-2 ring-amber-500/30' : ''
              }`}
              style={{ borderColor: isMagicTheme ? '#f59e0b' : config.branding.neonColor }}
            >
              {config.branding.customLogoDataUrl || config.branding.logoUrl ? (
                <img
                  src={config.branding.customLogoDataUrl || config.branding.logoUrl}
                  alt="Brand Logo"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-3xl font-black text-amber-400">{isMagicTheme ? '⚡' : '★'}</span>
              )}
            </div>

            <div className="text-sm font-extrabold tracking-wider uppercase text-white mb-0.5">
              {config.branding.brandName}
            </div>
            <div className="text-[11px] font-mono text-amber-400 mb-4">
              {config.branding.tagline}
            </div>

            <div className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">
              Flight Terminated
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">GAME OVER</h2>

            {/* Score Card */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 flex items-center justify-around">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  {isMagicTheme ? 'Snitches Caught' : 'Coins Collected'}
                </span>
                <span className="text-3xl font-black text-amber-300 font-mono-num">{coinsCollected}</span>
              </div>
              <div className="h-10 w-[1px] bg-slate-800" />
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Best Record</span>
                <span className="text-2xl font-black text-cyan-400 font-mono-num">{Math.max(coinsCollected, highScore)}</span>
              </div>
            </div>

            {/* FLY AGAIN BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetToReady();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Fly Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
