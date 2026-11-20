'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { DisplayBoard } from '@/components/DisplayBoard';
import { PlayerRoster } from '@/components/PlayerRoster';
import { PartyChat } from '@/components/PartyChat';
import { PodiumModal } from '@/components/PodiumModal';
import { Avatar } from '@/components/Avatar';
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
  Swords,
  Flame,
  Shield,
  Zap,
  AlertTriangle
} from 'lucide-react';

const getGameModeMeta = (mode: string) => {
  switch (mode) {
    case 'keydash-race':
      return {
        title: 'KEYDASH RACING ARENA',
        icon: '🏎️',
        tag: 'SPEEDWAY SPRINT',
        color: 'text-amber-300',
        badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
        desc: 'Multiplayer speedway race! Type words with high speed to surge ahead with nitro bursts across the lanes and take the checkered flag!'
      };
    case 'bomb-pass':
      return {
        title: 'HOT POTATO ARENA',
        icon: '💣',
        tag: 'BOMB PASS',
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        desc: 'The ticking bomb is passed from player to player! Type your word and press Enter before detonation to survive.'
      };
    case 'type-or-die':
      return {
        title: 'TYPE OR DIE ARENA',
        icon: '🌋',
        tag: 'LAVA SURVIVAL',
        color: 'text-orange-400',
        badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        desc: 'Survive the rising lava! Slow typists lose hearts each round until only the ultimate survivor remains.'
      };
    case 'word-blitz':
    default:
      return {
        title: 'FASTEST WORD CHALLENGE',
        icon: '⚡',
        tag: 'WORD BLITZ',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
        desc: 'The ultimate typing showdown! Central display board word race with speed streaks and instant points multipliers!'
      };
  }
};

