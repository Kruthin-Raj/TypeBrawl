'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { GameControlsModal } from '@/components/GameControlsModal';
import {
  Volume2,
  VolumeX,
  Sliders,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  AlertTriangle,
  History,
  ShieldAlert
} from 'lucide-react';

const CHASE_WORDS_SAMPLE = [
  'living', 'dog', 'know', 'monkey', 'focus', 'have', 'reason', 'option',
  'accessibility', 'record', 'hand', 'long', 'food', 'line', 'run', 'part',
  'read', 'make', 'second', 'here', 'island', 'gave', 'over', 'keep', 'past',
  'street', 'speed', 'engine', 'pursuit', 'police', 'escape', 'siren', 'turbo',
  'nitro', 'shadow', 'patrol', 'highway', 'danger', 'vector', 'cruiser', 'drift',
  'radar', 'outrun', 'throttle', 'velocity', 'boost', 'shift', 'accelerate'
];

const RUNNER_SPEECH_NORMAL = [
  'Too slow!',
  'Catch me if you can!',
  'You will need more than that!',
  'Eat my dust!',
  'Can not touch this!',
  'Vroom!'
];

const RUNNER_SPEECH_DANGER = [
  'Too close! Step on it!',
  'They are right on my tail!',
  'Floor the accelerator!',
  'No way I am getting caught!'
];

export interface ChaseLevel {
  level: number;
  title: string;
  location: string;
  targetGap: number;
  timeLimit: number;
  catchRate: number;
  cruiserName: string;
  envBadge: string;
}

const CHASE_LEVELS: ChaseLevel[] = [
  {
    level: 1,
    title: 'Suburban Alleyways',
    location: 'Quiet Neighborhood',
    targetGap: 45,
    timeLimit: 50,
    catchRate: 0.35,
    cruiserName: 'Local Patrol Cruisers',
    envBadge: 'bg-sky-500/20 text-sky-400 border-sky-500/40'
  },
  {
    level: 2,
    title: 'Downtown Expressway',
    location: 'Highway Grid',
    targetGap: 55,
    timeLimit: 45,
    catchRate: 0.50,
    cruiserName: 'Undercover Interceptors',
    envBadge: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
  },
  {
    level: 3,
    title: 'Industrial Freight Docks',
    location: 'Cargo Terminal',
    targetGap: 65,
    timeLimit: 40,
    catchRate: 0.65,
    cruiserName: 'SWAT Armored Rigs',
    envBadge: 'bg-rose-500/20 text-rose-400 border-rose-500/40'
  },
  {
    level: 4,
    title: 'Mountain Canyon Tunnels',
    location: 'Alpine Pass',
    targetGap: 75,
    timeLimit: 35,
    catchRate: 0.80,
    cruiserName: 'Pursuit Supercars',
    envBadge: 'bg-purple-500/20 text-purple-400 border-purple-500/40'
  },
  {
    level: 5,
    title: 'Apex Aerial Grid',
    location: 'State Airspace Lockdown',
    targetGap: 85,
    timeLimit: 30,
    catchRate: 0.95,
    cruiserName: 'Helicopter Strike Squad',
    envBadge: 'bg-pink-500/20 text-pink-400 border-pink-500/40'
  }
];

