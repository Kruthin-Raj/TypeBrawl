'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, GAMING_WORDS } from '@typefest/shared';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { GameControlsModal } from '@/components/GameControlsModal';
import {
  Crosshair,
  Shield,
  RotateCcw,
  Zap,
  Flame,
  Award,
  Sparkles,
  Pause,
  Play,
  Sliders,
  Volume2,
  VolumeX
} from 'lucide-react';

export type ShipSize = 'small' | 'medium' | 'large' | 'huge';

export interface EnemyTarget {
  id: string;
  word: string;
  typedIndex: number;
  x: number; // 12% to 80% horizontal position
  y: number; // 0 to 100 vertical percentage
  speed: number;
  color: string;
  size: ShipSize;
  shipName: string;
}

export interface Projectile {
  id: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  type: 'laser' | 'torpedo';
  progress: number; // 0 to 1
  enemyId: string;
  enemySize: ShipSize;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  scale: ShipSize;
  createdAt: number;
}

const HULL_COLORS = [
  { name: 'Plasma Cyan', hex: '#06B6D4' },
  { name: 'Arcade Gold', hex: '#F59E0B' },
  { name: 'Hyper Purple', hex: '#8B5CF6' },
  { name: 'Laser Lime', hex: '#22C55E' },
  { name: 'Crimson Fury', hex: '#EF4444' }
];

