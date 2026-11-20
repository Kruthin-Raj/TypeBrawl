'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Avatar } from '@/components/Avatar';
import { AvatarConfig, EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, GAMING_WORDS } from '@typefest/shared';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { GameControlsModal } from '@/components/GameControlsModal';
import {
  Zap,
  Flag,
  RotateCcw,
  Gauge,
  Flame,
  Award,
  Swords,
  ChevronRight,
  ShieldAlert,
  Pause,
  Play,
  Sliders,
  Volume2,
  VolumeX
} from 'lucide-react';

interface BotRacer {
  id: string;
  name: string;
  wpm: number;
  avatar: AvatarConfig;
  progressPercent: number;
}

const BOT_CONFIGS = [
  {
    name: 'Blitz Bot',
    color: '#06B6D4',
    accessory: 2,
    baseWpm: 45
  },
  {
    name: 'Nova AI',
    color: '#EC4899',
    accessory: 3,
    baseWpm: 60
  },
  {
    name: 'Pico Mecha',
    color: '#22C55E',
    accessory: 4,
    baseWpm: 75
  }
];

export default function KeyDashPage() {
  const [difficulty, setDifficulty] = useState<'novice' | 'pro' | 'master'>('pro');
  const [gameState, setGameState] = useState<'ready' | 'racing' | 'finished'>('ready');
  const [isPaused, setIsPaused] = useState(false);
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Player info
  const [playerAvatar, setPlayerAvatar] = useState<AvatarConfig>({
    color: '#F59E0B',
    eyes: 0,
    mouth: 0,
    accessory: 0
  });
  const [playerName, setPlayerName] = useState('You');

  // Words stream
  const [wordsList, setWordsList] = useState<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [nitroActive, setNitroActive] = useState(false);

  // Metrics
  const [startTime, setStartTime] = useState<number | null>(null);
  const [playerWpm, setPlayerWpm] = useState(0);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [finishRank, setFinishRank] = useState<number>(1);

  // Bots state
  const [bots, setBots] = useState<BotRacer[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const loopRef = useRef<NodeJS.Timeout | null>(null);

  // Load guest user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('typefest_guest_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.avatar) setPlayerAvatar(parsed.avatar);
        if (parsed.nickname) setPlayerName(parsed.nickname);
      } catch {}
    }
    setSoundOn(sound.isEnabled());
  }, []);

  // Initialize a new race
  const initRace = () => {
    const pool = [...EASY_WORDS, ...MEDIUM_WORDS, ...GAMING_WORDS];
    const generated: string[] = [];
    for (let i = 0; i < 28; i++) {
      generated.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setWordsList(generated);
    setCurrentWordIdx(0);
    setInputVal('');
    setStreak(0);
    setMaxStreak(0);
    setNitroActive(false);
    setPlayerProgress(0);
    setPlayerWpm(0);
    setStartTime(null);
    setGameState('ready');
    setIsPaused(false);

    // Bot speed adjustment
    const speedMult = difficulty === 'novice' ? 0.7 : difficulty === 'pro' ? 1.0 : 1.35;

    const initialBots: BotRacer[] = BOT_CONFIGS.map((b, idx) => ({
      id: `bot-${idx}`,
      name: b.name,
      wpm: Math.round(b.baseWpm * speedMult),
      avatar: { color: b.color, eyes: 1, mouth: 0, accessory: b.accessory },
      progressPercent: 0
    }));

    setBots(initialBots);
  };

  useEffect(() => {
    initRace();
  }, [difficulty]);

  // Start race
  const startRace = () => {
    sound.playGo();
    setGameState('racing');
    setIsPaused(false);
    setStartTime(Date.now());
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Bot simulation loop during active race
  useEffect(() => {
    if (gameState !== 'racing' || !startTime || isPaused) return;

    loopRef.current = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      const totalWords = wordsList.length || 28;

      setBots((prevBots) =>
        prevBots.map((bot) => {
          const wordsCompleted = (bot.wpm / 60) * elapsedSec;
          const progress = Math.min(100, Math.round((wordsCompleted / totalWords) * 100));
          return { ...bot, progressPercent: progress };
        })
      );
    }, 200);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [gameState, startTime, wordsList.length, isPaused]);

  // Keyboard shortcut listener (ESC to Pause)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsPaused(!isPaused);
      setIsControlsModalOpen(!isPaused);
    }
  };

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'racing' || isPaused) return;
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
        if (newStreak > maxStreak) setMaxStreak(newStreak);

        // Nitro boost trigger at 4+ streak
        if (newStreak >= 4 && !nitroActive) {
          setNitroActive(true);
        }

        const prog = Math.min(100, Math.round((nextIdx / wordsList.length) * 100));
        setPlayerProgress(prog);

        // Update WPM
        if (startTime) {
          const elapsedMin = (Date.now() - startTime) / 60000;
          if (elapsedMin > 0) {
            setPlayerWpm(Math.round(nextIdx / elapsedMin));
          }
        }

        // Finish line crossed!
        if (nextIdx >= wordsList.length) {
          finishRace();
        }
      } else if (val.endsWith(' ')) {
        // Mistyped word
        sound.playError();
        setStreak(0);
        setNitroActive(false);
      } else {
        setInputVal(val);
      }
    } else {
      setInputVal(val);
    }
  };

  const finishRace = () => {
    if (loopRef.current) clearInterval(loopRef.current);
    setGameState('finished');
    sound.playCorrect();

    const botProgresses = bots.map((b) => b.progressPercent);
    const botsAhead = botProgresses.filter((p) => p >= 100).length;
    const rank = botsAhead + 1;
    setFinishRank(rank);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const currentTargetWord = wordsList[currentWordIdx] || '';

  return (
    <div className="min-h-screen bg-retro-dark text-slate-100 flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* KeyDash Arcade Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-retro-card border-2 border-slate-900 rounded-2xl p-4 shadow-retro">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-black flex items-center justify-center text-slate-950 font-black text-xl shadow-retro-sm">
              🏎️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-mono font-black text-white">
                  KEYDASH ARCADE RACER
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 border border-black shadow-retro-sm">
                  RACE MODE
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Type words to dash across the neon track and outrun the AI rival racers.
              </p>
            </div>
          </div>

          {/* Controls: Difficulty + Sound + Pause + Options + Exit */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold">
              {(['novice', 'pro', 'master'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    setDifficulty(diff);
                    initRace();
                  }}
                  disabled={gameState === 'racing'}
                  className={`px-3 py-1 rounded-lg uppercase tracking-wider transition-all ${
                    difficulty === diff
                      ? 'bg-amber-400 text-slate-950 font-black shadow-retro-sm'
                      : 'text-slate-400 hover:text-white disabled:opacity-40'
                  }`}
                >
                  {diff}
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
              {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Pause Button */}
            {gameState === 'racing' && (
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
              title="Options & Audio"
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

        {/* Real-Time Live HUD Stats */}
        <div className="grid grid-cols-4 gap-3 bg-retro-card border-2 border-slate-900 rounded-xl p-3 text-center shadow-retro">
          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              SPEED
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400">
              {playerWpm} <span className="text-xs text-slate-400 font-bold">WPM</span>
            </span>
          </div>

          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              WORD STREAK
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-amber-400 fill-current" />
              {streak}
            </span>
          </div>

          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              NITRO BOOST
            </span>
            <span
              className={`text-2xl sm:text-3xl font-mono font-black ${
                nitroActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
              }`}
            >
              {nitroActive ? 'ACTIVE ⚡' : `${Math.min(streak, 4)} / 4`}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              PROGRESS
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-purple-400">
              {playerProgress}%
            </span>
          </div>
        </div>

        {/* 🏎️ KEYDASH MULTI-LANE RACE TRACK */}
        <div className="bg-slate-950 border-4 border-slate-900 rounded-2xl p-4 sm:p-6 shadow-retro-lg flex flex-col gap-3 relative overflow-hidden">
          {/* Finish Line Checkered Banner */}
          <div className="absolute right-8 top-0 bottom-0 w-4 bg-[repeating-linear-gradient(45deg,#fff,#fff_4px,#000_4px,#000_8px)] opacity-40 pointer-events-none" />

          {/* Lane 1: Player (YOU) */}
          <div className="relative flex items-center bg-retro-card/90 border-2 border-amber-400/80 rounded-xl p-2.5 h-16 shadow-retro-sm">
            <div
              className="absolute left-3 transition-all duration-300 flex items-center gap-2"
              style={{ left: `calc(${playerProgress}% * 0.85 + 12px)` }}
            >
              <Avatar config={playerAvatar} size={42} />
              <div className="flex flex-col text-left">
                <span className="text-xs font-mono font-black text-amber-300">
                  {playerName} (YOU)
                </span>
                {nitroActive && (
                  <span className="text-[9px] font-mono font-black text-cyan-400 animate-pulse">
                    ⚡ NITRO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lanes 2-4: AI Rival Racers */}
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="relative flex items-center bg-slate-900/80 border-2 border-slate-900 rounded-xl p-2.5 h-14"
            >
              <div
                className="absolute left-3 transition-all duration-300 flex items-center gap-2"
                style={{ left: `calc(${bot.progressPercent}% * 0.85 + 12px)` }}
              >
                <Avatar config={bot.avatar} size={36} />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-mono font-bold text-slate-300">
                    {bot.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {bot.wpm} WPM
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Typing Stage */}
        <div className="bg-retro-card border-2 border-slate-900 rounded-2xl p-6 shadow-retro flex flex-col items-center">
          {gameState === 'ready' && (
            <div className="flex flex-col items-center text-center py-4">
              <h3 className="text-2xl font-mono font-black text-amber-300 mb-2">
                READY ON THE STARTING GRID!
              </h3>
              <p className="text-xs font-mono text-slate-400 mb-4 max-w-sm">
                Type each word and hit Space to dash forward. Maintain a 4-word streak to activate Nitro speed!
              </p>
              <button
                onClick={startRace}
                className="px-8 py-3.5 rounded-xl font-mono font-black text-base uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                START RACE 🏁
              </button>
            </div>
          )}

          {gameState === 'racing' && (
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
                  onKeyDown={handleKeyDown}
                  placeholder={isPaused ? 'Game Paused (Press Esc to resume)' : 'Type the word and press SPACE...'}
                  disabled={isPaused}
                  className="w-full py-3.5 px-5 bg-slate-950 border-2 border-slate-900 focus:border-amber-400 rounded-xl font-mono font-bold text-lg text-white focus:outline-none shadow-retro-sm text-center disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="flex flex-col items-center text-center py-4 animate-bounce-short">
              <span className="text-4xl mb-2">
                {finishRank === 1 ? '🥇' : finishRank === 2 ? '🥈' : '🥉'}
              </span>
              <h3 className="text-2xl font-mono font-black text-amber-300">
                {finishRank === 1 ? '1ST PLACE VICTORY!' : `FINISHED IN #${finishRank} PLACE`}
              </h3>
              <p className="text-sm font-mono text-slate-300 mt-1 mb-4">
                Average Speed: <span className="text-amber-400 font-bold">{playerWpm} WPM</span> • Max Streak:{' '}
                <span className="text-emerald-400 font-bold">{maxStreak}</span>
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-bold text-xs border border-slate-800 transition-all"
                >
                  Main Menu
                </Link>
                <button
                  onClick={initRace}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-mono font-black bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-black shadow-retro text-xs uppercase tracking-wider active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <RotateCcw className="w-4 h-4" /> RACE AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Unified In-Game Pause, Exit & Options Modal */}
      <GameControlsModal
        isOpen={isControlsModalOpen}
        onClose={() => {
          setIsControlsModalOpen(false);
          setIsPaused(false);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        onRestart={initRace}
        gameTitle="KeyDash Arcade Racer"
        gameModeBadge="ARCADE RACER"
      />
    </div>
  );
}
