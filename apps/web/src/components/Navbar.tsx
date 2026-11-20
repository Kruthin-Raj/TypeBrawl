'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Keyboard, Users, Swords, Gamepad2 } from 'lucide-react';
import { sound } from '@/lib/sound';
import { Avatar } from './Avatar';
import { AvatarConfig } from '@typefest/shared';

export const Navbar: React.FC = () => {
  const [soundOn, setSoundOn] = useState(true);
  const [user, setUser] = useState<{ nickname: string; avatar: AvatarConfig } | null>(null);

  useEffect(() => {
    setSoundOn(sound.isEnabled());

    const saved = localStorage.getItem('typefest_guest_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundOn(next);
  };

  return (
    <nav className="w-full bg-retro-dark border-b-2 border-slate-900 px-4 py-3 sticky top-0 z-40 shadow-retro-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-black flex items-center justify-center shadow-retro-sm group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
            <Swords className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-mono font-black text-white tracking-wider">
                Type<span className="text-amber-400">Brawl</span>
              </span>
              <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                4 GAMES
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 -mt-1 tracking-wider uppercase">
              RETRO MULTIPLAYER ARENA
            </span>
          </div>
        </Link>

        {/* Navigation Action Links (All 4 Games + Practice) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href="/play"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-mono font-black border-2 border-black active:translate-x-[2px] active:translate-y-[2px] shadow-retro-sm transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Arena</span>
          </Link>

          <Link
            href="/chase"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 text-xs font-mono font-bold border-2 border-slate-900 hover:border-rose-500/50 shadow-retro-sm transition-all"
          >
            <span>🚨 Chase</span>
          </Link>

          <Link
            href="/shooter"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-mono font-bold border-2 border-slate-900 hover:border-cyan-500/50 shadow-retro-sm transition-all"
          >
            <span>🚀 Shooter</span>
          </Link>

          <Link
            href="/keydash"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-mono font-bold border-2 border-slate-900 hover:border-amber-500/50 shadow-retro-sm transition-all"
          >
            <span>🏎️ Racer</span>
          </Link>

          <Link
            href="/practice"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-mono font-bold border-2 border-slate-800 hover:border-slate-700 active:translate-x-[1px] active:translate-y-[1px] shadow-retro-sm transition-all"
          >
            <Keyboard className="w-4 h-4 text-amber-400" />
            <span>Practice</span>
          </Link>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'SFX Enabled' : 'SFX Muted'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border-2 border-slate-800 active:translate-x-[1px] active:translate-y-[1px] shadow-retro-sm transition-all"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* User mini badge */}
          {user && (
            <Link
              href="/"
              className="hidden lg:flex items-center gap-2 pl-2 border-l-2 border-slate-800"
            >
              <Avatar config={user.avatar} size={34} />
              <div className="flex flex-col text-left">
                <span className="text-xs font-mono font-bold text-slate-200 truncate max-w-[80px]">
                  {user.nickname}
                </span>
                <span className="text-[9px] font-mono text-emerald-400">HERO</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
