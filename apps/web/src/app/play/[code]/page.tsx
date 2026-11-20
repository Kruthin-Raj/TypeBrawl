'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { DisplayBoard } from '@/components/DisplayBoard';
import { MultiplayerRacer } from '@/components/MultiplayerRacer';
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
  const [myId, setMyId] = useState<string>(() => (typeof window !== 'undefined' ? getSocket().id || '' : ''));
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdownVal, setCountdownVal] = useState<number | null>(null);

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

    if (socket.id) setMyId(socket.id);

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

    socket.on('game:countdown', (count: number) => {
      sound.playTick();
      setCountdownVal(count);
    });

    socket.on('game:round_start', () => {
      sound.playGo();
      setCountdownVal(null);
    });

    socket.on('game:word_solved', () => {
      sound.playCorrect();
    });

    socket.on('game:round_end', () => {
      sound.playExplosion('large');
    });

    return () => {
      socket.emit('room:leave');
      socket.off('room:state');
      socket.off('chat:message');
      socket.off('game:countdown');
      socket.off('game:round_start');
      socket.off('game:word_solved');
      socket.off('game:round_end');
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

  const handleRaceProgress = (data: { progressPercent: number; wpm: number; accuracy: number }) => {
    const socket = getSocket();
    socket.emit('game:race_progress', data);
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

  const currentSocketId = myId || (typeof window !== 'undefined' ? getSocket().id || '' : '');
  const isHost = room.hostId === currentSocketId || (currentSocketId ? !!room.players[currentSocketId]?.isHost : false);
  const me = room.players[currentSocketId] || room.players[myId];
  const isSubmitted = me?.status === 'submitted';
  const isEliminated = me?.lives !== undefined && me?.lives <= 0;
  const isTurn = room.currentTurnPlayerId ? room.currentTurnPlayerId === currentSocketId : true;
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
            {room.settings.mode === 'bomb-pass' ? (
              <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-rose-900/60 text-rose-400">
                <span className="animate-pulse">💣</span>
                <span>HIDDEN FUSE</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                {room.settings.timerSec}s
              </span>
            )}
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
            <div className="w-full max-w-4xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  PLAYERS IN LOBBY ({playersList.length} / {room.settings.maxPlayers})
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {playersList.length < 2 ? '⚠️ Need at least 2 players or bots to start' : '✅ Ready to launch'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {playersList.map((p) => {
                  const isMe = p.id === myId;
                  const isRoomHost = p.id === room.hostId;

                  return (
                    <div
                      key={p.id}
                      className={`relative flex flex-col items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isMe
                          ? 'bg-amber-950/20 border-amber-400/80 shadow-retro-sm'
                          : p.isBot
                          ? 'bg-purple-950/20 border-purple-800/60'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Top badges */}
                      <div className="w-full flex items-center justify-between mb-2">
                        {isRoomHost ? (
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            👑 HOST
                          </span>
                        ) : p.isBot ? (
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            🤖 BOT
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            PLAYER
                          </span>
                        )}

                        {isMe && (
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="my-2 relative flex items-center justify-center">
                        <Avatar config={p.avatar} size={64} />
                      </div>

                      {/* Nickname */}
                      <div className="text-center w-full mt-1">
                        <p className="text-sm font-mono font-black text-white truncate px-1" title={p.nickname}>
                          {p.nickname}
                        </p>
                      </div>

                      {/* Status indicator */}
                      <div className="mt-3 w-full">
                        <div
                          className={`w-full py-1 text-center rounded text-[11px] font-mono font-black uppercase tracking-wider ${
                            isRoomHost
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : p.isReady || p.isBot
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                          }`}
                        >
                          {isRoomHost ? 'READY (HOST)' : p.isReady || p.isBot ? 'READY' : 'WAITING'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Host Start Game & Bot Actions */}
            {isHost ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
                {playersList.length === 1 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono font-medium">
                    <span>💡 Tip: Click START to race with an AI opponent, or add bots below!</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                  <button
                    onClick={handleStartGame}
                    className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-mono font-black text-base uppercase tracking-wider border-2 border-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-retro active:translate-x-[2px] active:translate-y-[2px] cursor-pointer transition-all"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    START {modeMeta.tag}!
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const socket = getSocket();
                        socket.emit('room:add_bot');
                      }}
                      disabled={playersList.length >= room.settings.maxPlayers}
                      className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-2 border-purple-800/60 shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Add 1 AI Bot"
                    >
                      <span>🤖 + ADD BOT</span>
                    </button>

                    <button
                      onClick={() => {
                        const socket = getSocket();
                        socket.emit('room:remove_bot');
                      }}
                      disabled={!playersList.some((p) => p.isBot)}
                      className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-2 border-rose-800/60 shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Remove 1 AI Bot"
                    >
                      <span>➖ REMOVE BOT</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    const socket = getSocket();
                    socket.emit('room:ready');
                  }}
                  className={`px-6 py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider border-2 transition-all ${
                    me?.isReady
                      ? 'bg-emerald-500 text-slate-950 border-black'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-black shadow-retro-sm'
                  }`}
                >
                  {me?.isReady ? '✅ READY!' : 'READY UP'}
                </button>
                <div className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-5 py-2.5 rounded-xl border border-slate-800 animate-pulse">
                  WAITING FOR HOST TO LAUNCH GAME...
                </div>
              </div>
            )}
          </div>
        )}

        {/* COUNTDOWN DRAMATIC OVERLAY */}
        {room.status === 'countdown' && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none animate-in fade-in">
            <div className="flex flex-col items-center">
              <span className="text-xl font-mono font-black text-amber-400 uppercase tracking-widest mb-3 animate-pulse">
                ARENA LAUNCHING IN...
              </span>
              <span className="text-8xl sm:text-9xl font-mono font-black text-amber-300 drop-shadow-[0_0_50px_rgba(245,158,11,0.9)] animate-bounce-short">
                {countdownVal ?? 3}
              </span>
            </div>
          </div>
        )}

        {/* IN-GAME MULTIPLAYER ARENA */}
        {(room.status === 'in-game' || room.status === 'countdown' || room.status === 'round-end') && (
          <div className="flex flex-col gap-4 flex-1">
            {room.settings.mode === 'keydash-race' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
                <div className="lg:col-span-9 flex flex-col">
                  <MultiplayerRacer
                    paragraph={room.currentWord}
                    status={room.status}
                    roundStartTime={room.roundStartTime}
                    players={room.players}
                    myId={currentSocketId}
                    difficulty={room.settings.difficulty}
                    onProgress={handleRaceProgress}
                  />
                </div>
                <div className="lg:col-span-3">
                  <PartyChat messages={messages} onSendMessage={handleSendMessage} />
                </div>
              </div>
            ) : (
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
            )}
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