export default function ArcadeShooterPage() {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'game-over' | 'victory'>('ready');
  const [isPaused, setIsPaused] = useState(false);
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);

  const [difficulty, setDifficulty] = useState<'cadet' | 'commander' | 'ace'>('commander');
  const [hullColor, setHullColor] = useState('#06B6D4');
  const [screenShake, setScreenShake] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Stats
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [wave, setWave] = useState(1);
  const [maxWaves] = useState(3);
  const [streak, setStreak] = useState(0);

  // Active enemies, projectiles & explosions
  const [enemies, setEnemies] = useState<EnemyTarget[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);

  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const baseSpeed = difficulty === 'cadet' ? 0.35 : difficulty === 'commander' ? 0.58 : 0.88;

  // Initialize fresh game
  const initGame = () => {
    setScore(0);
    setShields(3);
    setWave(1);
    setStreak(0);
    setEnemies([]);
    setProjectiles([]);
    setExplosions([]);
    setActiveTargetId(null);
    setGameState('ready');
    setIsPaused(false);
  };

  useEffect(() => {
    initGame();
    if (typeof window !== 'undefined') {
      setSoundOn(sound.isEnabled());
    }
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [difficulty]);

  const startGame = () => {
    sound.playGo();
    setGameState('playing');
    setIsPaused(false);
    setShields(3);
    setScore(0);
    setWave(1);
    setEnemies([]);
    setProjectiles([]);
    setExplosions([]);
    setActiveTargetId(null);
    setTimeout(() => hiddenInputRef.current?.focus(), 50);
  };

  // Helper to determine ship size & name based on word length / wave
  const getShipVariant = (word: string, currentWave: number): { size: ShipSize; color: string; name: string } => {
    const len = word.length;
    if (len <= 4) {
      return { size: 'small', color: '#06B6D4', name: 'Scout Drone' };
    } else if (len <= 7) {
      return { size: 'medium', color: '#F59E0B', name: 'Gunship Cruiser' };
    } else if (len <= 10) {
      return { size: 'large', color: '#EF4444', name: 'Dreadnought' };
    } else {
      return { size: 'huge', color: '#A855F7', name: 'Void Flagship' };
    }
  };

  // Enemy Spawner
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;

    spawnRef.current = setInterval(() => {
      setEnemies((prev) => {
        if (prev.length >= 5) return prev; // Max 5 concurrent enemies

        const pool = wave === 1
          ? EASY_WORDS
          : wave === 2
          ? [...MEDIUM_WORDS, ...GAMING_WORDS]
          : [...HARD_WORDS, ...GAMING_WORDS];

        const randomWord = pool[Math.floor(Math.random() * pool.length)];
        const variant = getShipVariant(randomWord, wave);

        // Generate lane (15% to 75%)
        const xPos = Math.floor(Math.random() * 62) + 16;

        const newEnemy: EnemyTarget = {
          id: `enemy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          word: randomWord,
          typedIndex: 0,
          x: xPos,
          y: 6,
          speed: baseSpeed + (variant.size === 'small' ? 0.2 : variant.size === 'huge' ? -0.15 : 0.05),
          color: variant.color,
          size: variant.size,
          shipName: variant.name
        };

        return [...prev, newEnemy];
      });
    }, 2200);

    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [gameState, isPaused, wave, baseSpeed]);

  // Main game tick: enemy descent & collision detection
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;

    loopRef.current = setInterval(() => {
      setEnemies((prev) => {
        const nextEnemies: EnemyTarget[] = [];
        let tookDamage = false;

        prev.forEach((enemy) => {
          const nextY = enemy.y + enemy.speed;

          // If enemy reaches the defense perimeter threshold (y >= 86%)
          if (nextY >= 86) {
            tookDamage = true;
            sound.playExplosion('large');
            triggerScreenShake();
          } else {
            nextEnemies.push({ ...enemy, y: nextY });
          }
        });

        if (tookDamage) {
          setShields((s) => {
            const nextShield = s - 1;
            if (nextShield <= 0) {
              setGameState('game-over');
              sound.playError();
            }
            return Math.max(0, nextShield);
          });
          setActiveTargetId(null);
        }

        return nextEnemies;
      });
    }, 100);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [gameState, isPaused]);

  // Projectiles & Explosions animation ticker (60 FPS)
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;

    let lastTime = performance.now();

    const updateProjectiles = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Update Projectiles
      setProjectiles((prevProjectiles) => {
        const remaining: Projectile[] = [];

        prevProjectiles.forEach((proj) => {
          const speed = proj.type === 'laser' ? 4.5 : 2.8; // Lasers travel faster than torpedoes
          const nextProgress = proj.progress + speed * delta;

          if (nextProgress >= 1) {
            // Reached target! Trigger impact explosion based on enemy size!
            sound.playExplosion(proj.enemySize);

            if (proj.enemySize === 'large' || proj.enemySize === 'huge') {
              triggerScreenShake();
            }

            // Spawn explosion effect
            setExplosions((exps) => [
              ...exps,
              {
                id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                x: proj.targetX,
                y: proj.targetY,
                scale: proj.enemySize,
                createdAt: Date.now()
              }
            ]);

            // If torpedo, remove enemy
            if (proj.type === 'torpedo') {
              setEnemies((ens) => ens.filter((e) => e.id !== proj.enemyId));
              setActiveTargetId(null);
            }
          } else {
            // Update bullet position along trajectory
            const curX = proj.startX + (proj.targetX - proj.startX) * nextProgress;
            const curY = proj.startY + (proj.targetY - proj.startY) * nextProgress;
            remaining.push({
              ...proj,
              progress: nextProgress,
              currentX: curX,
              currentY: curY
            });
          }
        });

        return remaining;
      });

      // Expire old explosions after 600ms
      setExplosions((exps) => exps.filter((e) => Date.now() - e.createdAt < 650));

      animFrameRef.current = requestAnimationFrame(updateProjectiles);
    };

    animFrameRef.current = requestAnimationFrame(updateProjectiles);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, isPaused]);

  const triggerScreenShake = () => {
    const shakePref = localStorage.getItem('typefest_screen_shake');
    if (shakePref === 'false') return;
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 350);
  };

  // Launch a projectile from player cannon to target
  const fireProjectile = (target: EnemyTarget, isFinalHit: boolean) => {
    const playerX = 50; // Cannon horizontal %
    const playerY = 88; // Cannon vertical %

    if (isFinalHit) {
      sound.playTorpedo();
      setProjectiles((prev) => [
        ...prev,
        {
          id: `torp-${Date.now()}-${Math.random()}`,
          startX: playerX,
          startY: playerY,
          currentX: playerX,
          currentY: playerY,
          targetX: target.x,
          targetY: target.y,
          type: 'torpedo',
          progress: 0,
          enemyId: target.id,
          enemySize: target.size
        }
      ]);
    } else {
      sound.playLaser();
      setProjectiles((prev) => [
        ...prev,
        {
          id: `laser-${Date.now()}-${Math.random()}`,
          startX: playerX,
          startY: playerY,
          currentX: playerX,
          currentY: playerY,
          targetX: target.x,
          targetY: target.y,
          type: 'laser',
          progress: 0,
          enemyId: target.id,
          enemySize: target.size
        }
      ]);
    }
  };

  // Typing lock-on & firing handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameState !== 'playing' || isPaused) return;

    if (e.key === 'Escape') {
      setIsPaused(true);
      setIsControlsModalOpen(true);
      return;
    }

    const pressedKey = e.key.toLowerCase();
    if (pressedKey.length !== 1 || !/^[a-z]$/i.test(pressedKey)) return;

    // Check if we currently have an active locked target
    if (activeTargetId) {
      const target = enemies.find((en) => en.id === activeTargetId);

      if (target) {
        const expectedLetter = target.word[target.typedIndex].toLowerCase();

        if (pressedKey === expectedLetter) {
          const nextTyped = target.typedIndex + 1;
          const isWordFinished = nextTyped >= target.word.length;

          // Fire bullet/projectile!
          fireProjectile(target, isWordFinished);

          if (isWordFinished) {
            // Target destroyed by torpedo impact
            const pointsGain =
              target.size === 'huge'
                ? 400
                : target.size === 'large'
                ? 220
                : target.size === 'medium'
                ? 110
                : 55;

            setScore((s) => s + pointsGain);
            setStreak((st) => st + 1);

            // Progress wave
            setScore((currentScore) => {
              if (currentScore > 650 && wave === 2) setWave(3);
              else if (currentScore > 260 && wave === 1) setWave(2);
              else if (currentScore >= 1350) {
                // Victory!
                setGameState('victory');
                confetti({ particleCount: 110, spread: 90, origin: { y: 0.6 } });
              }
              return currentScore;
            });
          } else {
            setEnemies((prev) =>
              prev.map((en) =>
                en.id === activeTargetId ? { ...en, typedIndex: nextTyped } : en
              )
            );
          }
          return;
        } else {
          // Typo
          sound.playError();
          setStreak(0);
          return;
        }
      }
    }

    // No target currently locked on: find closest enemy starting with pressedKey!
    const matchingEnemies = enemies
      .filter((en) => en.word[0].toLowerCase() === pressedKey)
      .sort((a, b) => b.y - a.y); // Closest / lowest first!

    if (matchingEnemies.length > 0) {
      const chosen = matchingEnemies[0];
      setActiveTargetId(chosen.id);

      const isSingleLetter = chosen.word.length === 1;
      fireProjectile(chosen, isSingleLetter);

      if (isSingleLetter) {
        setScore((s) => s + 30);
      } else {
        setEnemies((prev) =>
          prev.map((en) =>
            en.id === chosen.id ? { ...en, typedIndex: 1 } : en
          )
        );
      }
    } else {
      sound.playError();
      setStreak(0);
    }
  };

  // Render SVG Alien Ship based on variant
  const renderEnemyShip = (enemy: EnemyTarget, isTargeted: boolean) => {
    const size = enemy.size;

    if (size === 'small') {
      // Scout Dart Interceptor
      return (
        <svg width="48" height="34" viewBox="0 0 48 34" fill="none" className="filter drop-shadow-[0_0_8px_#06b6d4]">
          <path d="M24 0L46 26L36 34L24 24L12 34L2 26L24 0Z" fill={enemy.color} stroke="#000" strokeWidth="2" />
          <circle cx="24" cy="14" r="3" fill="#ffffff" />
          <path d="M18 30L24 34L30 30" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      );
    } else if (size === 'medium') {
      // Gunship Cruiser with side cannons
      return (
        <svg width="74" height="48" viewBox="0 0 74 48" fill="none" className="filter drop-shadow-[0_0_10px_#f59e0b]">
          <path d="M37 0L52 18L72 24L64 44L48 36L37 46L26 36L10 44L2 24L22 18L37 0Z" fill={enemy.color} stroke="#000" strokeWidth="2" />
          {/* Twin Cockpits / Cannons */}
          <rect x="6" y="16" width="6" height="18" rx="2" fill="#334155" stroke="#000" />
          <rect x="62" y="16" width="6" height="18" rx="2" fill="#334155" stroke="#000" />
          <polygon points="37,12 43,26 31,26" fill="#fbbf24" stroke="#000" />
        </svg>
      );
    } else if (size === 'large') {
      // Armored Heavy Dreadnought
      return (
        <svg width="104" height="64" viewBox="0 0 104 64" fill="none" className="filter drop-shadow-[0_0_12px_#ef4444]">
          <path d="M52 0L76 16L98 24L92 56L68 46L52 62L36 46L12 56L6 24L28 16L52 0Z" fill={enemy.color} stroke="#000" strokeWidth="2.5" />
          {/* Reactor Core */}
          <circle cx="52" cy="28" r="7" fill="#fca5a5" stroke="#000" strokeWidth="2" />
          <rect x="22" y="24" width="12" height="16" rx="2" fill="#1e293b" stroke="#000" />
          <rect x="70" y="24" width="12" height="16" rx="2" fill="#1e293b" stroke="#000" />
          <line x1="28" y1="40" x2="28" y2="52" stroke="#ef4444" strokeWidth="3" />
          <line x1="76" y1="40" x2="76" y2="52" stroke="#ef4444" strokeWidth="3" />
        </svg>
      );
    } else {
      // Void Flagship / Mothership
      return (
        <svg width="144" height="84" viewBox="0 0 144 84" fill="none" className="filter drop-shadow-[0_0_16px_#a855f7]">
          <path d="M72 0L108 20L140 32L128 72L96 60L72 82L48 60L16 72L4 32L36 20L72 0Z" fill={enemy.color} stroke="#000" strokeWidth="3" />
          {/* Energy Ring / Core */}
          <circle cx="72" cy="38" r="14" fill="#581c87" stroke="#e9d5ff" strokeWidth="2.5" />
          <circle cx="72" cy="38" r="6" fill="#f43f5e" className="animate-ping" />
          {/* Side Cannons */}
          <rect x="24" y="32" width="16" height="24" rx="3" fill="#0f172a" stroke="#000" strokeWidth="1.5" />
          <rect x="104" y="32" width="16" height="24" rx="3" fill="#0f172a" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    }
  };

  return (
    <div className={`min-h-screen bg-retro-dark text-slate-100 flex flex-col select-none ${screenShake ? 'animate-screen-shake' : ''}`}>
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        
        {/* Header HUD */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-retro-card border-2 border-slate-900 rounded-2xl p-4 shadow-retro">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400 border-2 border-black flex items-center justify-center text-slate-950 font-black text-xl shadow-retro-sm">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-mono font-black text-white">
                  LASER TYPE SHOOTER
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-400 text-slate-950 border border-black shadow-retro-sm">
                  TURRET DEFENSE
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Type letters to fire high-energy lasers & torpedoes at incoming invaders before they breach your perimeter!
              </p>
            </div>
          </div>

          {/* Controls: Difficulty + Sound + Pause + Options + Exit */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold">
              {(['cadet', 'commander', 'ace'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setDifficulty(tier)}
                  disabled={gameState === 'playing'}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all ${
                    difficulty === tier
                      ? 'bg-cyan-400 text-slate-950 font-black shadow-retro-sm'
                      : 'text-slate-400 hover:text-white disabled:opacity-40'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                const next = sound.toggle();
                setSoundOn(next);
              }}
              title={soundOn ? 'Sound On' : 'Sound Muted'}
              className="p-2 rounded-xl bg-slate-950 border-2 border-slate-900 text-slate-300 hover:text-white shadow-retro-sm transition-all"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Pause Button */}
            {gameState === 'playing' && (
              <button
                onClick={() => {
                  setIsPaused(!isPaused);
                  setIsControlsModalOpen(!isPaused);
                }}
                title="Pause Game (Esc)"
                className="p-2 rounded-xl bg-slate-950 border-2 border-slate-900 text-slate-300 hover:text-white shadow-retro-sm transition-all"
              >
                {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-current" /> : <Pause className="w-4 h-4 text-amber-400 fill-current" />}
              </button>
            )}

            {/* Options Button */}
            <button
              onClick={() => {
                setIsPaused(true);
                setIsControlsModalOpen(true);
              }}
              title="Options & Settings"
              className="p-2 rounded-xl bg-slate-950 border-2 border-slate-900 text-slate-300 hover:text-white shadow-retro-sm transition-all"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Exit Button */}
            <button
              onClick={() => {
                setIsPaused(true);
                setIsControlsModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl border-2 border-rose-900 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider transition-all"
            >
              EXIT
            </button>
          </div>
        </div>

        {/* Live Gauges Dashboard */}
        <div className="grid grid-cols-4 gap-3 bg-retro-card border-2 border-slate-900 rounded-xl p-3 text-center shadow-retro">
          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              DEFENSE SHIELDS
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              {[1, 2, 3].map((idx) => (
                <Shield
                  key={idx}
                  className={`w-6 h-6 transition-all ${
                    idx <= shields ? 'text-cyan-400 fill-current drop-shadow-[0_0_8px_#06b6d4]' : 'text-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              SECTOR WAVE
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400">
              {wave} <span className="text-xs text-slate-400 font-bold">/ {maxWaves}</span>
            </span>
          </div>

          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              CURRENT SCORE
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
              {score}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              HIT STREAK
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-purple-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-amber-400 fill-current" />
              {streak}
            </span>
          </div>
        </div>

        {/* 🌌 RETRO ARCADE SPACE DEFENSE CANVAS */}
        <div
          onClick={() => hiddenInputRef.current?.focus()}
          className="relative h-[430px] bg-[#07090e] border-4 border-slate-900 rounded-2xl shadow-retro-lg overflow-hidden cursor-crosshair select-none"
        >
          {/* Animated Twinkling Starfield */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Hidden input to catch keyboard keystrokes */}
          <input
            ref={hiddenInputRef}
            type="text"
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 pointer-events-none"
          />

          {/* Incoming Descending Alien Ships (Variants based on word difficulty) */}
          {enemies.map((enemy) => {
            const isTargeted = enemy.id === activeTargetId;

            return (
              <div
                key={enemy.id}
                className="absolute transition-all duration-100 flex flex-col items-center select-none"
                style={{
                  left: `${enemy.x}%`,
                  top: `${enemy.y}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {/* Word Badge above ship */}
                <div
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-black tracking-widest border-2 shadow-retro-sm whitespace-nowrap mb-1.5 transition-all ${
                    isTargeted
                      ? 'bg-amber-400 text-slate-950 border-black shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                      : 'bg-slate-950/90 text-white border-slate-700'
                  }`}
                >
                  <span className="text-emerald-400 font-black underline decoration-2">
                    {enemy.word.slice(0, enemy.typedIndex)}
                  </span>
                  <span className={isTargeted ? 'text-slate-950' : 'text-slate-200'}>
                    {enemy.word.slice(enemy.typedIndex)}
                  </span>
                </div>

                {/* Variant Alien Warship Graphic */}
                <div className="relative group flex items-center justify-center">
                  {renderEnemyShip(enemy, isTargeted)}

                  {/* Ship Class Tag on Hover */}
                  <span className="absolute -bottom-4 text-[9px] font-mono font-bold text-zinc-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {enemy.shipName}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Flying Projectiles: Lasers and Heavy Torpedoes */}
          {projectiles.map((proj) => {
            const isTorpedo = proj.type === 'torpedo';

            return (
              <div
                key={proj.id}
                className="absolute pointer-events-none z-20"
                style={{
                  left: `${proj.currentX}%`,
                  top: `${proj.currentY}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {isTorpedo ? (
                  // Heavy High-Energy Plasma Torpedo
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-amber-400 border border-white shadow-[0_0_15px_#f59e0b] animate-ping" />
                    <div className="w-3 h-8 bg-gradient-to-t from-transparent via-amber-500 to-rose-500 rounded-full -mt-2 blur-[1px]" />
                  </div>
                ) : (
                  // Snappy Laser Bolt
                  <div className="w-1.5 h-6 bg-cyan-300 rounded-full shadow-[0_0_10px_#22d3ee]" />
                )}
              </div>
            );
          })}

          {/* Dynamic Explosions based on Ship Size! */}
          {explosions.map((exp) => {
            const isSmall = exp.scale === 'small';
            const isMed = exp.scale === 'medium';
            const isLarge = exp.scale === 'large';
            const isHuge = exp.scale === 'huge';

            const sizePx = isSmall ? 60 : isMed ? 100 : isLarge ? 150 : 210;

            return (
              <div
                key={exp.id}
                className="absolute pointer-events-none z-30 flex items-center justify-center animate-explosion"
                style={{
                  left: `${exp.x}%`,
                  top: `${exp.y}%`,
                  width: `${sizePx}px`,
                  height: `${sizePx}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Central expanding fireball */}
                <div
                  className={`rounded-full animate-ping ${
                    isHuge
                      ? 'w-32 h-32 bg-purple-500/80 shadow-[0_0_50px_#a855f7]'
                      : isLarge
                      ? 'w-24 h-24 bg-rose-500/80 shadow-[0_0_40px_#ef4444]'
                      : isMed
                      ? 'w-16 h-16 bg-amber-400/80 shadow-[0_0_30px_#f59e0b]'
                      : 'w-10 h-10 bg-cyan-400/80 shadow-[0_0_20px_#06b6d4]'
                  }`}
                />

                {/* Shockwave Blast Ring */}
                <div
                  className={`absolute rounded-full border-4 animate-scale-up ${
                    isHuge
                      ? 'w-44 h-44 border-purple-400'
                      : isLarge
                      ? 'w-32 h-32 border-rose-500'
                      : isMed
                      ? 'w-20 h-20 border-amber-400'
                      : 'w-14 h-14 border-cyan-300'
                  }`}
                />

                {/* Radial Spark Debris particles */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-yellow-300 absolute -top-4 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-orange-400 absolute -bottom-4 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-red-400 absolute -left-4 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 absolute -right-4 animate-ping" />
                  {(isLarge || isHuge) && (
                    <>
                      <span className="w-3 h-3 rounded-full bg-white absolute top-6 left-6 animate-ping" />
                      <span className="w-3 h-3 rounded-full bg-purple-400 absolute bottom-6 right-6 animate-ping" />
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Laser Defense Perimeter Warning Line */}
          <div className="absolute bottom-16 left-0 right-0 border-b-2 border-dashed border-rose-500/40 flex justify-end pr-4 text-[10px] font-mono text-rose-400/80 pointer-events-none">
            DEFENSE PERIMETER THRESHOLD
          </div>

          {/* Player Laser Turret at Bottom */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            {/* Dual Cannon Barrels */}
            <div className="flex gap-2">
              <div className="w-1.5 h-6 bg-slate-300 border border-black rounded-t-sm" />
              <div className="w-1.5 h-6 bg-slate-300 border border-black rounded-t-sm" />
            </div>
            {/* Turret Body */}
            <div
              className="w-16 h-9 border-2 border-black rounded-t-xl flex items-center justify-center font-mono font-black text-xs text-slate-950 shadow-retro"
              style={{ backgroundColor: hullColor }}
            >
              DEF-1
            </div>
          </div>

          {/* Pre-game Screen */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-30">
              <h3 className="text-3xl font-mono font-black text-cyan-400 mb-2">
                DEFENSE TURRET ONLINE
              </h3>
              <p className="text-xs font-mono text-slate-300 max-w-sm mb-5 leading-relaxed">
                Type letters matching the enemy badges to lock-on. Destroy scouts, cruisers, and heavy dreadnoughts with explosive torpedoes before they breach the perimeter!
              </p>
              <button
                onClick={startGame}
                className="px-8 py-3.5 rounded-xl font-mono font-black text-sm uppercase tracking-wider bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px]"
              >
                ENGAGE DEFENSE 🚀
              </button>
            </div>
          )}

          {/* Game Over Screen */}
          {gameState === 'game-over' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-30 animate-fadeIn">
              <span className="text-5xl mb-2">💥</span>
              <h3 className="text-2xl font-mono font-black text-rose-500 mb-1">
                PERIMETER BREACHED!
              </h3>
              <p className="text-xs font-mono text-slate-300 mb-4">
                Final Sector Score: <span className="text-amber-400 font-bold">{score} PTS</span>
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-bold text-xs border border-slate-800 transition-all"
                >
                  Main Menu
                </Link>
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-mono font-black text-xs uppercase bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <RotateCcw className="w-4 h-4" /> RETRY MISSION
                </button>
              </div>
            </div>
          )}

          {/* Victory Screen */}
          {gameState === 'victory' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-30 animate-fadeIn">
              <span className="text-5xl mb-2">👑</span>
              <h3 className="text-2xl font-mono font-black text-emerald-400 mb-1">
                ALL SECTORS CLEARED! VICTORY!
              </h3>
              <p className="text-xs font-mono text-slate-300 mb-4">
                Total Score: <span className="text-amber-400 font-bold">{score} PTS</span>
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-bold text-xs border border-slate-800 transition-all"
                >
                  Main Menu
                </Link>
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-mono font-black text-xs uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <RotateCcw className="w-4 h-4" /> DEFEND AGAIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Turret Hull Skin Customizer Bar */}
        <div className="flex items-center justify-between bg-retro-card border-2 border-slate-900 rounded-xl p-3 shadow-retro text-xs font-mono">
          <span className="font-bold text-slate-300">TURRET HULL COLOR:</span>
          <div className="flex items-center gap-2">
            {HULL_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setHullColor(c.hex)}
                className={`w-6 h-6 rounded-lg border-2 transition-all ${
                  hullColor === c.hex ? 'border-white scale-110 shadow-retro-sm' : 'border-black'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Unified In-Game Pause, Exit & Options Modal */}
      <GameControlsModal
        isOpen={isControlsModalOpen}
        onClose={() => {
          setIsControlsModalOpen(false);
          setIsPaused(false);
          setTimeout(() => hiddenInputRef.current?.focus(), 50);
        }}
        onRestart={initGame}
        gameTitle="Laser Type Shooter"
        gameModeBadge="TURRET DEFENSE"
      />
    </div>
  );
}
