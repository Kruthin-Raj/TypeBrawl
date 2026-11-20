'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '@/lib/sound';

interface DisplayBoardProps {
  word: string;
  round: number;
  totalRounds: number;
  timerSec: number;
  roundStartTime: number;
  roundEndTime: number;
  status: 'lobby' | 'countdown' | 'in-game' | 'round-end' | 'game-over';
  mode?: 'word-blitz' | 'bomb-pass' | 'type-or-die' | 'keydash-race';
  currentTurnPlayerName?: string;
  isCurrentTurn?: boolean;
  onSubmit: (word: string) => Promise<{ correct: boolean; scoreDelta: number; message?: string }>;
  isSubmitted: boolean;
  isEliminated: boolean;
}

export const DisplayBoard: React.FC<DisplayBoardProps> = ({
  word,
  round,
  totalRounds,
  timerSec,
  roundStartTime,
  roundEndTime,
  status,
  mode = 'word-blitz',
  currentTurnPlayerName,
  isCurrentTurn = true,
  onSubmit,
  isSubmitted,
  isEliminated
}) => {
  const [inputVal, setInputVal] = useState('');
  const [timeLeftSec, setTimeLeftSec] = useState(timerSec);
  const [progressPercent, setProgressPercent] = useState(100);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | null; text: string }>({
    type: null,
    text: ''
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputVal('');
    setFeedback({ type: null, text: '' });
    if (status === 'in-game' && !isSubmitted && !isEliminated && isCurrentTurn) {
      inputRef.current?.focus();
    }
  }, [word, round, status, isSubmitted, isEliminated, isCurrentTurn]);

  // Synchronized countdown timer loop
  useEffect(() => {
    if (status !== 'in-game' || !roundEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, roundEndTime - now);
      const totalMs = timerSec * 1000;
      const fraction = Math.max(0, remainingMs / totalMs);
      const remainingSec = Math.ceil(remainingMs / 1000);

      setTimeLeftSec(remainingSec);
      setProgressPercent(fraction * 100);

      if (remainingSec <= 3 && remainingSec > 0 && Math.floor(remainingMs % 1000) < 100) {
        sound.playTick();
      }

      if (remainingMs <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [status, roundEndTime, timerSec]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    sound.playKeyClick();

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!inputVal.trim() || isSubmitted || isEliminated) return;

      const res = await onSubmit(inputVal.trim());

      if (res.correct) {
        sound.playCorrect();
        setFeedback({ type: 'correct', text: `+${res.scoreDelta} PTS!` });
      } else {
        sound.playError();
        setFeedback({ type: 'wrong', text: res.message || 'TRY AGAIN!' });
        setInputVal('');
      }
    }
  };

  const isUrgent = timeLeftSec <= 3 && status === 'in-game';

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Top Banner (Round & Timer HUD) */}
      <div className="flex items-center justify-between w-full px-4 py-2 mb-2.5 bg-retro-card rounded-xl border-2 border-slate-900 font-mono font-bold text-xs shadow-retro-sm">
        <span className="text-amber-400 uppercase tracking-wider">
          ROUND {round} / {totalRounds}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">TIMER:</span>
          <span
            className={`px-3 py-0.5 rounded-lg text-sm font-black border-2 ${
              isUrgent
                ? 'bg-red-500/30 text-red-400 border-red-500 animate-pulse'
                : 'bg-slate-950 text-white border-black'
            }`}
          >
            {timeLeftSec}s
          </span>
        </div>
      </div>

      {/* Main Arcade Display Board */}
      <div
        className={`relative flex flex-col items-center justify-center w-full h-52 sm:h-64 rounded-2xl border-4 p-6 text-center shadow-retro-lg transition-all duration-200 overflow-hidden ${
          feedback.type === 'correct'
            ? 'bg-emerald-950 border-emerald-500'
            : feedback.type === 'wrong'
            ? 'bg-rose-950 border-rose-500 animate-wiggle'
            : 'bg-slate-950 border-slate-900'
        }`}
      >
        {/* Subtle scanline effect */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%)',
            backgroundSize: '100% 4px'
          }}
        />

        {status === 'in-game' && (
          <>
            {mode === 'bomb-pass' && (
              isCurrentTurn ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/25 border-2 border-rose-500 text-rose-300 font-mono font-black text-xs uppercase animate-pulse mb-1.5 z-10 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                  <span className="text-sm animate-bounce">💣</span>
                  <span>YOU HOLD THE BOMB! TYPE WORD & HIT ENTER TO PASS!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border-2 border-slate-800 text-amber-400 font-mono font-bold text-xs uppercase mb-1.5 z-10">
                  <span className="text-sm">💣</span>
                  <span>{currentTurnPlayerName || 'Another player'} holds the bomb! Stand by...</span>
                </div>
              )
            )}

            {mode === 'keydash-race' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-mono font-bold text-xs uppercase mb-1.5 z-10 animate-pulse">
                <span>🏎️</span>
                <span>SPEEDWAY SPRINT! Type word fast to burst your car ahead with nitro!</span>
              </div>
            )}

            {mode === 'type-or-die' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-950/60 border-2 border-orange-500 text-orange-300 font-mono font-bold text-xs uppercase mb-1.5 z-10 animate-pulse">
                <span>🌋</span>
                <span>RISING LAVA! Type the word before time runs out!</span>
              </div>
            )}

            <span className="text-[11px] uppercase font-mono font-extrabold tracking-widest text-slate-400 mb-1 z-10">
              TARGET WORD • PRESS ENTER TO SUBMIT
            </span>

            {/* Target Word */}
            <h2 className="text-4xl sm:text-6xl font-black text-amber-300 font-mono tracking-wider drop-shadow-[2px_2px_0px_#000] z-10 select-none py-2">
              {word}
            </h2>

            {mode === 'bomb-pass' && !isCurrentTurn && (
              <span className="mt-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-950/70 px-3 py-1 rounded-lg border border-amber-500/40 z-10">
                ⏳ Stand by for pass from {currentTurnPlayerName || 'active player'}...
              </span>
            )}
          </>
        )}

        {status === 'round-end' && (
          <div className="z-10 animate-bounce-short">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              ROUND ENDED
            </span>
            <h3 className="text-3xl font-mono font-black text-white mt-1">
              Word: <span className="text-amber-400">{word}</span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-1">Next round launching...</p>
          </div>
        )}

        {status === 'countdown' && (
          <div className="z-10 animate-pulse">
            <h3 className="text-4xl sm:text-5xl font-mono font-black text-amber-400 tracking-widest">
              GET READY!
            </h3>
          </div>
        )}

        {feedback.type && (
          <div
            className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-mono font-black uppercase tracking-wider border-2 border-black shadow-retro-sm z-20 ${
              feedback.type === 'correct' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Synchronized Progress Countdown Bar */}
        {status === 'in-game' && (
          <div className="absolute bottom-0 left-0 w-full h-3 bg-slate-900 border-t border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                isUrgent ? 'bg-rose-500 animate-pulse' : progressPercent < 50 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Input Bar & Action */}
      <div className="w-full mt-4">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={status !== 'in-game' || isSubmitted || isEliminated || !isCurrentTurn}
            placeholder={
              isEliminated
                ? '💀 Knocked out (Spectating Arena)'
                : isSubmitted
                ? mode === 'bomb-pass'
                  ? '💣 Passed the bomb! Waiting for next turn...'
                  : 'Submitted! Waiting for round end...'
                : mode === 'bomb-pass' && !isCurrentTurn
                ? `💣 ${currentTurnPlayerName || 'Active player'} has the bomb...`
                : mode === 'bomb-pass' && isCurrentTurn
                ? '💣 YOU HAVE THE BOMB! Type and hit ENTER to pass!'
                : mode === 'keydash-race'
                ? '🏎️ Type word and hit ENTER for Nitro burst!'
                : mode === 'type-or-die'
                ? '🌋 Type word before lava rises!'
                : 'Type word and hit ENTER...'
            }
            className={`w-full py-3.5 pl-5 pr-28 rounded-xl font-mono font-bold text-base sm:text-lg border-2 shadow-retro focus:outline-none transition-all placeholder:text-slate-600 ${
              isSubmitted
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                : isEliminated
                ? 'bg-slate-950 border-slate-900 text-slate-600'
                : 'bg-slate-950 border-slate-900 focus:border-amber-400 text-white'
            }`}
          />

          <button
            onClick={() => handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any)}
            disabled={status !== 'in-game' || isSubmitted || isEliminated || !isCurrentTurn || !inputVal.trim()}
            className="absolute right-2 px-4 py-2 rounded-lg font-mono font-black text-xs uppercase tracking-wider bg-amber-400 hover:bg-amber-300 active:translate-x-[1px] active:translate-y-[1px] text-slate-950 border-2 border-black shadow-retro-sm disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            ENTER ↵
          </button>
        </div>
      </div>
    </div>
  );
};
