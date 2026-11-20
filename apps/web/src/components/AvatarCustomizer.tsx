'use client';

import React, { useState } from 'react';
import { Avatar, AVATAR_PALETTES, AVATAR_ARCHETYPES } from './Avatar';
import { AvatarConfig } from '@typefest/shared';
import { Shuffle, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface AvatarCustomizerProps {
  nickname: string;
  avatar: AvatarConfig;
  onNicknameChange: (name: string) => void;
  onAvatarChange: (avatar: AvatarConfig) => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  nickname,
  avatar,
  onNicknameChange,
  onAvatarChange
}) => {
  const currentArchetype = avatar.accessory % AVATAR_ARCHETYPES.length;
  const currentPaletteIdx = Math.max(
    0,
    AVATAR_PALETTES.findIndex((p) => p.bg === avatar.color)
  );

  const cycleArchetype = (direction: number) => {
    const total = AVATAR_ARCHETYPES.length;
    const next = (currentArchetype + direction + total) % total;
    onAvatarChange({ ...avatar, accessory: next });
  };

  const cyclePalette = (direction: number) => {
    const total = AVATAR_PALETTES.length;
    const next = (currentPaletteIdx + direction + total) % total;
    onAvatarChange({ ...avatar, color: AVATAR_PALETTES[next].bg });
  };

  const randomize = () => {
    const randomArchetype = Math.floor(Math.random() * AVATAR_ARCHETYPES.length);
    const randomPalette = AVATAR_PALETTES[Math.floor(Math.random() * AVATAR_PALETTES.length)];
    onAvatarChange({
      ...avatar,
      accessory: randomArchetype,
      color: randomPalette.bg
    });
  };

  const activeArchetypeInfo = AVATAR_ARCHETYPES[currentArchetype];

  return (
    <div className="bg-retro-card border-2 border-slate-900 rounded-2xl p-6 shadow-retro max-w-sm w-full mx-auto">
      {/* Codédex Retro Quest Card Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 border border-black inline-block" />
          <span className="text-xs font-mono font-black uppercase tracking-wider text-retro-accent">
            CHARACTER CARD
          </span>
        </div>
        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700">
          LVL 1
        </span>
      </div>

      {/* Character Showcase Stage */}
      <div className="relative flex flex-col items-center justify-center p-5 bg-retro-dark rounded-xl border-2 border-slate-900 shadow-inner mb-4">
        <button
          onClick={randomize}
          title="Randomize Hero"
          className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-retro-card border-2 border-slate-900 hover:bg-slate-800 text-amber-400 active:translate-x-[1px] active:translate-y-[1px] shadow-retro-sm transition-all"
        >
          <Shuffle className="w-4 h-4" />
        </button>

        <Avatar config={avatar} size={112} />

        {/* Character Title Badge */}
        <div className="mt-3 text-center">
          <span className="text-xs font-mono font-black text-white block">
            {activeArchetypeInfo.name}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block">
            {activeArchetypeInfo.desc}
          </span>
        </div>
      </div>

      {/* Nickname Input */}
      <div className="mb-4">
        <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
          PLAYER ALIAS
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-amber-400 font-mono font-bold">&gt;</span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder="TypeMaster"
            maxLength={14}
            className="w-full bg-slate-950 border-2 border-slate-900 focus:border-amber-400 rounded-xl py-2 pl-8 pr-3 text-white font-mono font-bold text-base focus:outline-none transition-all placeholder:text-slate-600 shadow-retro-sm"
          />
        </div>
      </div>

      {/* Character Selector Controls */}
      <div className="space-y-2">
        {/* Archetype Selector */}
        <div className="flex items-center justify-between bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-2 shadow-retro-sm">
          <button
            onClick={() => cycleArchetype(-1)}
            className="p-1 rounded text-amber-400 hover:text-white font-mono font-black"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Hero Archetype</span>
            <span className="text-xs font-mono font-black text-amber-300">{activeArchetypeInfo.name}</span>
          </div>
          <button
            onClick={() => cycleArchetype(1)}
            className="p-1 rounded text-amber-400 hover:text-white font-mono font-black"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Color Palette Palette Selector */}
        <div className="flex items-center justify-between bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-2 shadow-retro-sm">
          <button
            onClick={() => cyclePalette(-1)}
            className="p-1 rounded text-amber-400 hover:text-white font-mono font-black"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full border border-black inline-block shadow-sm"
              style={{ backgroundColor: AVATAR_PALETTES[currentPaletteIdx].bg }}
            />
            <span className="text-xs font-mono font-black text-white">
              {AVATAR_PALETTES[currentPaletteIdx].name}
            </span>
          </div>
          <button
            onClick={() => cyclePalette(1)}
            className="p-1 rounded text-amber-400 hover:text-white font-mono font-black"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
