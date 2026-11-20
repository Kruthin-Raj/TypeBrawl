'use client';

import React, { useEffect } from 'react';
import { Player } from '@typefest/shared';
import { Avatar } from './Avatar';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, LogOut } from 'lucide-react';
import { sound } from '@/lib/sound';

interface PodiumModalProps {
  standings: Player[];
  onPlayAgain: () => void;
  onReturnToLobby?: () => void;
  onExitRoom?: () => void;
  isHost: boolean;
}

export const PodiumModal: React.FC<PodiumModalProps> = ({
  standings,
  onPlayAgain,
  onReturnToLobby,
  onExitRoom,
  isHost
}) => {
  useEffect(() => {
    sound.playCorrect();

    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const first = standings[0];
  const second = standings[1];
  const third = standings[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none animate-fadeIn">
      <div className="bg-retro-card border-4 border-slate-900 rounded-2xl p-6 sm:p-8 max-w-xl w-full text-center shadow-retro-lg relative">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="w-8 h-8 text-amber-400" />
          <h2 className="text-2xl sm:text-3xl font-mono font-black text-amber-300 uppercase tracking-widest">
            ARENA VICTORS
          </h2>
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>

        {/* 3-Pedestal Podium */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 my-6 h-64">
          {/* 2nd Place */}
          {second && (
            <div className="flex flex-col items-center flex-1">
              <Avatar config={second.avatar} size={64} className="mb-2" />
              <span className="font-mono font-bold text-xs text-white truncate max-w-[85px]">
                {second.nickname}
              </span>
              <span className="text-xs font-mono font-black text-slate-400">
                {second.score} pts
              </span>
              <div className="w-full h-28 bg-slate-800 rounded-t-xl border-2 border-slate-900 flex items-center justify-center text-2xl font-mono font-black text-slate-300 shadow-retro-sm mt-2">
                2
              </div>
            </div>
          )}

          {/* 1st Place */}
          {first && (
            <div className="flex flex-col items-center flex-1">
              <div className="relative">
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">
                  👑
                </span>
                <Avatar config={first.avatar} size={84} className="mb-2" />
              </div>
              <span className="font-mono font-black text-sm text-amber-300 truncate max-w-[95px]">
                {first.nickname}
              </span>
              <span className="text-sm font-mono font-black text-amber-400">
                {first.score} pts
              </span>
              <div className="w-full h-40 bg-amber-400 rounded-t-xl border-2 border-black flex items-center justify-center text-4xl font-mono font-black text-slate-950 shadow-retro mt-2">
                1
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="flex flex-col items-center flex-1">
              <Avatar config={third.avatar} size={56} className="mb-2" />
              <span className="font-mono font-bold text-xs text-white truncate max-w-[80px]">
                {third.nickname}
              </span>
              <span className="text-xs font-mono font-black text-amber-600">
                {third.score} pts
              </span>
              <div className="w-full h-20 bg-amber-900/60 rounded-t-xl border-2 border-slate-900 flex items-center justify-center text-xl font-mono font-black text-white shadow-retro-sm mt-2">
                3
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {isHost ? (
            <>
              <button
                onClick={onPlayAgain}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-mono font-black text-sm uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                ⚡ REMATCH
              </button>

              <button
                onClick={onReturnToLobby}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-mono font-black text-sm uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                🏠 RETURN TO LOBBY
              </button>
            </>
          ) : (
            <button
              onClick={onReturnToLobby}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-mono font-black text-sm uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              🏠 RETURN TO LOBBY
            </button>
          )}

          <button
            onClick={onExitRoom}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-mono font-black text-sm uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-300 border-2 border-slate-800 shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            EXIT ROOM
          </button>
        </div>
      </div>
    </div>
  );
};
