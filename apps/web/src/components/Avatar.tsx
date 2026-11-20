'use client';

import React from 'react';
import { AvatarConfig, PlayerStatus } from '@typefest/shared';
export type { AvatarConfig };

export const AVATAR_PALETTES = [
  { name: 'Arcade Gold', bg: '#F59E0B', accent: '#FDE047', stroke: '#1E1B4B' },
  { name: 'Cyber Cyan', bg: '#06B6D4', accent: '#67E8F9', stroke: '#082F49' },
  { name: 'Neon Purple', bg: '#8B5CF6', accent: '#C084FC', stroke: '#2E1065' },
  { name: 'Retro Pink', bg: '#EC4899', accent: '#F472B6', stroke: '#4C0519' },
  { name: 'Emerald Dev', bg: '#10B981', accent: '#34D399', stroke: '#064E3B' },
  { name: 'Sunset Orange', bg: '#F97316', accent: '#FB923C', stroke: '#431407' },
  { name: 'Electric Blue', bg: '#3B82F6', accent: '#60A5FA', stroke: '#172554' },
  { name: 'Ghost Silver', bg: '#94A3B8', accent: '#CBD5E1', stroke: '#0F172A' }
];

export const AVATAR_ARCHETYPES = [
  { id: 0, name: 'Cyber Hacker', desc: 'Beanie & Neon Glasses' },
  { id: 1, name: 'Arcade Wizard', desc: 'Star Hat & Magic Gaze' },
  { id: 2, name: 'Mecha Bot', desc: 'CRT Monitor & Antennas' },
  { id: 3, name: 'Neon Gamer', desc: 'RGB Headset & Snapback' },
  { id: 4, name: 'Cyber Ninja', desc: 'Headband & Stealth Mask' },
  { id: 5, name: 'Cosmic Astro', desc: 'Space Helmet & Neon Visor' },
  { id: 6, name: 'Feline Hacker', desc: 'Cat Ears & Cool Shades' },
  { id: 7, name: 'Royal Typer', desc: 'Golden Crown & Monocle' }
];

interface AvatarProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  status?: PlayerStatus;
}