export default function PlayRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = String(params.code).toUpperCase();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myId, setMyId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    let guestUser = {
      nickname: 'Player',
      avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 }
    };
    const saved = localStorage.getItem('typefest_guest_user');
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
      socket.emit('room:leave');
      socket.off('room:state');
      socket.off('chat:message');
      socket.off('game:countdown');
      socket.off('game:round_start');
      socket.off('game:word_solved');
    };
  }, [roomCode, router]);

  const handleExitRoom = () => {
    const socket = getSocket();
    socket.emit('room:leave');
    router.push('/');
  };

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
  const modeMeta = getGameModeMeta(room.settings.mode);

  const playersList = Object.values(room.players);
  const maxScore = Math.max(...playersList.map((p) => p.score), 100);

  return (
    <div className="min-h-screen bg-retro-dark text-slate-100 flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Room Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-retro-card border-2 border-slate-900 rounded-xl px-5 py-3 shadow-retro">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              ROOM CODE:
            </span>
            <span className="text-xl font-mono font-black text-amber-400 tracking-widest bg-slate-950 px-3 py-1 rounded-lg border-2 border-slate-900 shadow-retro-sm">
              {room.code}
            </span>

            <button
              onClick={copyInviteLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-xs font-mono font-bold text-slate-200 border-2 border-slate-900 shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedLink ? 'COPIED!' : 'INVITE LINK'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono font-bold text-slate-300">
            <span className={`flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 ${modeMeta.color}`}>
              <span>{modeMeta.icon}</span>
              <span>{modeMeta.tag}</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              {room.settings.timerSec}s
            </span>
            <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 uppercase">
              {room.settings.difficulty}
            </span>

            {/* Leave Room Button */}
            <button
              onClick={handleExitRoom}
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900 shadow-retro-sm transition-all"
            >
              EXIT
            </button>
          </div>
        </div>

        {/* LOBBY STATE */}
        {room.status === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-retro-card border-4 border-slate-900 rounded-2xl text-center shadow-retro">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2 border-black flex items-center justify-center text-slate-950 text-3xl mb-3 shadow-retro animate-bounce-short">
              {modeMeta.icon}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border mb-2 text-xs font-mono font-bold uppercase tracking-wider">
              <span className={modeMeta.badgeBg}>{modeMeta.tag}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-mono font-black text-white uppercase tracking-wider mb-2">
              {modeMeta.title}
            </h2>
            <p className="text-xs font-mono text-slate-400 max-w-md mb-6">
              {modeMeta.desc}
            </p>

            {/* Players cards grid in lobby */}
            <div className="flex flex-wrap justify-center gap-3.5 max-w-2xl mb-8">
              {playersList.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col items-center p-3 bg-slate-950 border-2 border-slate-900 rounded-xl w-32 shadow-retro-sm"
                >
                  <PlayerRoster players={{ [p.id]: p }} myPlayerId={myId} />
                </div>
              ))}
            </div>

            {/* Host Start Game & Bot Actions */}
            {isHost ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleStartGame}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-mono font-black text-base uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  START {modeMeta.tag}!
                </button>
                <button
                  onClick={() => {
                    const socket = getSocket();
                    socket.emit('room:toggle_bots');
                  }}
                  className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-purple-300 border-2 border-purple-900/60 shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  title="Toggle 4 automated AI bot opponents"
                >
                  <span>🤖</span>
                  <span>{playersList.some((p) => p.isBot) ? 'REMOVE BOTS' : '+4 BOTS'}</span>
                </button>
              </div>
            ) : (
              <div className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-5 py-2.5 rounded-xl border border-slate-800 animate-pulse">
                WAITING FOR HOST TO LAUNCH GAME...
              </div>
            )}
          </div>
        )}

        {/* IN-GAME MULTIPLAYER ARENA */}
        {(room.status === 'in-game' || room.status === 'countdown' || room.status === 'round-end') && (
          <div className="flex flex-col gap-4 flex-1">
            {/* Real-time Multiplayer Track Widget for KeyDash Racer */}
            {room.settings.mode === 'keydash-race' && (
              <div className="w-full bg-slate-950 border-2 border-amber-400/80 rounded-2xl p-4 shadow-retro flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-mono font-black text-amber-400 border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base animate-bounce">🏎️</span>
                    <span>KEYDASH SPEEDWAY MULTIPLAYER CIRCUIT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      LAP {room.currentRound} / {room.settings.rounds}
                    </span>
                  </div>
                </div>

                {/* Asphalt Lanes Grid */}
                <div className="flex flex-col gap-2">
                  {playersList.map((p) => {
                    const percent = Math.min(92, Math.max(3, Math.round((p.score / (room.settings.rounds * 150)) * 92)));
                    const isMe = p.id === myId;
                    const isFastest = p.score > 0 && p.score === Math.max(...playersList.map(pl => pl.score));

                    return (
                      <div
                        key={p.id}
                        className={`relative h-11 bg-slate-900/90 rounded-xl flex items-center px-3 border transition-all overflow-hidden ${
                          isMe ? 'border-amber-400/70 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-slate-800'
                        }`}
                      >
                        {/* Lane markings */}
                        <div className="absolute inset-x-0 h-[1px] border-b border-dashed border-slate-800 pointer-events-none" />
                        
                        {/* Finish line checkered strip */}
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-[repeating-conic-gradient(#fff_0_90deg,#000_90deg_180deg)] [background-size:8px_8px] opacity-40" />

                        {/* Racing Car & Avatar */}
                        <div
                          className="absolute transition-all duration-500 ease-out flex items-center gap-2 z-10"
                          style={{ left: `calc(${percent}% + 4px)` }}
                        >
                          <div className="relative">
                            <Avatar config={p.avatar} size={28} status={p.status} />
                            <span className="absolute -bottom-1 -right-1 text-xs">🏎️</span>
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-mono font-black text-white truncate max-w-[85px]">
                                {p.nickname} {isMe ? '(YOU)' : ''}
                              </span>
                              {isFastest && (
                                <span className="text-[9px] font-mono font-black text-amber-400">👑 1ST</span>
                              )}
                            </div>
                            <span className="text-[9px] font-mono font-bold text-amber-300">
                              {p.score}m {p.streak >= 2 ? `• ${p.streak}🔥` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Core Gameplay Grid */}
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
                  mode={room.settings.mode}
                  currentTurnPlayerName={
                    room.currentTurnPlayerId ? room.players[room.currentTurnPlayerId]?.nickname : undefined
                  }
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
