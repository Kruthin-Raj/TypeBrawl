'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { DisplayBoard } from '@/components/DisplayBoard';
import { PlayerRoster } from '@/components/PlayerRoster';
import { PartyChat } from '@/components/PartyChat';
import { PodiumModal } from '@/components/PodiumModal';
import { getSocket } from '@/lib/socket';
import { sound } from '@/lib/sound';
import {
  RoomState,
  ChatMessage,
  AvatarConfig
} from '@typefest/shared';
import {
  Copy,
  Check,
  Play,
  Gamepad2,
  Timer,
  Swords
} from 'lucide-react';

export default function PlayRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = String(params.code).toUpperCase();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [myId, setMyId] = useState<string>('');

  useEffect(() => {
    const socket = getSocket();
    setMyId(socket.id || '');

    const saved = localStorage.getItem('typefest_guest_user');
    let guestUser = {
      nickname: 'SpeedTyper',
      avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } as AvatarConfig
    };

    if (saved) {
      try {
        guestUser = JSON.parse(saved);
      } catch {}
    }

    socket.emit(
      'room:join',
      {
        roomCode,
        player: guestUser
      },
      (res) => {
        if (!res.success) {
          alert(res.error || 'Failed to join room');
          router.push('/');
        }
      }
    );

    socket.on('room:state', (newState) => {
      setRoom(newState);
      if (socket.id) setMyId(socket.id);
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('game:countdown', () => {
      sound.playTick();
    });

    socket.on('game:round_start', () => {
      sound.playGo();
    });

    socket.on('game:word_solved', () => {
      sound.playCorrect();
    });

    return () => {
      socket.off('room:state');
      socket.off('chat:message');
      socket.off('game:countdown');
      socket.off('game:round_start');
      socket.off('game:word_solved');
    };
  }, [roomCode, router]);

  const copyInviteLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleStartGame = () => {
    sound.playGo();
    const socket = getSocket();
    socket.emit('room:start');
  };

  const handleSendMessage = (text: string) => {
    const socket = getSocket();
    socket.emit('chat:send', text);
  };

  const handleSubmitWord = (word: string): Promise<{ correct: boolean; scoreDelta: number; message?: string }> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit('game:submit_word', word, (res) => {
        resolve(res);
      });
    });
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-retro-dark text-white flex flex-col items-center justify-center font-mono">
        <h2 className="text-xl font-black text-amber-400 animate-pulse">
          INITIALIZING ARENA CONNECTION [{roomCode}]...
        </h2>
      </div>
    );
  }

  const isHost = room.hostId === myId;
  const me = room.players[myId];
  const isSubmitted = me?.status === 'submitted';
  const isEliminated = me?.lives !== undefined && me?.lives <= 0;
  const isTurn = room.currentTurnPlayerId ? room.currentTurnPlayerId === myId : true;

  return (
    <div className="min-h-screen bg-retro-dark text-slate-100 flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Room Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-retro-card border-2 border-slate-900 rounded-xl px-5 py-3 shadow-retro">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              ARENA CODE:
            </span>
            <span className="text-xl font-mono font-black text-amber-400 tracking-widest bg-slate-950 px-3 py-1 rounded-lg border-2 border-slate-900 shadow-retro-sm">
              {room.code}
            </span>

            <button
              onClick={copyInviteLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-xs font-mono font-bold text-slate-200 border-2 border-slate-900 shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedLink ? 'COPIED!' : 'COPY LINK'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono font-bold text-slate-300">
            <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
              {room.settings.mode}
            </span>
            <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              {room.settings.timerSec}s
            </span>
            <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 uppercase">
              {room.settings.difficulty}
            </span>

            {/* Leave Room Button */}
            <Link
              href="/"
              className="px-3 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900 shadow-retro-sm transition-all"
            >
              EXIT
            </Link>
          </div>
        </div>

        {/* LOBBY STATE */}
        {room.status === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-retro-card border-4 border-slate-900 rounded-2xl text-center shadow-retro">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 border-2 border-black flex items-center justify-center text-slate-950 mb-3 shadow-retro">
              <Swords className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-mono font-black text-amber-300 uppercase tracking-widest mb-1">
              ARENA STAGING AREA
            </h2>
            <p className="text-xs font-mono text-slate-400 max-w-md mb-6">
              Share code <span className="text-amber-400 font-bold">[{room.code}]</span> with challengers to join.
            </p>

            {/* Players cards grid in lobby */}
            <div className="flex flex-wrap justify-center gap-3.5 max-w-2xl mb-8">
              {Object.values(room.players).map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col items-center p-3 bg-slate-950 border-2 border-slate-900 rounded-xl w-32 shadow-retro-sm"
                >
                  <PlayerRoster players={{ [p.id]: p }} myPlayerId={myId} />
                </div>
              ))}
            </div>

            {/* Host Start Game Action */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-mono font-black text-base uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                START BRAWL!
              </button>
            ) : (
              <div className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 animate-pulse">
                WAITING FOR HOST TO LAUNCH ARENA...
              </div>
            )}
          </div>
        )}

        {/* IN-GAME ARENA LAYOUT */}
        {(room.status === 'in-game' || room.status === 'countdown' || room.status === 'round-end') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            <div className="lg:col-span-3 order-2 lg:order-1">
              <PlayerRoster
                players={room.players}
                currentTurnPlayerId={room.currentTurnPlayerId}
                myPlayerId={myId}
              />
            </div>

            <div className="lg:col-span-6 flex items-center justify-center order-1 lg:order-2">
              <DisplayBoard
                word={room.currentWord}
                round={room.currentRound}
                totalRounds={room.settings.rounds}
                timerSec={room.settings.timerSec}
                roundStartTime={room.roundStartTime}
                roundEndTime={room.roundEndTime}
                status={room.status}
                isCurrentTurn={isTurn}
                onSubmit={handleSubmitWord}
                isSubmitted={isSubmitted}
                isEliminated={isEliminated}
              />
            </div>

            <div className="lg:col-span-3 order-3">
              <PartyChat messages={messages} onSendMessage={handleSendMessage} />
            </div>
          </div>
        )}

        {/* GAME OVER PODIUM */}
        {room.status === 'game-over' && (
          <PodiumModal
            standings={Object.values(room.players).sort((a, b) => b.score - a.score)}
            onPlayAgain={() => {
              if (isHost) {
                handleStartGame();
              }
            }}
            isHost={isHost}
          />
        )}
      </main>
    </div>
  );
}