export const Avatar: React.FC<AvatarProps> = ({
  config,
  size = 72,
  className = '',
  status
}) => {
  const { color = '#F59E0B', eyes = 0, mouth = 0, accessory = 0 } = config;
  const archetype = accessory % 8; // Archetype index 0..7

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="overflow-visible drop-shadow-[2px_3px_0px_rgba(0,0,0,0.5)] transition-transform duration-150 hover:scale-105"
      >
        {/* Background Rounded Shield / Head Base */}
        <rect
          x="12"
          y="14"
          width="76"
          height="76"
          rx="22"
          fill={color}
          stroke="#0F111A"
          strokeWidth="4.5"
        />

        {/* Pixel Grid Highlights */}
        <path
          d="M 22 22 L 32 22 L 32 30 L 22 30 Z"
          fill="rgba(255, 255, 255, 0.4)"
        />

        {/* 1. Cyber Hacker (Beanie & Glasses) */}
        {archetype === 0 && (
          <g id="archetype-hacker">
            {/* Beanie Hat */}
            <path
              d="M 12 36 Q 50 8 88 36 L 88 42 L 12 42 Z"
              fill="#1E293B"
              stroke="#0F111A"
              strokeWidth="4"
            />
            <rect x="18" y="38" width="64" height="6" rx="2" fill="#334155" />

            {/* Neon Cyber Glasses */}
            <rect x="22" y="50" width="24" height="13" rx="4" fill="#06B6D4" stroke="#0F111A" strokeWidth="3" />
            <rect x="54" y="50" width="24" height="13" rx="4" fill="#06B6D4" stroke="#0F111A" strokeWidth="3" />
            <line x1="46" y1="56" x2="54" y2="56" stroke="#0F111A" strokeWidth="3.5" />
            <line x1="25" y1="53" x2="33" y2="61" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="57" y1="53" x2="65" y2="61" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />

            {/* Confident Smirk */}
            <path d="M 40 73 Q 52 79 62 71" stroke="#0F111A" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* 2. Arcade Wizard (Star Hat & Glowing Eyes) */}
        {archetype === 1 && (
          <g id="archetype-wizard">
            {/* Pointy Wizard Hat */}
            <polygon
              points="50,-4 20,28 80,28"
              fill="#6D28D9"
              stroke="#0F111A"
              strokeWidth="4"
            />
            {/* Hat Brim */}
            <ellipse cx="50" cy="28" rx="44" ry="9" fill="#7C3AED" stroke="#0F111A" strokeWidth="3.5" />
            {/* Star on hat */}
            <polygon points="50,12 52,16 57,16 53,19 55,23 50,20 45,23 47,19 43,16 48,16" fill="#FDE047" />

            {/* Magical Glowing Eyes */}
            <circle cx="35" cy="50" r="7" fill="#FDE047" stroke="#0F111A" strokeWidth="3" />
            <circle cx="65" cy="50" r="7" fill="#FDE047" stroke="#0F111A" strokeWidth="3" />
            <circle cx="37" cy="48" r="2.5" fill="#FFFFFF" />
            <circle cx="67" cy="48" r="2.5" fill="#FFFFFF" />

            {/* Small smile */}
            <path d="M 42 68 Q 50 74 58 68" stroke="#0F111A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* 3. Mecha Bot (CRT Monitor & Antennas) */}
        {archetype === 2 && (
          <g id="archetype-bot">
            {/* Antenna */}
            <line x1="50" y1="14" x2="50" y2="2" stroke="#0F111A" strokeWidth="4" />
            <circle cx="50" cy="2" r="5" fill="#EF4444" stroke="#0F111A" strokeWidth="2.5" />

            {/* CRT Screen Frame */}
            <rect x="20" y="32" width="60" height="42" rx="10" fill="#0F172A" stroke="#0F111A" strokeWidth="3.5" />

            {/* Pixel Eyes (Green Terminal Matrix) */}
            <rect x="28" y="44" width="14" height="6" rx="2" fill="#22C55E" />
            <rect x="58" y="44" width="14" height="6" rx="2" fill="#22C55E" />

            {/* Digital Mouth */}
            <line x1="38" y1="62" x2="62" y2="62" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {/* 4. Neon Gamer (RGB Headset & Backward Cap) */}
        {archetype === 3 && (
          <g id="archetype-gamer">
            {/* Backward Snapback */}
            <path d="M 16 34 Q 50 16 84 34 L 84 40 L 16 40 Z" fill="#DC2626" stroke="#0F111A" strokeWidth="3.5" />
            <rect x="74" y="32" width="18" height="6" rx="2" fill="#991B1B" stroke="#0F111A" strokeWidth="2" />

            {/* RGB Gamer Headset */}
            <path d="M 12 50 A 40 40 0 0 1 88 50" fill="none" stroke="#0F111A" strokeWidth="5" strokeLinecap="round" />
            <rect x="6" y="42" width="12" height="22" rx="5" fill="#22C55E" stroke="#0F111A" strokeWidth="3" />
            <rect x="82" y="42" width="12" height="22" rx="5" fill="#22C55E" stroke="#0F111A" strokeWidth="3" />
            {/* Mic */}
            <path d="M 12 58 Q 24 74 38 72" fill="none" stroke="#0F111A" strokeWidth="3" strokeLinecap="round" />
            <circle cx="39" cy="72" r="3.5" fill="#EF4444" />

            {/* Determined Eyes */}
            <circle cx="35" cy="52" r="6" fill="#0F111A" />
            <circle cx="65" cy="52" r="6" fill="#0F111A" />
            <circle cx="33" cy="50" r="2.5" fill="#FFFFFF" />
            <circle cx="63" cy="50" r="2.5" fill="#FFFFFF" />

            {/* Grin with tooth */}
            <path d="M 40 68 Q 50 78 60 68 Z" fill="#FFFFFF" stroke="#0F111A" strokeWidth="3" />
          </g>
        )}

        {/* 5. Cyber Ninja (Headband & Stealth Mask) */}
        {archetype === 4 && (
          <g id="archetype-ninja">
            {/* Headband */}
            <rect x="12" y="24" width="76" height="12" rx="3" fill="#DC2626" stroke="#0F111A" strokeWidth="3.5" />
            <circle cx="50" cy="30" r="3.5" fill="#FFFFFF" stroke="#0F111A" strokeWidth="1.5" />
            {/* Floating Ribbon Knot */}
            <line x1="84" y1="28" x2="98" y2="38" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
            <line x1="84" y1="32" x2="96" y2="46" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />

            {/* Sharp Focused Ninja Eyes */}
            <path d="M 28 48 L 42 45 L 38 52 Z" fill="#0F111A" />
            <path d="M 72 48 L 58 45 L 62 52 Z" fill="#0F111A" />

            {/* Lower Half Face Mask */}
            <path d="M 22 58 Q 50 86 78 58 L 78 78 Q 50 92 22 78 Z" fill="#1E293B" stroke="#0F111A" strokeWidth="3.5" />
            <line x1="50" y1="62" x2="50" y2="76" stroke="#334155" strokeWidth="3" />
          </g>
        )}

        {/* 6. Cosmic Astro (Space Helmet & Neon Visor) */}
        {archetype === 5 && (
          <g id="archetype-astro">
            {/* Round Glass Visor */}
            <rect x="18" y="32" width="64" height="42" rx="14" fill="#1E1B4B" stroke="#0F111A" strokeWidth="4" />
            {/* Iridescent Neon Reflection */}
            <path
              d="M 24 40 Q 50 30 76 44 L 72 52 Q 50 38 24 50 Z"
              fill="url(#neon-grad)"
              opacity="0.8"
            />
            {/* Stars reflected inside visor */}
            <circle cx="36" cy="56" r="1.5" fill="#FFFFFF" />
            <circle cx="58" cy="48" r="2" fill="#FDE047" />
            <circle cx="68" cy="62" r="1.5" fill="#FFFFFF" />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="neon-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </g>
        )}

        {/* 7. Feline Hacker (Cat Ears & Shades) */}
        {archetype === 6 && (
          <g id="archetype-cat">
            {/* Cat Ears */}
            <polygon points="18,18 34,2 40,24" fill={color} stroke="#0F111A" strokeWidth="3.5" />
            <polygon points="22,16 32,8 36,20" fill="#F43F5E" />
            <polygon points="82,18 66,2 60,24" fill={color} stroke="#0F111A" strokeWidth="3.5" />
            <polygon points="78,16 68,8 64,20" fill="#F43F5E" />

            {/* Cool Sunglasses */}
            <rect x="22" y="44" width="24" height="14" rx="4" fill="#0F111A" />
            <rect x="54" y="44" width="24" height="14" rx="4" fill="#0F111A" />
            <line x1="46" y1="49" x2="54" y2="49" stroke="#0F111A" strokeWidth="3.5" />
            <line x1="26" y1="47" x2="33" y2="55" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="58" y1="47" x2="65" y2="55" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

            {/* Whiskers */}
            <line x1="10" y1="62" x2="24" y2="64" stroke="#0F111A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="10" y1="70" x2="24" y2="68" stroke="#0F111A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="90" y1="62" x2="76" y2="64" stroke="#0F111A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="90" y1="70" x2="76" y2="68" stroke="#0F111A" strokeWidth="2.5" strokeLinecap="round" />

            {/* Cat Mouth :3 */}
            <path d="M 40 68 Q 45 73 50 68 Q 55 73 60 68" stroke="#0F111A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* 8. Royal Typer (Golden Crown & Monocle) */}
        {archetype === 7 && (
          <g id="archetype-royal">
            {/* Royal Gold Crown */}
            <polygon
              points="24,20 32,2 50,12 68,2 76,20"
              fill="#FBBF24"
              stroke="#0F111A"
              strokeWidth="3.5"
            />
            <circle cx="32" cy="5" r="2.5" fill="#EF4444" />
            <circle cx="50" cy="14" r="2.5" fill="#3B82F6" />
            <circle cx="68" cy="5" r="2.5" fill="#EF4444" />

            {/* Left Eye & Right Monocle */}
            <circle cx="35" cy="50" r="6" fill="#0F111A" />
            <circle cx="33" cy="48" r="2.5" fill="#FFFFFF" />

            {/* Golden Monocle */}
            <circle cx="65" cy="50" r="9" fill="none" stroke="#F59E0B" strokeWidth="3" />
            <circle cx="65" cy="50" r="5" fill="#0F111A" />
            <line x1="74" y1="52" x2="82" y2="66" stroke="#F59E0B" strokeWidth="2" strokeDasharray="2,2" />

            {/* Gentleman Mustache & Smile */}
            <path d="M 40 70 Q 50 78 60 70" stroke="#0F111A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </g>
        )}
      </svg>

      {/* Floating Status Icon Badge */}
      {status === 'submitted' && (
        <span className="absolute -bottom-1 -right-1 bg-green-500 text-slate-950 font-black rounded-lg px-1.5 py-0.5 text-[11px] border-2 border-black shadow-retro-sm animate-bounce-short">
          SOLVED ✓
        </span>
      )}
      {status === 'typing' && (
        <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black rounded-lg px-1.5 py-0.5 text-[10px] border-2 border-black shadow-retro-sm animate-pulse">
          TYPING...
        </span>
      )}
      {status === 'eliminated' && (
        <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white font-black rounded-lg px-1.5 py-0.5 text-[10px] border-2 border-black shadow-retro-sm">
          KO
        </span>
      )}
    </div>
  );
};
