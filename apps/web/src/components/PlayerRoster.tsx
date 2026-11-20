'use client';

import React from 'react';
import { Player } from '@typefest/shared';
import { Avatar } from './Avatar';
import { Crown, Flame, Heart } from 'lucide-react';

interface PlayerRosterProps {
  players: Record<string, Player>;
  currentTurnPlayerId?: string;
  myPlayerId?: string;
}

export const PlayerRoster: React.FC<PlayerRosterProps> = ({
  players,
  currentTurnPlayerId,
  myPlayerId
}) => {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs select-none">
      <div className="flex items-center justify-between px-2 text-[11px] font-mono font-black uppercase text-slate-400 tracking-wider">
        <span>ARENA COMBATANTS ({sortedPlayers.length})</span>
        <span>SCORE</span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[460px] pr-1">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === myPlayerId;
          const isTurn = player.id === currentTurnPlayerId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition-all shadow-retro-sm ${
                isTurn
                  ? 'bg-amber-950/60 border-amber-400'
                  : isMe
                  ? 'bg-retro-card border-blue-500'
                  : 'bg-retro-card border-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {/* Rank Badge */}
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-mono font-black border border-black ${
                    index === 0
                      ? 'bg-amber-400 text-slate-950'
                      : index === 1
                      ? 'bg-slate-300 text-slate-900'
                      : index === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  {index + 1}
                </span>

                <Avatar config={player.avatar} size={42} status={player.status} />

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-white truncate max-w-[95px]">
                      {player.nickname}
                    </span>
                    {player.isHost && (
                      <span title="Host">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      </span>
                    )}
                    {isMe && (
                      <span className="text-[9px] font-mono font-black bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded border border-blue-500/40">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                    {player.lives !== undefined && player.lives < 3 && player.lives > 0 && (
                      <div className="flex items-center text-rose-400">
                        <Heart className="w-3 h-3 fill-current" />
                        <span className="ml-0.5 font-bold">{player.lives}</span>
                      </div>
                    )}

                    {player.streak >= 2 && (
                      <div className="flex items-center text-amber-400 font-bold">
                        <Flame className="w-3 h-3 fill-current" />
                        <span>{player.streak}</span>
                      </div>
                    )}

                    {player.status === 'submitted' && (
                      <span className="font-bold text-emerald-400">
                        DONE ✓
                      </span>
                    )}

                    {player.status === 'typing' && (
                      <span className="font-bold text-amber-400 animate-pulse">
                        TYPING...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-mono font-black text-amber-400">
                  {player.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
