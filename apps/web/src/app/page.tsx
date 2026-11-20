'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AvatarCustomizer } from '@/components/AvatarCustomizer';
import { AvatarConfig } from '@typefest/shared';
import { getSocket } from '@/lib/socket';
import { sound } from '@/lib/sound';
import {
  Play,
  PlusCircle,
  Hash,
  Keyboard,
  Swords,
  Sparkles,
  Zap,
  Gamepad2,
  ShieldAlert,
  Rocket
} from 'lucide-react';

const DEFAULT_AVATAR: AvatarConfig = {
  color: '#F59E0B',
  eyes: 0,
  mouth: 0,
  accessory: 0
};

export default function LandingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('TypeMaster');
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  // Create room options
  const [timerSec, setTimerSec] = useState(8);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed' | 'gaming' | 'code'>('mixed');
  const [gameMode, setGameMode] = useState<'word-blitz' | 'bomb-pass' | 'type-or-die'>('word-blitz');
  const [roomPassword, setRoomPassword] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Load guest user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('typefest_guest_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nickname) setNickname(parsed.nickname);
        if (parsed.avatar) setAvatar(parsed.avatar);
      } catch {}
    }
  }, []);

  const saveUserToStorage = (name: string, av: AvatarConfig) => {
    localStorage.setItem(
      'typefest_guest_user',
      JSON.stringify({ nickname: name, avatar: av })
    );
  };

  const handleNicknameChange = (name: string) => {
    setNickname(name);
    saveUserToStorage(name, avatar);
  };

  const handleAvatarChange = (av: AvatarConfig) => {
    setAvatar(av);
    saveUserToStorage(nickname, av);
  };

  // Quick Play Matchmaking
  const handleQuickPlay = () => {
    sound.playGo();
    const socket = getSocket();
    setErrorMsg('');

    socket.emit('room:list', (rooms) => {
      const available = rooms.filter((r) => !r.hasPassword && r.playerCount < r.maxPlayers);
      if (available.length > 0) {
        const target = available[0];
        socket.emit(
          'room:join',
          { roomCode: target.code, player: { nickname, avatar } },
          (res) => {
            if (res.success) {
              router.push(`/play/${target.code}`);
            } else {
              handleCreateRoom();
            }
          }
        );
      } else {
        handleCreateRoom();
      }
    });
  };

  // Create Room
  const handleCreateRoom = () => {
    sound.playGo();
    const socket = getSocket();
    setErrorMsg('');

    socket.emit(
      'room:create',
      {
        settings: {
          mode: gameMode,
          difficulty,
          timerSec,
          rounds: 10,
          maxPlayers: 8,
          isPublic: isPublic && !roomPassword,
          password: roomPassword || undefined
        },
        player: { nickname, avatar }
      },
      (res) => {
        if (res.success && res.roomCode) {
          router.push(`/play/${res.roomCode}`);
        } else {
          setErrorMsg(res.error || 'Failed to create room');
        }
      }
    );
  };

  // Join Room with Code
  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    sound.playKeyClick();
    const socket = getSocket();
    setErrorMsg('');

    socket.emit(
      'room:join',
      {
        roomCode: joinCode.trim().toUpperCase(),
        password: joinPassword || undefined,
        player: { nickname, avatar }
      },
      (res) => {
        if (res.success) {
          router.push(`/play/${joinCode.trim().toUpperCase()}`);
        } else {
          setErrorMsg(res.error || 'Could not join room');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-retro-dark text-slate-100 flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-retro-card border-2 border-slate-900 shadow-retro-sm text-retro-accent text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>4 ARCADE GAMES • NO LOGIN REQUIRED</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-mono font-black tracking-tight text-white drop-shadow-[3px_3px_0px_#000]">
            Type<span className="text-amber-400">Brawl</span>
          </h1>

          <p className="text-xs sm:text-sm font-mono text-slate-400 font-bold mt-1 max-w-md mx-auto">
            Choose your game mode: Escape the police chase, blast laser invaders, circuit race, or battle friends on the display board!
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 px-4 py-2 bg-rose-500/20 border-2 border-rose-500 rounded-xl text-rose-300 font-mono text-xs font-bold animate-wiggle">
            {errorMsg}
          </div>
        )}

        {/* Central Stage: Avatar Customizer + 4 Games Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl items-start">
          {/* Avatar Customizer */}
          <AvatarCustomizer
            nickname={nickname}
            avatar={avatar}
            onNicknameChange={handleNicknameChange}
            onAvatarChange={handleAvatarChange}
          />

          {/* 4 Arcade Games Grid */}
          <div className="flex flex-col gap-2.5 w-full max-w-sm mx-auto">
            {/* Game 1: Multiplayer Display Board Arena (The Original) */}
            <div className="p-3 bg-retro-card border-2 border-slate-900 rounded-xl shadow-retro">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-black text-amber-300">
                  1. DISPLAY BOARD ARENA
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  MULTIPLAYER
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleQuickPlay}
                  className="py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>QUICK PLAY</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="py-2.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>HOST ROOM</span>
                </button>
              </div>
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full mt-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 font-mono font-bold text-[11px] uppercase border border-slate-800 flex items-center justify-center gap-1"
              >
                <Hash className="w-3 h-3 text-amber-400" /> Enter Room Code
              </button>
            </div>

            {/* Game 2: Police Chase Escape */}
            <button
              onClick={() => router.push('/chase')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-left border-2 border-slate-900 hover:border-rose-500/80 shadow-retro active:translate-x-[1px] active:translate-y-[1px] transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">🚨</span>
                <div>
                  <span className="text-xs font-mono font-black text-rose-400 block">
                    2. POLICE CHASE ESCAPE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Type to accelerate and outrun pursuing cruisers
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400">PLAY ▶</span>
            </button>

            {/* Game 3: Laser Type Shooter */}
            <button
              onClick={() => router.push('/shooter')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 hover:bg-cyan-950/40 text-left border-2 border-slate-900 hover:border-cyan-500/80 shadow-retro active:translate-x-[1px] active:translate-y-[1px] transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">🚀</span>
                <div>
                  <span className="text-xs font-mono font-black text-cyan-400 block">
                    3. LASER TYPE SHOOTER
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Lock on and vaporize descending space invaders
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">PLAY ▶</span>
            </button>

            {/* Game 4: KeyDash Arcade Racer */}
            <button
              onClick={() => router.push('/keydash')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 hover:bg-amber-950/40 text-left border-2 border-slate-900 hover:border-amber-500/80 shadow-retro active:translate-x-[1px] active:translate-y-[1px] transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">🏎️</span>
                <div>
                  <span className="text-xs font-mono font-black text-amber-300 block">
                    4. KEYDASH ARCADE RACER
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Circuit speedway race with Nitro streaks
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">PLAY ▶</span>
            </button>

            {/* Training Grounds link */}
            <button
              onClick={() => router.push('/practice')}
              className="w-full py-2.5 rounded-xl bg-retro-card hover:bg-slate-850 text-slate-300 border-2 border-slate-900 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-retro-sm transition-all"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>SOLO TRAINING HUB (8 MODES)</span>
            </button>
          </div>
        </div>
      </main>

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-retro-card border-4 border-slate-900 rounded-2xl p-6 max-w-md w-full shadow-retro">
            <h3 className="text-xl font-mono font-black text-amber-300 uppercase tracking-wider mb-4 text-center">
              ROOM CONFIGURATION
            </h3>

            <div className="flex flex-col gap-3.5 text-xs font-mono font-bold">
              <div>
                <label className="text-slate-400 block mb-1">GAME MODE</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['word-blitz', 'bomb-pass', 'type-or-die'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setGameMode(m)}
                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                        gameMode === m
                          ? 'bg-amber-400 text-slate-950 border-black shadow-retro-sm font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-900'
                      }`}
                    >
                      {m === 'word-blitz' ? 'Blitz Race' : m === 'bomb-pass' ? 'Bomb Pass' : 'Elimination'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">PER-WORD TIMER LIMIT</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[3, 5, 8, 10, 15].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setTimerSec(sec)}
                      className={`py-2 rounded-lg border-2 text-center transition-all ${
                        timerSec === sec
                          ? 'bg-amber-400 text-slate-950 border-black shadow-retro-sm font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-900'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">WORD PACK / DIFFICULTY</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['easy', 'medium', 'hard', 'mixed', 'gaming', 'code'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`p-2 rounded-lg border-2 text-center uppercase tracking-wider transition-all ${
                        difficulty === diff
                          ? 'bg-amber-400 text-slate-950 border-black shadow-retro-sm font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-900'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ROOM PASSWORD (OPTIONAL)</label>
                <input
                  type="text"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Leave blank for public room"
                  maxLength={12}
                  className="w-full bg-slate-950 border-2 border-slate-900 focus:border-amber-400 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-bold text-xs border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  handleCreateRoom();
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px]"
              >
                START ARENA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN ROOM MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleJoinWithCode}
            className="bg-retro-card border-4 border-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-retro"
          >
            <h3 className="text-xl font-mono font-black text-amber-300 uppercase tracking-wider mb-4 text-center">
              JOIN ROOM
            </h3>

            <div className="flex flex-col gap-3 text-xs font-mono font-bold">
              <div>
                <label className="text-slate-400 block mb-1">ENTER 6-DIGIT CODE</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FEST24"
                  maxLength={8}
                  className="w-full bg-slate-950 border-2 border-slate-900 focus:border-amber-400 rounded-xl px-4 py-3 text-center text-xl font-mono text-white tracking-widest uppercase focus:outline-none shadow-retro-sm"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">PASSWORD (IF PRIVATE)</label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-bold text-xs border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px]"
              >
                ENTER
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
