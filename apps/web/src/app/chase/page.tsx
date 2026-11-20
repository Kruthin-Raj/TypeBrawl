'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, GAMING_WORDS } from '@typefest/shared';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  Flame,
  RotateCcw,
  Gauge,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';

const CAR_COLORS = [
  { name: 'Neon Crimson', hex: '#EF4444' },
  { name: 'Cyber Gold', hex: '#F59E0B' },
  { name: 'Midnight Slate', hex: '#334155' },
  { name: 'Electric Cyan', hex: '#06B6D4' },
  { name: 'Toxic Lime', hex: '#22C55E' },
  { name: 'Ultra Violet', hex: '#8B5CF6' }
];

export default function PoliceChasePage() {
  const [gameState, setGameState] = useState<'ready' | 'chasing' | 'busted' | 'escaped'>('ready');
  const [carColor, setCarColor] = useState('#EF4444');
  const [pursuitTier, setPursuitTier] = useState<'patrol' | 'highway' | 'interceptor'>('highway');
  const [sirenActive, setSirenActive] = useState(true);

  // Pursuit metrics
  const [gapMeters, setGapMeters] = useState(50); // Police gap (0 to 120m)
  const [escapeMeters, setEscapeMeters] = useState(0); // Progress (0 to 1500m)
  const [targetEscapeMeters] = useState(1200);
  const [currentWpm, setCurrentWpm] = useState(0);
  const [streak, setStreak] = useState(0);
  const [nitroActive, setNitroActive] = useState(false);

  // Words stream
  const [wordsList, setWordsList] = useState<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [inputVal, setInputVal] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Police approach rate based on tier
  const policeSpeedMps = pursuitTier === 'patrol' ? 4.5 : pursuitTier === 'highway' ? 7.0 : 9.5;

  const initGame = () => {
    sound.stopSiren();
    const pool = [...EASY_WORDS, ...MEDIUM_WORDS, ...GAMING_WORDS];
    const generated: string[] = [];
    for (let i = 0; i < 60; i++) {
      generated.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setWordsList(generated);
    setCurrentWordIdx(0);
    setInputVal('');
    setGapMeters(55);
    setEscapeMeters(0);
    setStreak(0);
    setCurrentWpm(0);
    setNitroActive(false);
    setGameState('ready');
    startTimeRef.current = null;
  };

  useEffect(() => {
    initGame();
    return () => {
      sound.stopSiren();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pursuitTier]);

  const startChase = () => {
    sound.playGo();
    if (sirenActive) sound.startSiren();
    setGameState('chasing');
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Police pursuit ticker loop (Every 250ms)
  useEffect(() => {
    if (gameState !== 'chasing') return;

    timerRef.current = setInterval(() => {
      setGapMeters((prevGap) => {
        const lossPerTick = (policeSpeedMps / 4);
        const newGap = Math.max(0, parseFloat((prevGap - lossPerTick).toFixed(1)));

        // If police caught you (0 meters)
        if (newGap <= 0) {
          clearInterval(timerRef.current!);
          sound.stopSiren();
          sound.playExplosion();
          setGameState('busted');
          return 0;
        }

        // Warning sound when close
        if (newGap < 18) {
          sound.playTick();
        }

        return newGap;
      });
    }, 250);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, policeSpeedMps]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'chasing') return;
    const val = e.target.value;
    const targetWord = wordsList[currentWordIdx];

    sound.playKeyClick();

    if (val.endsWith(' ') || currentWordIdx === wordsList.length - 1) {
      const cleanVal = val.trim().toLowerCase();

      if (cleanVal === targetWord.toLowerCase()) {
        sound.playCorrect();
        const nextIdx = currentWordIdx + 1;
        setCurrentWordIdx(nextIdx);
        setInputVal('');

        const newStreak = streak + 1;
        setStreak(newStreak);

        // Boost getaway car! Widen gap and increase distance traveled
        sound.playNitro();
        setNitroActive(true);
        setTimeout(() => setNitroActive(false), 300);

        const boostGap = 12 + Math.min(newStreak * 1.5, 10);
        setGapMeters((prev) => Math.min(100, parseFloat((prev + boostGap).toFixed(1))));

        const distGain = 35 + Math.min(newStreak * 4, 30);
        setEscapeMeters((prevDist) => {
          const nextDist = prevDist + distGain;
          if (nextDist >= targetEscapeMeters) {
            // Escaped!
            if (timerRef.current) clearInterval(timerRef.current);
            sound.stopSiren();
            sound.playCorrect();
            setGameState('escaped');
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
            return targetEscapeMeters;
          }
          return nextDist;
        });

        // WPM update
        if (startTimeRef.current) {
          const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
          if (elapsedMin > 0) {
            setCurrentWpm(Math.round(nextIdx / elapsedMin));
          }
        }
      } else if (val.endsWith(' ')) {
        // Typo penalized
        sound.playError();
        setStreak(0);
        setGapMeters((prev) => Math.max(0, prev - 8));
      } else {
        setInputVal(val);
      }
    } else {
      setInputVal(val);
    }
  };

  const isCritical = gapMeters < 20 && gameState === 'chasing';
  const currentTargetWord = wordsList[currentWordIdx] || '';

  return (
    <div className="min-h-screen bg-retro-dark text-slate-100 flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Header HUD */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-retro-card border-2 border-slate-900 rounded-2xl p-4 shadow-retro">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 border-2 border-black flex items-center justify-center text-slate-950 font-black text-xl shadow-retro-sm animate-pulse">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-mono font-black text-white">
                  POLICE PURSUIT ESCAPE
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500 text-white border border-black shadow-retro-sm">
                  HOT PURSUIT
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Type fast to accelerate your getaway car and evade the police cruisers before they box you in!
              </p>
            </div>
          </div>

          {/* Pursuit Tier Selector & Audio Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold">
              {(['patrol', 'highway', 'interceptor'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setPursuitTier(tier)}
                  disabled={gameState === 'chasing'}
                  className={`px-3 py-1 rounded-lg uppercase tracking-wider transition-all ${
                    pursuitTier === tier
                      ? 'bg-rose-500 text-white font-black shadow-retro-sm'
                      : 'text-slate-400 hover:text-white disabled:opacity-40'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const next = !sirenActive;
                setSirenActive(next);
                if (!next) sound.stopSiren();
                else if (gameState === 'chasing') sound.startSiren();
              }}
              title={sirenActive ? 'Siren Audio On' : 'Siren Muted'}
              className="p-2.5 rounded-xl bg-slate-950 border-2 border-slate-900 text-slate-300 hover:text-white shadow-retro-sm transition-all"
            >
              {sirenActive ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Real-time Pursuit Dashboard Gauges */}
        <div className="grid grid-cols-4 gap-3 bg-retro-card border-2 border-slate-900 rounded-xl p-3 text-center shadow-retro">
          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              GAP TO POLICE
            </span>
            <span
              className={`text-2xl sm:text-3xl font-mono font-black ${
                isCritical
                  ? 'text-rose-500 animate-pulse'
                  : gapMeters < 35
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {gapMeters}m
            </span>
          </div>

          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              GETAWAY SPEED
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400">
              {currentWpm} <span className="text-xs text-slate-400 font-bold">WPM</span>
            </span>
          </div>

          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              ESCAPE ROUTE
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-blue-400">
              {escapeMeters} <span className="text-xs text-slate-400 font-bold">/ {targetEscapeMeters}m</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              BURNOUT STREAK
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-amber-400 fill-current" />
              {streak}
            </span>
          </div>
        </div>

        {/* 🚨 HIGHWAY CHASE RETRO RUNWAY ARENA */}
        <div
          className={`relative h-60 bg-slate-950 border-4 rounded-2xl p-4 shadow-retro-lg overflow-hidden flex flex-col justify-between transition-all ${
            isCritical ? 'border-rose-600 bg-rose-950/20' : 'border-slate-900'
          }`}
        >
          {/* Animated road lanes */}
          <div className="absolute inset-0 flex flex-col justify-around pointer-events-none opacity-20">
            <div className="w-full border-b border-dashed border-white" />
            <div className="w-full border-b border-dashed border-amber-400" />
            <div className="w-full border-b border-dashed border-white" />
          </div>

          {/* Escape Progress Bar top */}
          <div className="relative z-10 w-full bg-slate-900 border border-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-200"
              style={{ width: `${Math.min(100, (escapeMeters / targetEscapeMeters) * 100)}%` }}
            />
          </div>

          {/* Pursuit Scene: Police Cruisers & Getaway Vehicle */}
          <div className="relative z-10 flex items-center justify-between h-36 px-4">
            {/* Police Cruiser Unit */}
            <div
              className="flex items-center gap-3 transition-all duration-200"
              style={{
                transform: `translateX(${Math.max(0, 100 - gapMeters) * 2.8}px)`
              }}
            >
              {/* Police Car SVG */}
              <div className="relative">
                <div className="w-20 h-10 bg-slate-900 border-2 border-black rounded-lg flex items-center justify-center shadow-retro-sm">
                  <span className="text-xs font-mono font-black text-white">POLICE</span>
                </div>
                {/* Flashing Siren Lights */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse border border-black shadow-lg" />
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping border border-black shadow-lg" />
                </div>
              </div>
            </div>

            {/* Gap Warning Banner in middle */}
            <div className="flex flex-col items-center select-none">
              <span
                className={`text-xs font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isCritical
                    ? 'bg-rose-500 text-white border-black animate-bounce'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {gapMeters <= 10 ? 'CRITICAL PROXIMITY!' : `GAP: ${gapMeters}m`}
              </span>
            </div>

            {/* Player Getaway Car */}
            <div className="flex items-center gap-2">
              {/* Exhaust Flames when typing */}
              {nitroActive && (
                <span className="text-2xl animate-pulse">🔥</span>
              )}
              {/* Sports Car SVG */}
              <div
                className="w-24 h-11 border-2 border-black rounded-xl flex items-center justify-center font-mono font-black text-xs text-slate-950 shadow-retro transition-transform hover:scale-105"
                style={{ backgroundColor: carColor }}
              >
                GETAWAY
              </div>
            </div>
          </div>

          {/* Safehouse Distance indicator */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>🚨 PURSUIT UNITS BEHIND</span>
            <span>SAFEHOUSE: {Math.max(0, targetEscapeMeters - escapeMeters)}m AHEAD 🏁</span>
          </div>
        </div>

        {/* Car Skin Customizer Bar */}
        <div className="flex items-center justify-between bg-retro-card border-2 border-slate-900 rounded-xl p-3 shadow-retro text-xs font-mono">
          <span className="font-bold text-slate-300">GETAWAY VEHICLE COLOR:</span>
          <div className="flex items-center gap-2">
            {CAR_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setCarColor(c.hex)}
                className={`w-6 h-6 rounded-lg border-2 transition-all ${
                  carColor === c.hex ? 'border-white scale-110 shadow-retro-sm' : 'border-black'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Active Typing & Controls Stage */}
        <div className="bg-retro-card border-2 border-slate-900 rounded-2xl p-6 shadow-retro flex flex-col items-center">
          {gameState === 'ready' && (
            <div className="flex flex-col items-center text-center py-4">
              <h3 className="text-2xl font-mono font-black text-amber-300 mb-2">
                THE ALARM IS SOUNDING!
              </h3>
              <p className="text-xs font-mono text-slate-400 mb-4 max-w-sm">
                Type the words and hit Space to accelerate. Every correct word creates distance from the cruisers.
              </p>
              <button
                onClick={startChase}
                className="px-8 py-3.5 rounded-xl font-mono font-black text-base uppercase tracking-wider bg-rose-500 hover:bg-rose-400 text-white border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                HIT THE GAS 🏎️💨
              </button>
            </div>
          )}

          {gameState === 'chasing' && (
            <div className="w-full flex flex-col items-center">
              {/* Words Queue Preview */}
              <div className="flex items-center gap-3 overflow-hidden max-w-xl mb-4 font-mono select-none">
                <span className="text-2xl sm:text-3xl font-black text-amber-300 bg-slate-950 px-4 py-2 rounded-xl border-2 border-amber-400 shadow-retro-sm">
                  {currentTargetWord}
                </span>

                <div className="flex items-center gap-2 text-slate-500 text-lg">
                  {wordsList.slice(currentWordIdx + 1, currentWordIdx + 6).map((w, idx) => (
                    <span key={idx} className="whitespace-nowrap">
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              {/* Input Bar */}
              <div className="w-full max-w-md">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  placeholder="Type word + SPACE to accelerate..."
                  className="w-full py-3.5 px-5 bg-slate-950 border-2 border-slate-900 focus:border-amber-400 rounded-xl font-mono font-bold text-lg text-white focus:outline-none shadow-retro-sm text-center"
                />
              </div>
            </div>
          )}

          {gameState === 'busted' && (
            <div className="flex flex-col items-center text-center py-4 animate-bounce-short">
              <span className="text-5xl mb-2">🚨</span>
              <h3 className="text-2xl font-mono font-black text-rose-500">
                BUSTED! THE PATROL CAUGHT UP
              </h3>
              <p className="text-sm font-mono text-slate-300 mt-1 mb-4">
                You made it <span className="text-amber-400 font-bold">{escapeMeters} meters</span> before being boxed in.
              </p>
              <button
                onClick={initGame}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-mono font-black bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-black shadow-retro text-xs uppercase tracking-wider active:translate-x-[2px] active:translate-y-[2px]"
              >
                <RotateCcw className="w-4 h-4" /> RETRY GETAWAY
              </button>
            </div>
          )}

          {gameState === 'escaped' && (
            <div className="flex flex-col items-center text-center py-4 animate-bounce-short">
              <span className="text-5xl mb-2">🏆</span>
              <h3 className="text-2xl font-mono font-black text-emerald-400">
                CLEAN GETAWAY! SAFEHOUSE REACHED!
              </h3>
              <p className="text-sm font-mono text-slate-300 mt-1 mb-4">
                Escaped all pursuit units with an average speed of{' '}
                <span className="text-amber-400 font-bold">{currentWpm} WPM</span>!
              </p>
              <button
                onClick={initGame}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-mono font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-black shadow-retro text-xs uppercase tracking-wider active:translate-x-[2px] active:translate-y-[2px]"
              >
                <RotateCcw className="w-4 h-4" /> PLAY AGAIN
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