export default function PoliceChasePage() {
  const [gameState, setGameState] = useState<'ready' | 'chasing' | 'busted' | 'escaped'>('ready');
  const [isPaused, setIsPaused] = useState(false);
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);

  // Progressive Level (1 to 5)
  const [currentLevel, setCurrentLevel] = useState(1);
  const activeLevel = CHASE_LEVELS[currentLevel - 1] || CHASE_LEVELS[0];

  // Difficulty Tier
  const [tier, setTier] = useState<'novice' | 'mid' | 'pro'>('mid');
  const [flashingFxEnabled, setFlashingFxEnabled] = useState(true);

  // Pursuit metrics
  const [timeRemaining, setTimeRemaining] = useState(activeLevel.timeLimit);
  const [gapMeters, setGapMeters] = useState(45); // Police gap (0 to 100m)
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [speechText, setSpeechText] = useState('Too slow!');

  // Words stream & typing
  const [words, setWords] = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [correctLettersCount, setCorrectLettersCount] = useState(0);
  const [totalLettersTyped, setTotalLettersTyped] = useState(0);

  // Sound toggle
  const [soundOn, setSoundOn] = useState(true);

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  // Police approach speed based on tier and level (meters per tick)
  const policeCatchRate = activeLevel.catchRate * (tier === 'novice' ? 0.8 : tier === 'mid' ? 1.0 : 1.25);

  // Initialize Game Run
  const initRun = (overrideLevel?: number | any) => {
    sound.stopSiren();
    const targetLvl = typeof overrideLevel === 'number' ? overrideLevel : currentLevel;
    const lvlConfig = CHASE_LEVELS[targetLvl - 1] || CHASE_LEVELS[0];

    // Shuffle words
    const shuffled = [...CHASE_WORDS_SAMPLE, ...CHASE_WORDS_SAMPLE].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setWordIdx(0);
    setCurrentInput('');
    setGapMeters(45);
    setTimeRemaining(lvlConfig.timeLimit);
    setWordsCompleted(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectLettersCount(0);
    setTotalLettersTyped(0);
    setSpeechText('Too slow!');
    setGameState('ready');
    setIsPaused(false);
  };

  useEffect(() => {
    initRun();
    if (typeof window !== 'undefined') {
      const savedFlash = localStorage.getItem('typefest_flashing_fx');
      if (savedFlash !== null) setFlashingFxEnabled(savedFlash === 'true');
      setSoundOn(sound.isEnabled());
    }
    return () => {
      sound.stopSiren();
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [tier, currentLevel]);

  // Start Chase
  const startChase = () => {
    sound.playGo();
    setGameState('chasing');
    setIsPaused(false);
    setTimeout(() => hiddenInputRef.current?.focus(), 50);
  };

  // 1-second countdown timer
  useEffect(() => {
    if (gameState !== 'chasing' || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Escaped! Time survived with positive gap
          sound.stopSiren();
          sound.playCorrect();
          setGameState('escaped');
          confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isPaused]);

  // Main pursuit ticker (Every 150ms)
  useEffect(() => {
    if (gameState !== 'chasing' || isPaused) {
      sound.stopSiren();
      return;
    }

    tickRef.current = setInterval(() => {
      setGapMeters((prev) => {
        const nextGap = Math.max(0, parseFloat((prev - policeCatchRate).toFixed(1)));

        // If caught
        if (nextGap <= 0) {
          sound.stopSiren();
          sound.playExplosion('large');
          setGameState('busted');
          return 0;
        }

        // CRITICAL / NEAR ALERT: Alert ONLY when police is nearer!
        if (nextGap < 15) {
          // Urgent proximity
          sound.startSiren('high');
          sound.playTick();
        } else if (nextGap < 24) {
          // Warning proximity
          sound.startSiren('low');
        } else {
          // Far away / Safe distance: Mute siren!
          sound.stopSiren();
        }

        return nextGap;
      });
    }, 150);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [gameState, isPaused, policeCatchRate]);

  // Accuracy calculation
  const accuracy = useMemo(() => {
    if (totalLettersTyped === 0) return 100;
    return Math.round((correctLettersCount / totalLettersTyped) * 100);
  }, [correctLettersCount, totalLettersTyped]);

  // WPM calculation
  const currentWpm = useMemo(() => {
    const elapsedMinutes = (60 - timeRemaining) / 60;
    if (elapsedMinutes <= 0.05 || wordsCompleted === 0) return 0;
    return Math.round(wordsCompleted / elapsedMinutes);
  }, [wordsCompleted, timeRemaining]);

  // Handle typing directly on page
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isPaused) return;

    if (e.key === 'Escape') {
      setIsPaused(true);
      setIsControlsModalOpen(true);
      return;
    }

    if (gameState === 'ready') {
      startChase();
    }

    if (gameState !== 'chasing') return;

    const targetWord = words[wordIdx] || '';

    // Handle Space or Enter to complete word
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setTotalLettersTyped((t) => t + 1);

      if (currentInput.trim() === targetWord) {
        // Correct Word!
        sound.playCorrect();
        sound.playNitro();

        const newWordsCount = wordsCompleted + 1;
        setWordsCompleted(newWordsCount);

        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));

        // Bonus distance boost
        const boost = 8 + Math.min(newCombo * 1.5, 12);
        setGapMeters((g) => Math.min(90, parseFloat((g + boost).toFixed(1))));

        // Pick speech line
        if (gapMeters < 20) {
          setSpeechText(RUNNER_SPEECH_DANGER[Math.floor(Math.random() * RUNNER_SPEECH_DANGER.length)]);
        } else {
          setSpeechText(RUNNER_SPEECH_NORMAL[Math.floor(Math.random() * RUNNER_SPEECH_NORMAL.length)]);
        }

        // Advance to next word
        setWordIdx((i) => (i + 1) % words.length);
        setCurrentInput('');
      } else {
        // Wrong word submitted
        sound.playError();
        setCombo(0);
        setGapMeters((g) => Math.max(0, g - 6));
        setCurrentInput('');
      }
      return;
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      setCurrentInput((prev) => prev.slice(0, -1));
      return;
    }

    // Normal Character typing
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      sound.playKeyClick();
      const nextInput = currentInput + e.key.toLowerCase();
      setCurrentInput(nextInput);

      setTotalLettersTyped((t) => t + 1);
      const targetSub = targetWord.substring(0, nextInput.length);
      if (nextInput === targetSub) {
        setCorrectLettersCount((c) => c + 1);
      } else {
        sound.playError();
      }
    }
  };

  const isNear = gapMeters < 24 && gameState === 'chasing';
  const isCritical = gapMeters < 15 && gameState === 'chasing';

  // Calculate runner and chaser pixel track positions
  // Gap goes from 0m to 90m. Chaser is on left (0%), runner on right.
  // When gap is small, chaser is closer to runner!
  const chaserTrackOffset = Math.max(8, Math.min(68, 72 - gapMeters * 0.7));

  return (
    <div
      className="min-h-screen bg-[#0d0f14] text-slate-100 flex flex-col select-none relative overflow-x-hidden font-sans"
      onClick={() => hiddenInputRef.current?.focus()}
    >
      {/* Hidden input to catch keyboard input seamlessly */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="opacity-0 absolute pointer-events-none"
        autoFocus
        onKeyDown={handleKeyDown}
        readOnly
      />

      {/* 🚨 RED FLASHING SCREEN ALERT VIGNETTE (Alert only when police is near!) */}
      {flashingFxEnabled && isNear && (
        <div
          className={`fixed inset-0 pointer-events-none z-40 transition-all duration-100 ${
            isCritical
              ? 'border-[12px] border-red-600/90 shadow-[inset_0_0_120px_rgba(239,68,68,0.7)] animate-pulse bg-red-600/10'
              : 'border-[6px] border-red-500/50 shadow-[inset_0_0_70px_rgba(239,68,68,0.35)] animate-pulse'
          }`}
        />
      )}

      {/* Top Navigation & Game HUD Bar */}
      <header className="w-full bg-[#0a0c10] border-b border-zinc-800/80 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Level Badges */}
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="text-xl font-mono font-black text-amber-400 tracking-wider">
                KEYDASH
              </span>
            </Link>

            {/* Level Selector 1 to 5 */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-[11px] font-mono font-bold">
              {CHASE_LEVELS.map((lvl) => (
                <button
                  key={lvl.level}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentLevel(lvl.level);
                  }}
                  disabled={gameState === 'chasing'}
                  className={`px-2 py-0.5 rounded uppercase tracking-wider transition-all ${
                    currentLevel === lvl.level
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-zinc-400 hover:text-white disabled:opacity-40'
                  }`}
                  title={`${lvl.title}: ${lvl.location}`}
                >
                  L{lvl.level}
                </button>
              ))}
            </div>

            {/* Tier selector */}
            <div className="hidden lg:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-[10px] font-mono font-bold">
              {(['novice', 'mid', 'pro'] as const).map((t) => (
                <button
                  key={t}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTier(t);
                  }}
                  disabled={gameState === 'chasing'}
                  className={`px-1.5 py-0.5 rounded uppercase tracking-wider transition-all ${
                    tier === t
                      ? 'bg-zinc-700 text-white font-black'
                      : 'text-zinc-500 hover:text-white disabled:opacity-40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Central Live HUD Stats: WPM, ACC, TIME, WORDS, LEAD */}
          <div className="hidden sm:flex items-center gap-6 text-center font-mono">
            {/* WPM */}
            <div>
              <span className="text-xl font-black text-amber-400 block leading-none">
                {currentWpm}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                WPM
              </span>
            </div>

            {/* ACC */}
            <div>
              <span className="text-xl font-black text-amber-400 block leading-none">
                {accuracy}%
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                ACC
              </span>
            </div>

            {/* TIME */}
            <div>
              <span className={`text-xl font-black block leading-none ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                {timeRemaining}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                TIME
              </span>
            </div>

            {/* WORDS */}
            <div>
              <span className="text-xl font-black text-amber-400 block leading-none">
                {wordsCompleted}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                WORDS
              </span>
            </div>

            {/* LEAD / GAP */}
            <div>
              <span
                className={`text-xl font-black block leading-none ${
                  isCritical ? 'text-red-500 animate-pulse' : isNear ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {gapMeters}m
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                LEAD
              </span>
            </div>
          </div>

          {/* Top Right Controls: Sound, Pause, Options, End Run */}
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const next = sound.toggle();
                setSoundOn(next);
              }}
              title={soundOn ? 'Sound On' : 'Sound Muted'}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </button>

            {/* Pause / Resume Button */}
            {gameState === 'chasing' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                  setIsControlsModalOpen(!isPaused);
                }}
                title="Pause Run (Esc)"
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all"
              >
                {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-current" /> : <Pause className="w-4 h-4 text-amber-400 fill-current" />}
              </button>
            )}

            {/* Options Settings Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(true);
                setIsControlsModalOpen(true);
              }}
              title="Options & Audio"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* End Run / Exit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(true);
                setIsControlsModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-red-500/50 bg-red-950/20 hover:bg-red-900/40 text-red-400 font-mono font-bold text-xs uppercase tracking-wider transition-all"
            >
              END RUN
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between gap-6">

        {/* Mobile Stats Row (Visible on small screens) */}
        <div className="grid grid-cols-5 sm:hidden gap-2 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 text-center font-mono">
          <div>
            <span className="text-sm font-black text-amber-400 block">{currentWpm}</span>
            <span className="text-[9px] text-zinc-500 uppercase">WPM</span>
          </div>
          <div>
            <span className="text-sm font-black text-amber-400 block">{accuracy}%</span>
            <span className="text-[9px] text-zinc-500 uppercase">ACC</span>
          </div>
          <div>
            <span className={`text-sm font-black block ${timeRemaining <= 10 ? 'text-red-400' : 'text-amber-400'}`}>
              {timeRemaining}
            </span>
            <span className="text-[9px] text-zinc-500 uppercase">TIME</span>
          </div>
          <div>
            <span className="text-sm font-black text-amber-400 block">{wordsCompleted}</span>
            <span className="text-[9px] text-zinc-500 uppercase">WORDS</span>
          </div>
          <div>
            <span className={`text-sm font-black block ${isNear ? 'text-red-500' : 'text-emerald-400'}`}>
              {gapMeters}m
            </span>
            <span className="text-[9px] text-zinc-500 uppercase">LEAD</span>
          </div>
        </div>

        {/* Combo Multiplier Badge */}
        <div className="flex flex-col items-center justify-center min-h-[40px]">
          {combo >= 2 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-xs tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-bounce-short">
              <Flame className="w-3.5 h-3.5 fill-current text-rose-600" />
              <span>{combo}x COMBO</span>
            </div>
          )}
        </div>

        {/* Central Typing Stream (Exact match to video styling) */}
        <div className="flex flex-col items-center justify-center py-6 px-4">
          <div className="max-w-3xl w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5 text-xl sm:text-2xl font-mono leading-relaxed select-none">
            {words.map((w, idx) => {
              const isPast = idx < wordIdx;
              const isCurrent = idx === wordIdx;

              if (isPast) {
                return (
                  <span key={idx} className="text-zinc-600 transition-colors">
                    {w}
                  </span>
                );
              }

              if (isCurrent) {
                // Render current word with letter-by-letter highlights
                return (
                  <span
                    key={idx}
                    className="relative bg-amber-400/20 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    {w.split('').map((char, charIdx) => {
                      const typedChar = currentInput[charIdx];
                      let charClass = 'text-amber-200';

                      if (typedChar !== undefined) {
                        if (typedChar === char) {
                          charClass = 'text-emerald-400 font-black underline underline-offset-4';
                        } else {
                          charClass = 'text-rose-500 font-black bg-rose-950/60 rounded';
                        }
                      } else if (charIdx === currentInput.length) {
                        charClass = 'text-white underline decoration-amber-400 decoration-2 animate-pulse';
                      }

                      return (
                        <span key={charIdx} className={charClass}>
                          {char}
                        </span>
                      );
                    })}
                  </span>
                );
              }

              return (
                <span key={idx} className="text-zinc-300 transition-colors">
                  {w}
                </span>
              );
            })}
          </div>

          {/* Subtext Prompt */}
          <div className="mt-8 text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">
            {gameState === 'ready'
              ? 'START TYPING TO RUN'
              : isPaused
              ? 'RUN PAUSED — PRESS ESC OR CLICK RESUME'
              : 'KEEP GOING — SPACE TO ACCELERATE'}
          </div>
        </div>

        {/* 🚨 ARCADE CHASE TRACK CARD (Exact bottom box from video) */}
        <div className="w-full bg-[#090b0e] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[170px]">
          
          {/* Top Bar of Track Card */}
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span
              className={`tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                isCritical
                  ? 'text-red-500 animate-pulse font-black'
                  : isNear
                  ? 'text-amber-400 font-black'
                  : 'text-zinc-400'
              }`}
            >
              {isCritical ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 fill-current animate-ping" />
                  WARNING: POLICE RIGHT ON YOUR TAIL!
                </>
              ) : isNear ? (
                'CLOSING IN'
              ) : (
                'CRUISING'
              )}
            </span>

            <span className={`font-mono font-black ${isNear ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
              GAP {gapMeters}m
            </span>
          </div>

          {/* Track Canvas & Animated Actors */}
          <div className="relative w-full h-24 my-2 flex items-center overflow-hidden">
            
            {/* Background City Skyline Silhouette */}
            <div className="absolute inset-x-0 bottom-3 h-12 opacity-25 flex items-end justify-between pointer-events-none select-none">
              <div className="w-8 h-8 bg-zinc-700 rounded-t" />
              <div className="w-12 h-12 bg-zinc-600 rounded-t" />
              <div className="w-6 h-6 bg-zinc-700 rounded-t" />
              <div className="w-16 h-10 bg-zinc-600 rounded-t" />
              <div className="w-10 h-7 bg-zinc-700 rounded-t" />
              <div className="w-14 h-11 bg-zinc-600 rounded-t" />
              <div className="w-10 h-8 bg-zinc-700 rounded-t" />
              <div className="w-12 h-12 bg-zinc-600 rounded-t" />
            </div>

            {/* Dotted connecting pursuit line */}
            <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-amber-400/40 pointer-events-none" />

            {/* Police Officer / Chaser Sprite (Moves dynamically based on gap!) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-200"
              style={{ left: `${chaserTrackOffset}%` }}
            >
              {/* Police Roof Siren Light (flashes red/blue) */}
              <div className="flex gap-1 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping border border-black shadow-[0_0_8px_#3b82f6]" />
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse border border-black shadow-[0_0_8px_#ef4444]" />
              </div>

              {/* Pixel Cop Character */}
              <div className="w-9 h-11 bg-blue-900 border-2 border-black rounded flex flex-col items-center justify-between p-1 shadow-retro-sm">
                <div className="w-5 h-3 bg-blue-600 rounded-t-sm border border-black" />
                <div className="w-4 h-2 bg-amber-300 rounded-sm" />
                <div className="w-5 h-3 bg-zinc-900 rounded-b border border-black" />
              </div>
              <span className="text-[9px] font-mono font-black text-rose-400 tracking-wider mt-1">
                CHASER
              </span>
            </div>

            {/* Player Runner Sprite (Right side) */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center">
              {/* Dynamic Speech Bubble */}
              <div className="relative -top-1 bg-amber-400 text-slate-950 font-mono font-black text-[10px] px-2.5 py-1 rounded-md shadow-md whitespace-nowrap mb-1">
                {speechText}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rotate-45" />
              </div>

              {/* Pixel Runner Character */}
              <div className="w-9 h-11 bg-cyan-600 border-2 border-black rounded flex flex-col items-center justify-between p-1 shadow-retro-sm">
                <div className="w-4 h-3 bg-amber-300 rounded-sm" />
                <div className="w-6 h-3 bg-cyan-400 rounded-sm border border-black" />
                <div className="flex gap-1 w-full justify-center">
                  <span className="w-1.5 h-3 bg-slate-900 rounded-b" />
                  <span className="w-1.5 h-3 bg-slate-900 rounded-b" />
                </div>
              </div>
              <span className="text-[9px] font-mono font-black text-amber-300 tracking-wider mt-1">
                YOU
              </span>
            </div>
          </div>

          {/* Bottom Track Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-900">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isNear ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`} />
              <span className="uppercase tracking-wider">LEVEL {currentLevel}: {activeLevel.title}</span>
            </div>
            <span className="tracking-wider text-zinc-400 uppercase hidden sm:inline">
              UNIT: {activeLevel.cruiserName}
            </span>
            <span className={`font-mono font-bold ${isNear ? 'text-red-400' : 'text-zinc-400'}`}>
              {gapMeters}m {isNear ? 'CLOSING IN' : 'CLEAR'}
            </span>
          </div>
        </div>

        {/* Modal Results for Busted / Escaped */}
        {gameState === 'busted' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-slate-950 border-3 border-red-500 rounded-3xl p-6 text-center flex flex-col gap-4 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <span className="text-5xl animate-bounce">🚨</span>
              <div>
                <h2 className="text-2xl font-mono font-black text-red-500 uppercase tracking-wider">
                  BUSTED!
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  The patrol closed the gap and boxed you in.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 font-mono">
                <div>
                  <span className="text-xs text-zinc-500 uppercase block">Words</span>
                  <span className="text-base font-bold text-white">{wordsCompleted}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase block">Speed</span>
                  <span className="text-base font-bold text-amber-400">{currentWpm} WPM</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase block">Accuracy</span>
                  <span className="text-base font-bold text-white">{accuracy}%</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <Link
                  href="/"
                  className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono font-bold text-xs border border-zinc-800 transition-all text-center"
                >
                  Main Menu
                </Link>
                <button
                  onClick={() => initRun()}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-retro-sm transition-all"
                >
                  Retry Escape
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'escaped' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-slate-950 border-3 border-emerald-400 rounded-3xl p-6 text-center flex flex-col gap-4 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <span className="text-5xl animate-bounce">🏆</span>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  LEVEL {currentLevel} CLEARED
                </span>
                <h2 className="text-2xl font-mono font-black text-emerald-400 uppercase tracking-wider mt-1">
                  {activeLevel.title}
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  You outran the {activeLevel.cruiserName} and reached the safehouse!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 font-mono">
                <div>
                  <span className="text-xs text-zinc-500 uppercase block">Words</span>
                  <span className="text-base font-bold text-white">{wordsCompleted}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase block">Speed</span>
                  <span className="text-base font-bold text-amber-400">{currentWpm} WPM</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase block">Accuracy</span>
                  <span className="text-base font-bold text-emerald-400">{accuracy}%</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <Link
                  href="/"
                  className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono font-bold text-xs border border-zinc-800 transition-all text-center"
                >
                  Main Menu
                </Link>
                {currentLevel < 5 ? (
                  <button
                    onClick={() => {
                      const nextLvl = currentLevel + 1;
                      setCurrentLevel(nextLvl);
                      initRun(nextLvl);
                    }}
                    className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-retro-sm transition-all"
                  >
                    NEXT LEVEL {currentLevel + 1} ▶
                  </button>
                ) : (
                  <button
                    onClick={() => initRun(1)}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-retro-sm transition-all"
                  >
                    ALL CLEARED! REPLAY L1 ▶
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Unified In-Game Pause, Exit & Options Modal */}
      <GameControlsModal
        isOpen={isControlsModalOpen}
        onClose={() => {
          setIsControlsModalOpen(false);
          setIsPaused(false);
          setTimeout(() => hiddenInputRef.current?.focus(), 50);
        }}
        onRestart={initRun}
        gameTitle="Police Pursuit Escape"
        gameModeBadge="HOT PURSUIT"
      />
    </div>
  );
}
