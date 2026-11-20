'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/sound';
import {
  Play,
  RotateCcw,
  Sliders,
  LogOut,
  Volume2,
  VolumeX,
  X,
  AlertTriangle,
  Sparkles,
  Zap
} from 'lucide-react';

interface GameControlsModalProps {
  isOpen: boolean;
  onClose: () => void; // Resumes game
  onRestart: () => void;
  gameTitle: string;
  gameModeBadge?: string;
  onExit?: () => void;
}

export const GameControlsModal: React.FC<GameControlsModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  gameTitle,
  gameModeBadge = 'ARCADE',
  onExit
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pause' | 'options' | 'exitConfirm'>('pause');

  // Options settings state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(80);
  const [flashingFx, setFlashingFx] = useState(true);
  const [screenShake, setScreenShake] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSoundEnabled(sound.isEnabled());
      setVolume(Math.round(sound.getVolume() * 100));

      const savedFlash = localStorage.getItem('typefest_flashing_fx');
      if (savedFlash !== null) setFlashingFx(savedFlash === 'true');

      const savedShake = localStorage.getItem('typefest_screen_shake');
      if (savedShake !== null) setScreenShake(savedShake === 'true');
    }
  }, [isOpen]);

  // Handle ESC key to toggle resume/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOpen) {
          if (activeTab === 'options' || activeTab === 'exitConfirm') {
            setActiveTab('pause');
          } else {
            onClose();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, onClose]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    sound.setVolume(val / 100);
  };

  const handleToggleFlashingFx = () => {
    const next = !flashingFx;
    setFlashingFx(next);
    localStorage.setItem('typefest_flashing_fx', String(next));
  };

  const handleToggleShake = () => {
    const next = !screenShake;
    setScreenShake(next);
    localStorage.setItem('typefest_screen_shake', String(next));
  };

  const handleExitConfirm = () => {
    if (onExit) {
      onExit();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-950 border-3 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-slate-100 flex flex-col gap-5">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-xl font-mono font-black tracking-wider text-amber-400 uppercase">
              {activeTab === 'pause' ? 'GAME PAUSED' : activeTab === 'options' ? 'SETTINGS & OPTIONS' : 'EXIT TO MAIN MENU?'}
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {gameModeBadge}
          </span>
        </div>

        {/* Tab 1: Main Pause Menu */}
        {activeTab === 'pause' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-mono text-slate-400 text-center -mt-1">
              Current Game: <span className="text-white font-bold">{gameTitle}</span>
            </p>

            {/* Resume Button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-slate-950 font-mono font-black text-sm tracking-wide border-2 border-black shadow-retro transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>RESUME GAME (ESC)</span>
            </button>

            {/* Restart Run */}
            <button
              onClick={() => {
                onRestart();
                onClose();
              }}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:translate-y-0.5 text-slate-200 font-mono font-bold text-xs tracking-wide border-2 border-slate-800 hover:border-slate-700 shadow-retro-sm transition-all"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>RESTART RUN</span>
            </button>

            {/* Options */}
            <button
              onClick={() => setActiveTab('options')}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:translate-y-0.5 text-slate-200 font-mono font-bold text-xs tracking-wide border-2 border-slate-800 hover:border-slate-700 shadow-retro-sm transition-all"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>OPTIONS & AUDIO</span>
            </button>

            {/* Exit to Main Menu */}
            <button
              onClick={() => setActiveTab('exitConfirm')}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 active:translate-y-0.5 text-rose-300 font-mono font-bold text-xs tracking-wide border-2 border-rose-900/80 shadow-retro-sm transition-all mt-1"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>EXIT TO MAIN MENU</span>
            </button>
          </div>
        )}

        {/* Tab 2: Options & Settings */}
        {activeTab === 'options' && (
          <div className="flex flex-col gap-4">
            {/* Audio Toggle & Volume */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" /> Master Audio
                </span>
                <button
                  onClick={handleToggleSound}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {soundEnabled ? 'ON' : 'MUTED'}
                </button>
              </div>

              {soundEnabled && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>SFX Volume</span>
                    <span className="text-amber-400 font-bold">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Screen FX: Red Flash Vignette (Police alert) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-300 block">
                  Red Flashing Alert FX
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Screen edge alert strobe when police is near
                </span>
              </div>
              <button
                onClick={handleToggleFlashingFx}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  flashingFx ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {flashingFx ? 'ENABLED' : 'OFF'}
              </button>
            </div>

            {/* Screen Shake FX */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-300 block">
                  Screen Shake Impact
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Explosion & nitro camera rumble
                </span>
              </div>
              <button
                onClick={handleToggleShake}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  screenShake ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {screenShake ? 'ENABLED' : 'OFF'}
              </button>
            </div>

            {/* Back to Pause Menu */}
            <button
              onClick={() => setActiveTab('pause')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition-all mt-1"
            >
              ← Back to Pause Menu
            </button>
          </div>
        )}

        {/* Tab 3: Exit Confirmation */}
        {activeTab === 'exitConfirm' && (
          <div className="flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-black text-white">
                Quit current run?
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Your current active session progress and streak will be discarded.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setActiveTab('pause')}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExitConfirm}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-black border-2 border-black shadow-retro-sm transition-all"
              >
                Exit to Menu
              </button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-[10px] font-mono text-slate-500 text-center flex items-center justify-center gap-2">
          <span>TypeBrawl Arcade</span>
          <span>•</span>
          <span>Press ESC to toggle pause</span>
        </div>
      </div>
    </div>
  );
};
