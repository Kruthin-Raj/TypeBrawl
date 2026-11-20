'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Player, RoomStatus } from '@typefest/shared';
import { Avatar } from './Avatar';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { Flame, Trophy, Zap, Flag, Gauge } from 'lucide-react';

interface MultiplayerRacerProps {
  paragraph: string;
  status: RoomStatus;
  roundStartTime: number;
  players: Record<string, Player>;
  myId: string;
  difficulty: string;
  onProgress: (data: { progressPercent: number; wpm: number; accuracy: number }) => void;
}

export const MultiplayerRacer: React.FC<MultiplayerRacerProps> = ({
  paragraph,
  status,
  roundStartTime,
  players,
  myId,
  difficulty,
  onProgress
}) => {
  const wordsList = useMemo(() => {
    return paragraph ? paragraph.trim().split(/\s+/) : [];
  }, [paragraph]);

  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [nitroActive, setNitroActive] = useState(false);
  const [correctLetters, setCorrectLetters] = useState(0);
  const [totalLettersTyped, setTotalLettersTyped] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when new paragraph / round begins
  useEffect(() => {
    setCurrentWordIdx(0);
    setCurrentInput('');
    setStreak(0);
    setNitroActive(false);
    setCorrectLetters(0);
    setTotalLettersTyped(0);
    setIsFinished(false);

    if (status === 'in-game') {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [paragraph, status]);

  // WPM & Accuracy calculation
  const accuracy = useMemo(() => {
    if (totalLettersTyped === 0) return 100;
    return Math.min(100, Math.round((correctLetters / totalLettersTyped) * 100));
  }, [correctLetters, totalLettersTyped]);

  const wpm = useMemo(() => {
    if (!roundStartTime || currentWordIdx === 0) return 0;
    const elapsedMinutes = (Date.now() - roundStartTime) / 60000;
    if (elapsedMinutes <= 0.05) return 0;
    return Math.round(currentWordIdx / elapsedMinutes);
  }, [roundStartTime, currentWordIdx]);

  const myProgress = useMemo(() => {
    if (wordsList.length === 0) return 0;
    return Math.min(100, Math.round((currentWordIdx / wordsList.length) * 100));
  }, [currentWordIdx, wordsList.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (status !== 'in-game' || isFinished) return;

    if (e.key === ' ') {
      e.preventDefault();
      const targetWord = wordsList[currentWordIdx];
      if (!targetWord) return;

      const cleanInput = currentInput.trim();
      const isWordMatch = cleanInput.toLowerCase() === targetWord.toLowerCase();

      if (isWordMatch) {
        sound.playCorrect();
        const nextIdx = currentWordIdx + 1;
        setCurrentWordIdx(nextIdx);
        setCurrentInput('');

        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak >= 4 && !nitroActive) {
          setNitroActive(true);
        }

        const newCorrectLetters = correctLetters + targetWord.length + 1;
        const newTotalLetters = totalLettersTyped + cleanInput.length + 1;
        setCorrectLetters(newCorrectLetters);
        setTotalLettersTyped(newTotalLetters);

        const newProg = Math.min(100, Math.round((nextIdx / wordsList.length) * 100));
        const newAcc = Math.min(100, Math.round((newCorrectLetters / newTotalLetters) * 100));
        const elapsedMin = roundStartTime ? Math.max(0.05, (Date.now() - roundStartTime) / 60000) : 0.1;
        const newWpm = Math.round(nextIdx / elapsedMin);

        onProgress({
          progressPercent: newProg,
          wpm: newWpm,
          accuracy: newAcc
        });

        // Finish line crossed!
        if (nextIdx >= wordsList.length) {
          setIsFinished(true);
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
      } else {
        sound.playError();
        setStreak(0);
        setNitroActive(false);
        setTotalLettersTyped((t) => t + cleanInput.length);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== 'in-game' || isFinished) return;
    const val = e.target.value;
    if (val.includes(' ')) return; // Handled in onKeyDown

    sound.playKeyClick();
    setCurrentInput(val);

    const targetWord = wordsList[currentWordIdx] || '';
    // If last word of paragraph typed correctly without space
    if (currentWordIdx === wordsList.length - 1 && val.toLowerCase() === targetWord.toLowerCase()) {
      sound.playCorrect();
      setIsFinished(true);
      const nextIdx = wordsList.length;
      setCurrentWordIdx(nextIdx);
      setCurrentInput('');

      const newCorrect = correctLetters + targetWord.length;
      const newTotal = totalLettersTyped + val.length;
      const elapsedMin = roundStartTime ? Math.max(0.05, (Date.now() - roundStartTime) / 60000) : 0.1;
      const finalWpm = Math.round(nextIdx / elapsedMin);
      const finalAcc = Math.min(100, Math.round((newCorrect / newTotal) * 100));

      onProgress({
        progressPercent: 100,
        wpm: finalWpm,
        accuracy: finalAcc
      });

      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    }
  };

  const playersList = Object.values(players);
  const me = players[myId];

  return (
    <div className="flex flex-col gap-4 w-full select-none">
      {/* 🏎️ REAL-TIME MULTIPLAYER ASYMMETRIC SPEEDWAY TRACK */}
      <div className="bg-slate-950 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-retro flex flex-col gap-3 relative overflow-hidden">
        {/* Track Header */}
        <div className="flex items-center justify-between text-xs font-mono font-black text-amber-400 border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base animate-bounce">🏎️</span>
            <span>KEYDASH MULTIPLAYER SPEEDWAY CIRCUIT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
              DIFF: {difficulty}
            </span>
          </div>
        </div>

        {/* Lanes Grid */}
        <div className="flex flex-col gap-2 relative">
          {/* Finish Line Checkered Strip */}
          <div className="absolute right-6 top-0 bottom-0 w-4 bg-[repeating-conic-gradient(#fff_0_90deg,#000_90deg_180deg)] [background-size:8px_8px] opacity-40 pointer-events-none z-10" />

          {playersList.map((p) => {
            const isMe = p.id === myId;
            const progress = p.progressPercent || 0;
            const isLeader = progress > 0 && progress === Math.max(...playersList.map((pl) => pl.progressPercent || 0));

            return (
              <div
                key={p.id}
                className={`relative h-12 bg-slate-900/90 rounded-xl flex items-center px-3 border transition-all overflow-hidden ${
                  isMe
                    ? 'border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.25)] bg-slate-900'
                    : 'border-slate-800'
                }`}
              >
                {/* Lane center dashed line */}
                <div className="absolute inset-x-0 h-[1px] border-b border-dashed border-slate-800 pointer-events-none" />

                {/* Car & Avatar Moving along Track */}
                <div
                  className="absolute transition-all duration-300 ease-out flex items-center gap-2.5 z-20"
                  style={{ left: `calc(${progress}% * 0.85 + 8px)` }}
                >
                  <div className="relative">
                    <Avatar config={p.avatar} size={30} status={p.status} />
                    <span className="absolute -bottom-1 -right-1 text-xs">🏎️</span>
                  </div>

                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-black text-white truncate max-w-[95px]">
                        {p.nickname} {isMe ? '(YOU)' : ''}
                      </span>
                      {p.finishRank ? (
                        <span
                          className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded border ${
                            p.finishRank === 1
                              ? 'bg-amber-400 text-slate-950 border-black'
                              : p.finishRank === 2
                              ? 'bg-slate-300 text-slate-950 border-black'
                              : 'bg-amber-700 text-white border-black'
                          }`}
                        >
                          {p.finishRank === 1 ? '👑 1ST' : p.finishRank === 2 ? '🥈 2ND' : `${p.finishRank}RD`}
                        </span>
                      ) : (
                        isLeader && (
                          <span className="text-[9px] font-mono font-bold text-amber-400">
                            LEADER
                          </span>
                        )
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      {p.wpm || 0} WPM • {p.accuracy || 100}% ACC
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📊 LIVE HUD STATS ROW */}
      <div className="grid grid-cols-4 gap-3 bg-retro-card border-2 border-slate-900 rounded-xl p-3 text-center shadow-retro">
        <div className="border-r border-slate-800">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            SPEED
          </span>
          <span className="text-xl sm:text-2xl font-mono font-black text-amber-400">
            {wpm} <span className="text-xs text-slate-400 font-bold">WPM</span>
          </span>
        </div>

        <div className="border-r border-slate-800">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ACCURACY
          </span>
          <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
            {accuracy}%
          </span>
        </div>

        <div className="border-r border-slate-800">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            NITRO STREAK
          </span>
          <span className="text-xl sm:text-2xl font-mono font-black text-purple-400 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 text-amber-400 fill-current" />
            {streak}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            TRACK PROGRESS
          </span>
          <span className="text-xl sm:text-2xl font-mono font-black text-cyan-400">
            {myProgress}%
          </span>
        </div>
      </div>

      {/* 📖 PARAGRAPH READING STREAM & LIVE INPUT */}
      <div className="bg-retro-card border-4 border-slate-900 rounded-2xl p-5 sm:p-6 shadow-retro-lg flex flex-col gap-4">
        {/* Paragraph stream tokens */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="bg-slate-950 border-2 border-slate-900 rounded-xl p-4 sm:p-5 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-base sm:text-lg font-mono leading-relaxed max-h-56 overflow-y-auto cursor-text shadow-inner"
        >
          {wordsList.map((word, idx) => {
            const isPast = idx < currentWordIdx;
            const isCurrent = idx === currentWordIdx;

            if (isPast) {
              return (
                <span key={idx} className="text-emerald-400 font-bold">
                  {word}
                </span>
              );
            }

            if (isCurrent) {
              return (
                <span
                  key={idx}
                  className="relative bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  {word.split('').map((char, charIdx) => {
                    const typedChar = currentInput[charIdx];
                    let charClass = 'text-amber-200';

                    if (typedChar !== undefined) {
                      if (typedChar.toLowerCase() === char.toLowerCase()) {
                        charClass = 'text-emerald-400 font-black underline underline-offset-4';
                      } else {
                        charClass = 'text-rose-500 font-black bg-rose-950/80 rounded px-0.5';
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
              <span key={idx} className="text-slate-400">
                {word}
              </span>
            );
          })}
        </div>

        {/* Input Bar & Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={status !== 'in-game' || isFinished}
            placeholder={
              isFinished
                ? '🏁 Finished! Checkered flag crossed!'
                : status !== 'in-game'
                ? '🏎️ Race starting soon...'
                : 'Type the highlighted word and press Space...'
            }
            className="w-full bg-slate-950 border-3 border-amber-400/70 focus:border-amber-400 text-white font-mono text-base px-4 py-3 rounded-xl outline-none shadow-retro-sm transition-all placeholder:text-slate-600 disabled:opacity-50"
          />

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300 border border-slate-700">Space</kbd> after each word</span>
            {nitroActive && (
              <span className="text-cyan-400 font-bold animate-pulse flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                NITRO BURST ACTIVE!
              </span>
            )}
          </div>
        </div>

        {/* Finish celebratory banner */}
        {isFinished && (
          <div className="bg-emerald-950/40 border-2 border-emerald-500 rounded-xl p-4 text-center animate-in fade-in flex items-center justify-center gap-3">
            <span className="text-2xl">🏁</span>
            <div>
              <h4 className="text-sm font-mono font-black text-emerald-400 uppercase tracking-wider">
                {me?.finishRank ? `FINISH RANK: #${me.finishRank} PLACE!` : 'FINISH LINE CROSSED!'}
              </h4>
              <p className="text-xs font-mono text-slate-300">
                Final Speed: <span className="text-amber-400 font-bold">{wpm} WPM</span> • Accuracy: <span className="text-emerald-400 font-bold">{accuracy}%</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
