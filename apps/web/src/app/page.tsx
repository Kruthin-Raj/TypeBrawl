'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AvatarCustomizer } from '@/components/AvatarCustomizer';
import { AvatarConfig, GameMode } from '@typefest/shared';
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
  const [gameMode, setGameMode] = useState<GameMode>('keydash-race');
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

  // Quick Play Matchmaking (Joins public room with highest player count for chosen mode)
  const handleQuickPlay = (targetMode: GameMode = 'keydash-race') => {
    sound.playGo();
    const socket = getSocket();
    setErrorMsg('');

    socket.emit('room:list', (rooms) => {
      // Find open public rooms matching the selected mode where player limit is not reached
      const available = rooms.filter(
        (r) => !r.hasPassword && r.mode === targetMode && r.playerCount < r.maxPlayers
      );

      if (available.length > 0) {
        // Sort descending to find rooms with the highest player count
        available.sort((a, b) => b.playerCount - a.playerCount);
        const highestPlayerCount = available[0].playerCount;

        // Group all rooms tied for the highest player count
        const topRooms = available.filter((r) => r.playerCount === highestPlayerCount);

        // Pick one randomly among the highest player rooms
        const target = topRooms[Math.floor(Math.random() * topRooms.length)];

        socket.emit(
          'room:join',
          { roomCode: target.code, player: { nickname, avatar } },
          (res) => {
            if (res.success) {
              router.push(`/play/${target.code}`);
            } else {
              handleCreateRoom(targetMode, false);
            }
          }
        );
      } else {
        // No room with players found online; create a fresh room (no initial bots)
        handleCreateRoom(targetMode, false);
      }
    });
  };

  // Create Room
  const handleCreateRoom = (modeOverride?: GameMode, withBots: boolean = false) => {
    sound.playGo();
    const socket = getSocket();
    setErrorMsg('');

    const targetMode = modeOverride || gameMode;

    socket.emit(
      'room:create',
      {
        settings: {
          mode: targetMode,
          difficulty,
          timerSec,
          rounds: 10,
          maxPlayers: 8,
          isPublic: isPublic && !roomPassword,
          password: roomPassword || undefined,
          withBots
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

  const openHostModalFor = (mode: GameMode) => {
    setGameMode(mode);
    setShowCreateModal(true);
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
            <span>RETRO MULTIPLAYER ARENA • NO LOGIN REQUIRED</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-mono font-black tracking-tight text-white drop-shadow-[3px_3px_0px_#000]">
            Type<span className="text-amber-400">Brawl</span>
          </h1>

          <p className="text-xs sm:text-sm font-mono text-slate-400 font-bold mt-1 max-w-md mx-auto">
            Choose your game mode: Escape the police chase, blast laser invaders, circuit race, or battle friends in multiplayer rooms!
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 px-4 py-2 bg-rose-500/20 border-2 border-rose-500 rounded-xl text-rose-300 font-mono text-xs font-bold animate-wiggle">
            {errorMsg}
          </div>
        )}

        {/* Central Stage: Avatar Customizer + Games Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl items-start">
          {/* Avatar Customizer */}
          <AvatarCustomizer
            nickname={nickname}
            avatar={avatar}
            onNicknameChange={handleNicknameChange}
            onAvatarChange={handleAvatarChange}
          />

          {/* Game Modes Selection: 3 Room-Based Multiplayer + Solo Arcade Modes */}
          <div className="flex flex-col gap-3.5 w-full max-w-sm mx-auto">
            
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <span>⚔️</span> MULTIPLAYER ARENAS (ROOMS)
              </span>
              <span className="text-[9px] font-mono text-slate-400">MAX 8 PLAYERS</span>
            </div>

            {/* Mode 1: KeyDash Racing Arena */}
            <div className="p-3 bg-retro-card border-2 border-slate-900 hover:border-amber-400/80 rounded-xl shadow-retro transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-black text-amber-300 flex items-center gap-1.5">
                  <span>🏎️</span> KEYDASH RACING ARENA
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  SPEEDWAY
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mb-2.5">
                Speedway race with teammates in real-time! Nitro bursts across asphalt lanes.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickPlay('keydash-race')}
                  className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>QUICK PLAY</span>
                </button>
                <button
                  onClick={() => openHostModalFor('keydash-race')}
                  className="py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>HOST ROOM</span>
                </button>
              </div>
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full mt-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 font-mono font-bold text-[10px] uppercase border border-slate-800 flex items-center justify-center gap-1"
              >
                <Hash className="w-3 h-3 text-amber-400" /> Enter Room Code
              </button>
            </div>

            {/* Mode 2: Hot Potato Arena */}
            <div className="p-3 bg-retro-card border-2 border-slate-900 hover:border-rose-500/80 rounded-xl shadow-retro transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-black text-rose-400 flex items-center gap-1.5">
                  <span>💣</span> HOT POTATO ARENA
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  TURN BOMB
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mb-2.5">
                Ticking bomb passed player-to-player! 3 hearts elimination survival.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickPlay('bomb-pass')}
                  className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>QUICK PLAY</span>
                </button>
                <button
                  onClick={() => openHostModalFor('bomb-pass')}
                  className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>HOST ROOM</span>
                </button>
              </div>
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full mt-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 font-mono font-bold text-[10px] uppercase border border-slate-800 flex items-center justify-center gap-1"
              >
                <Hash className="w-3 h-3 text-rose-400" /> Enter Room Code
              </button>
            </div>

            {/* Mode 3: Fastest Word Challenge */}
            <div className="p-3 bg-retro-card border-2 border-slate-900 hover:border-cyan-500/80 rounded-xl shadow-retro transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-black text-cyan-400 flex items-center gap-1.5">
                  <span>⚡</span> FASTEST WORD CHALLENGE
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  WORD BLITZ
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mb-2.5">
                Simultaneous word sprint! Speed & streak bonuses on the central display board.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickPlay('word-blitz')}
                  className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>QUICK PLAY</span>
                </button>
                <button
                  onClick={() => openHostModalFor('word-blitz')}
                  className="py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>HOST ROOM</span>
                </button>
              </div>
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full mt-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 font-mono font-bold text-[10px] uppercase border border-slate-800 flex items-center justify-center gap-1"
              >
                <Hash className="w-3 h-3 text-cyan-400" /> Enter Room Code
              </button>
            </div>

            {/* Solo Modes Section Divider */}
            <div className="flex items-center justify-between px-1 pt-2 border-t border-slate-900">
              <span className="text-[11px] font-mono font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <span>🕹️</span> SOLO ARCADE CAMPAIGNS
              </span>
              <span className="text-[9px] font-mono text-slate-400">MULTI-LEVEL</span>
            </div>

            {/* Solo Game 1: Police Chase Escape */}
            <div className="p-3 bg-retro-card border-2 border-slate-900 hover:border-rose-500/80 rounded-xl shadow-retro transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-black text-rose-400 flex items-center gap-1.5">
                  <span>🚨</span> POLICE PURSUIT ESCAPE
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  5 LEVELS
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mb-2">
                Outrun cruisers from suburban alleys to apex helicopter aerial lockdown!
              </p>
              <button
                onClick={() => router.push('/chase')}
                className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY SOLO (5 LEVELS) ▶</span>
              </button>
            </div>

            {/* Solo Game 2: Laser Type Shooter */}
            <div className="p-3 bg-retro-card border-2 border-slate-900 hover:border-cyan-500/80 rounded-xl shadow-retro transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-black text-cyan-400 flex items-center gap-1.5">
                  <span>🚀</span> LASER TYPE SHOOTER
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  5 SECTORS
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mb-2">
                Lock on and blast alien armadas and flagship dreadnoughts across planetary sectors!
              </p>
              <button
                onClick={() => router.push('/shooter')}
                className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY SOLO (5 SECTORS) ▶</span>
              </button>
            </div>

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

      {/* CREATE ROOM MODAL (3 Valid Multiplayer Modes) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-retro-card border-4 border-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-retro">
            <h3 className="text-xl font-mono font-black text-amber-300 uppercase tracking-wider mb-4 text-center">
              HOST MULTIPLAYER ROOM
            </h3>

            <div className="flex flex-col gap-3.5 text-xs font-mono font-bold">
              {/* Game Mode Selector for Arena multiplayer games */}
              <div>
                <label className="text-slate-400 block mb-1.5">SELECT MULTIPLAYER MODE</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'keydash-race', label: 'KeyDash Racing', icon: '🏎️', desc: 'Speedway Race with Friends' },
                    { id: 'bomb-pass', label: 'Hot Potato', icon: '💣', desc: 'Turn-Based Bomb Passing' },
                    { id: 'word-blitz', label: 'Fastest Word', icon: '⚡', desc: 'Simultaneous Speed & Scores' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setGameMode(m.id as GameMode)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        gameMode === m.id
                          ? 'bg-amber-400 text-slate-950 border-black shadow-retro-sm font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{m.icon}</span>
                        <span className="truncate">{m.label}</span>
                      </div>
                      <span className={`text-[9px] block mt-0.5 ${gameMode === m.id ? 'text-slate-800' : 'text-slate-500'}`}>
                        {m.desc}
                      </span>
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
                CREATE ROOM
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
