'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, GAMING_WORDS } from '@typefest/shared';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Crosshair,
  Shield,
  RotateCcw,
  Zap,
  Flame,
  Award,
  Sparkles
} from 'lucide-react';

interface EnemyTarget {
  id: string;
  word: string;
  typedIndex: number;
  x: number; // 10% to 80% horizontal position
  y: number; // 0 to 100 vertical percentage
  speed: number;
  color: string;
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
  const [difficulty, setDifficulty] = useState<'cadet' | 'commander' | 'ace'>('commander');
  const [hullColor, setHullColor] = useState('#06B6D4');

  // Stats
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [wave, setWave] = useState(1);
  const [maxWaves] = useState(3);
  const [streak, setStreak] = useState(0);

  // Active enemies on canvas
  const [enemies, setEnemies] = useState<EnemyTarget[]>([]);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);

  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const baseSpeed = difficulty === 'cadet' ? 0.35 : difficulty === 'commander' ? 0.6 : 0.95;

  // Initialize fresh game
  const initGame = () => {
    setScore(0);
    setShields(3);
    setWave(1);
    setStreak(0);
    setEnemies([]);
    setActiveTargetId(null);
    setGameState('ready');
  };

  useEffect(() => {
    initGame();
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [difficulty]);

  const startGame = () => {
    sound.playGo();
    setGameState('playing');
    setShields(3);
    setScore(0);
    setWave(1);
    setEnemies([]);
    setActiveTargetId(null);
    setTimeout(() => hiddenInputRef.current?.focus(), 50);
  };

  // Enemy spawner
  useEffect(() => {
    if (gameState !== 'playing') return;

    spawnRef.current = setInterval(() => {
      setEnemies((prev) => {
        if (prev.length >= 5) return prev; // Max 5 concurrent enemies

        const pool = wave === 1 ? EASY_WORDS : wave === 2 ? MEDIUM_WORDS : HARD_WORDS;
        const randomWord = pool[Math.floor(Math.random() * pool.length)];

        // Generate random lane (15% to 75%)
        const xPos = Math.floor(Math.random() * 65) + 12;

        const newEnemy: EnemyTarget = {
          id: `enemy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          word: randomWord,
          typedIndex: 0,
          x: xPos,
          y: 5,
          speed: baseSpeed + Math.random() * 0.2,
          color: wave === 1 ? '#06B6D4' : wave === 2 ? '#F59E0B' : '#EF4444'
        };

        return [...prev, newEnemy];
      });
    }, 2400);

    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [gameState, wave, baseSpeed]);

  // Main game tick: enemy descent & collision detection
  useEffect(() => {
    if (gameState !== 'playing') return;

    loopRef.current = setInterval(() => {
      setEnemies((prev) => {
        const nextEnemies: EnemyTarget[] = [];
        let tookDamage = false;

        prev.forEach((enemy) => {
          const nextY = enemy.y + enemy.speed;

          // If enemy hits the bottom base perimeter (y >= 88%)
          if (nextY >= 88) {
            tookDamage = true;
            sound.playExplosion();
          } else {
            nextEnemies.push({ ...enemy, y: nextY });
          }
        });

        if (tookDamage) {
          setShields((s) => {
            const nextShield = s - 1;
            if (nextShield <= 0) {
              clearInterval(loopRef.current!);
              clearInterval(spawnRef.current!);
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
  }, [gameState]);

  // Typing lock-on & laser firing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;
    const pressedKey = e.key.toLowerCase();

    if (pressedKey.length !== 1 || !/^[a-z]$/i.test(pressedKey)) return;

    // Check if we already have an active target
    if (activeTargetId) {
      const target = enemies.find((en) => en.id === activeTargetId);

      if (target) {
        const expectedLetter = target.word[target.typedIndex].toLowerCase();

        if (pressedKey === expectedLetter) {
          // Fire Laser!
          sound.playLaser();
          const nextTyped = target.typedIndex + 1;

          if (nextTyped >= target.word.length) {
            // Target destroyed!
            sound.playExplosion();
            setScore((s) => s + target.word.length * 15);
            setStreak((st) => st + 1);
            setEnemies((prev) => prev.filter((en) => en.id !== activeTargetId));
            setActiveTargetId(null);

            // Wave progression check (every 300 points)
            setScore((currentScore) => {
              if (currentScore > 600 && wave === 2) setWave(3);
              else if (currentScore > 250 && wave === 1) setWave(2);
              else if (currentScore >= 1200) {
                // Victory!
                setGameState('victory');
                confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
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
          // Misdirected shot
          sound.playError();
          setStreak(0);
          return;
        }
      }
    }

    // No target currently locked on: find the closest enemy that starts with this letter!
    const matchingEnemies = enemies
      .filter((en) => en.word[0].toLowerCase() === pressedKey)
      .sort((a, b) => b.y - a.y); // Prioritize lowest/closest enemy!

    if (matchingEnemies.length > 0) {
      const chosen = matchingEnemies[0];
      sound.playLaser();
      setActiveTargetId(chosen.id);

      if (chosen.word.length === 1) {
        sound.playExplosion();
        setScore((s) => s + 20);
        setEnemies((prev) => prev.filter((en) => en.id !== chosen.id));
        setActiveTargetId(null);
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

  return (
    <div className="min-h-screen bg-retro-dark text-slate-100 flex flex-col select-none">
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
                Type letters to lock-on and vaporize incoming space invaders before they breach your perimeter!
              </p>
            </div>
          </div>

          {/* Difficulty Tier */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold">
            {(['cadet', 'commander', 'ace'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setDifficulty(tier)}
                disabled={gameState === 'playing'}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider transition-all ${
                  difficulty === tier
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-retro-sm'
                    : 'text-slate-400 hover:text-white disabled:opacity-40'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Live Gauges */}
        <div className="grid grid-cols-4 gap-3 bg-retro-card border-2 border-slate-900 rounded-xl p-3 text-center shadow-retro">
          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              DEFENSE SHIELDS
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              {[1, 2, 3].map((idx) => (
                <Shield
                  key={idx}
                  className={`w-6 h-6 ${
                    idx <= shields ? 'text-cyan-400 fill-current' : 'text-slate-700'
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
          className="relative h-96 bg-slate-950 border-4 border-slate-900 rounded-2xl shadow-retro-lg overflow-hidden cursor-crosshair"
        >
          {/* Twinkling starfield background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Hidden capture input */}
          <input
            ref={hiddenInputRef}
            type="text"
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 pointer-events-none"
          />

          {/* Incoming Descending Enemies */}
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
                {/* Word Badge above alien */}
                <div
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black tracking-widest border-2 shadow-retro-sm whitespace-nowrap mb-1 ${
                    isTargeted
                      ? 'bg-amber-400 text-slate-950 border-black animate-pulse'
                      : 'bg-slate-900 text-white border-slate-700'
                  }`}
                >
                  <span className="text-emerald-400 font-extrabold underline decoration-2">
                    {enemy.word.slice(0, enemy.typedIndex)}
                  </span>
                  <span className={isTargeted ? 'text-slate-950' : 'text-white'}>
                    {enemy.word.slice(enemy.typedIndex)}
                  </span>
                </div>

                {/* Invader Ship Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg border border-black shadow-md"
                  style={{ backgroundColor: enemy.color }}
                >
                  👾
                </div>
              </div>
            );
          })}

          {/* Laser Defense Perimeter Warning Line */}
          <div className="absolute bottom-16 left-0 right-0 border-b-2 border-dashed border-rose-500/40 flex justify-end pr-4 text-[10px] font-mono text-rose-400/80 pointer-events-none">
            PERIMETER DEFENSE THRESHOLD
          </div>

          {/* Player Laser Turret at Bottom */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
            {/* Cannon barrel */}
            <div className="w-3 h-5 bg-slate-400 border border-black rounded-t-sm" />
            {/* Turret Body */}
            <div
              className="w-14 h-8 border-2 border-black rounded-t-xl flex items-center justify-center font-mono font-black text-xs text-slate-950 shadow-retro"
              style={{ backgroundColor: hullColor }}
            >
              DEF-1
            </div>
          </div>

          {/* Pre-game Screen */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
              <h3 className="text-3xl font-mono font-black text-cyan-400 mb-2">
                DEFENSE TURRET ONLINE
              </h3>
              <p className="text-xs font-mono text-slate-300 max-w-sm mb-5">
                Type letters matching the falling enemy badges to fire laser bolts and obliterate targets before they breach the perimeter.
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
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20 animate-fadeIn">
              <span className="text-5xl mb-2">💥</span>
              <h3 className="text-2xl font-mono font-black text-rose-500 mb-1">
                PERIMETER BREACHED!
              </h3>
              <p className="text-xs font-mono text-slate-300 mb-4">
                Final Sector Score: <span className="text-amber-400 font-bold">{score} PTS</span>
              </p>
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-mono font-black text-xs uppercase bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px]"
              >
                <RotateCcw className="w-4 h-4" /> RETRY MISSION
              </button>
            </div>
          )}

          {/* Victory Screen */}
          {gameState === 'victory' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20 animate-fadeIn">
              <span className="text-5xl mb-2">👑</span>
              <h3 className="text-2xl font-mono font-black text-emerald-400 mb-1">
                SECTORS CLEARED! VICTORY!
              </h3>
              <p className="text-xs font-mono text-slate-300 mb-4">
                Total Score: <span className="text-amber-400 font-bold">{score} PTS</span>
              </p>
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-mono font-black text-xs uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px]"
              >
                <RotateCcw className="w-4 h-4" /> DEFEND AGAIN
              </button>
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
    </div>
  );
}
