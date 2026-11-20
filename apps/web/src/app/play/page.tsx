'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { getSocket } from '@/lib/socket';
import { PublicRoomSummary } from '@typefest/shared';
import { Users, Lock, Timer, Gamepad2, ArrowRight, RefreshCw, Plus } from 'lucide-react';
import Link from 'next/link';

export default function PlayBrowserPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<PublicRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = () => {
    setLoading(true);
    const socket = getSocket();
    socket.emit('room:list', (list) => {
      setRooms(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const joinRoom = (code: string) => {
    router.push(`/play/${code}`);
  };

  return (
    <div className="min-h-screen bg-retro-dark text-slate-100 flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between bg-retro-card border-2 border-slate-900 rounded-2xl p-4 shadow-retro">
          <div>
            <h1 className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-wide flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-amber-400" />
              PUBLIC ARENA BROWSER
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Jump into an open lobby with other players or create a private brawl room.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchRooms}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 border-2 border-slate-900 shadow-retro-sm transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Plus className="w-4 h-4" />
              <span>NEW ROOM</span>
            </Link>
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-slate-500 font-mono font-bold text-xs">
            SCANNING ARENA FREQUENCIES...
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-retro-card border-2 border-slate-900 flex items-center justify-center text-3xl mb-3 shadow-retro">
              ⚔️
            </div>
            <h3 className="text-lg font-mono font-black text-slate-200">
              NO PUBLIC ROOMS CURRENTLY ACTIVE
            </h3>
            <p className="text-xs font-mono text-slate-500 max-w-sm mt-1 mb-4">
              Host a new arena and invite friends or let random challengers join your room!
            </p>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-retro"
            >
              CREATE ARENA
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.code}
                className="flex flex-col justify-between p-4 bg-retro-card border-2 border-slate-900 hover:border-amber-400 rounded-xl shadow-retro transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-mono font-black text-amber-400 tracking-wider">
                      {room.code}
                    </span>
                    {room.hasPassword && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-mono text-[10px] flex items-center gap-1 border border-slate-800">
                        <Lock className="w-3 h-3" /> PASS
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-300 block truncate mb-3">
                    HOST: {room.hostName}
                  </span>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono font-bold text-slate-400 mb-4">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {room.mode}
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {room.timerSec}s
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 uppercase">
                      {room.difficulty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-400">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {room.playerCount} / {room.maxPlayers}
                    </span>
                  </div>

                  <button
                    onClick={() => joinRoom(room.code)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm group-hover:translate-x-[1px] group-hover:translate-y-[1px]"
                  >
                    <span>JOIN</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
