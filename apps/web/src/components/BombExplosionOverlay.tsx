'use client';

import React, { useEffect, useState } from 'react';

interface BombExplosionOverlayProps {
  explodedPlayerName?: string;
  isMe: boolean;
  remainingLives?: number;
  isEliminated: boolean;
  onAnimationEnd?: () => void;
}

export const BombExplosionOverlay: React.FC<BombExplosionOverlayProps> = ({
  explodedPlayerName,
  isMe,
  remainingLives = 0,
  isEliminated,
  onAnimationEnd
}) => {
  const [phase, setPhase] = useState<'flash' | 'detonation' | 'smoke'>('flash');

  useEffect(() => {
    // 1. Initial blinding flash (0ms - 250ms)
    const t1 = setTimeout(() => {
      setPhase('detonation');
    }, 250);

    // 2. Lingering smoke & results (250ms - 2800ms)
    const t2 = setTimeout(() => {
      setPhase('smoke');
    }, 1800);

    // 3. Complete animation
    const t3 = setTimeout(() => {
      onAnimationEnd?.();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onAnimationEnd]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden select-none">
      {/* 1. BLINDING FLASH LAYER */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          phase === 'flash'
            ? 'bg-amber-100 opacity-90'
            : phase === 'detonation'
            ? 'bg-gradient-to-b from-rose-950/80 via-red-950/90 to-black/95 opacity-90'
            : 'bg-black/80 opacity-70'
        }`}
      />

      {/* 2. FIERY VIGNETTE PULSE */}
      <div
        className="absolute inset-0 pointer-events-none animate-pulse"
        style={{
          boxShadow: 'inset 0 0 120px rgba(239, 68, 68, 0.8), inset 0 0 250px rgba(185, 28, 28, 0.6)'
        }}
      />

      {/* 3. EXPANDING SHOCKWAVE RINGS */}
      <div className="absolute flex items-center justify-center">
        <div className="w-48 h-48 sm:w-80 sm:h-80 rounded-full border-4 border-amber-400/80 animate-scale-up" />
        <div
          className="absolute w-64 h-64 sm:w-96 sm:h-96 rounded-full border-2 border-rose-500/60 animate-scale-up"
          style={{ animationDelay: '0.15s' }}
        />
        <div
          className="absolute w-80 h-80 sm:w-[480px] sm:h-[480px] rounded-full border-2 border-yellow-300/40 animate-scale-up"
          style={{ animationDelay: '0.3s' }}
        />
      </div>

      {/* 4. FLYING SHRAPNEL & FIRE PARTICLES */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[
          { icon: '💥', x: '-160px', y: '-130px', delay: '0.05s' },
          { icon: '🔥', x: '180px', y: '-120px', delay: '0.1s' },
          { icon: '💣', x: '-220px', y: '60px', delay: '0.15s' },
          { icon: '🔥', x: '210px', y: '110px', delay: '0.08s' },
          { icon: '⚡', x: '-110px', y: '170px', delay: '0.2s' },
          { icon: '💥', x: '130px', y: '-190px', delay: '0.12s' },
          { icon: '💨', x: '-240px', y: '-40px', delay: '0.18s' },
          { icon: '🔥', x: '230px', y: '-50px', delay: '0.22s' }
        ].map((p, idx) => (
          <span
            key={idx}
            className="absolute text-3xl sm:text-4xl animate-explosion"
            style={{
              transform: `translate(${p.x}, ${p.y})`,
              animationDelay: p.delay
            }}
          >
            {p.icon}
          </span>
        ))}
      </div>

      {/* 5. CENTER EXPLOSION IMPACT BANNER */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-6 max-w-lg mx-4 rounded-3xl bg-slate-950/90 border-4 border-rose-600 shadow-[0_0_80px_rgba(239,68,68,0.7)] animate-screen-shake">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-rose-600 to-amber-400 border-4 border-black flex items-center justify-center text-5xl sm:text-6xl mb-3 shadow-[0_0_40px_rgba(245,158,11,0.8)] animate-bounce-short">
          💥
        </div>

        <span className="text-3xl sm:text-5xl font-mono font-black text-rose-400 tracking-wider uppercase drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]">
          KABOOM!
        </span>

        <p className="text-sm sm:text-base font-mono font-bold text-amber-300 mt-2">
          THE BOMB EXPLODED ON{' '}
          <span className="text-white font-black underline decoration-rose-500">
            {explodedPlayerName || 'A PLAYER'}
          </span>
          !
        </p>

        {/* Dynamic status pill based on recipient */}
        <div className="mt-4">
          {isMe ? (
            isEliminated ? (
              <div className="flex flex-col items-center gap-1 px-4 py-2 bg-purple-950/90 border-2 border-purple-500 rounded-xl text-purple-200 font-mono font-black text-xs sm:text-sm animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                <span className="text-base">💀 YOU LOST ALL 3 LIVES!</span>
                <span className="text-[11px] text-amber-300">
                  ENTERING SPECTATOR MODE — WATCH & ENJOY THE REST OF THE MATCH!
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-950/90 border-2 border-rose-500 rounded-xl text-rose-300 font-mono font-black text-xs sm:text-sm animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                <span>💔 YOU LOST 1 HEART!</span>
                <span>({remainingLives} ❤️ REMAINING)</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/90 border-2 border-emerald-500 rounded-xl text-emerald-300 font-mono font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <span>🛡️ YOU SURVIVED THIS BLAST!</span>
              <span className="text-slate-400 text-xs">Stay alert for next round!</span>
            </div>
          )}
        </div>

        <span className="text-[10px] font-mono font-bold text-slate-400 mt-3 uppercase tracking-widest">
          Next round igniting in seconds...
        </span>
      </div>
    </div>
  );
};
