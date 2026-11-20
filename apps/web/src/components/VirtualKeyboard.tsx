'use client';

import React from 'react';

interface VirtualKeyboardProps {
  currentKey?: string;
  isError?: boolean;
}

const KEYBOARD_ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Space']
];

// Finger assignments for standard touch typing
const FINGER_MAP: Record<string, { finger: string; color: string }> = {
  // Left Pinky
  '`': { finger: 'Left Pinky', color: 'border-pink-500 text-pink-400' },
  '1': { finger: 'Left Pinky', color: 'border-pink-500 text-pink-400' },
  'Q': { finger: 'Left Pinky', color: 'border-pink-500 text-pink-400' },
  'A': { finger: 'Left Pinky', color: 'border-pink-500 text-pink-400' },
  'Z': { finger: 'Left Pinky', color: 'border-pink-500 text-pink-400' },
  'Caps': { finger: 'Left Pinky', color: 'border-pink-500 text-pink-400' },

  // Left Ring
  '2': { finger: 'Left Ring', color: 'border-purple-500 text-purple-400' },
  'W': { finger: 'Left Ring', color: 'border-purple-500 text-purple-400' },
  'S': { finger: 'Left Ring', color: 'border-purple-500 text-purple-400' },
  'X': { finger: 'Left Ring', color: 'border-purple-500 text-purple-400' },

  // Left Middle
  '3': { finger: 'Left Middle', color: 'border-blue-500 text-blue-400' },
  'E': { finger: 'Left Middle', color: 'border-blue-500 text-blue-400' },
  'D': { finger: 'Left Middle', color: 'border-blue-500 text-blue-400' },
  'C': { finger: 'Left Middle', color: 'border-blue-500 text-blue-400' },

  // Left Index
  '4': { finger: 'Left Index', color: 'border-emerald-500 text-emerald-400' },
  '5': { finger: 'Left Index', color: 'border-emerald-500 text-emerald-400' },
  'R': { finger: 'Left Index', color: 'border-emerald-500 text-emerald-400' },
  'T': { finger: 'Left Index', color: 'border-emerald-500 text-emerald-400' },
  'F': { finger: 'Left Index', color: 'border-emerald-500 text-emerald-400' },
  'G': { finger: 'Left Index', color: 'border-emerald-500 text-emerald-400' },
  'V': { finger: 'Left Index', color: 'border-emerald-500 text-emerald-400' },
  'B': { finger: 'Left Index', color: 'border-emerald-500 text-emerald-400' },

  // Thumbs
  'Space': { finger: 'Thumb', color: 'border-amber-400 text-amber-300' },

  // Right Index
  '6': { finger: 'Right Index', color: 'border-emerald-500 text-emerald-400' },
  '7': { finger: 'Right Index', color: 'border-emerald-500 text-emerald-400' },
  'Y': { finger: 'Right Index', color: 'border-emerald-500 text-emerald-400' },
  'U': { finger: 'Right Index', color: 'border-emerald-500 text-emerald-400' },
  'H': { finger: 'Right Index', color: 'border-emerald-500 text-emerald-400' },
  'J': { finger: 'Right Index', color: 'border-emerald-500 text-emerald-400' },
  'N': { finger: 'Right Index', color: 'border-emerald-500 text-emerald-400' },
  'M': { finger: 'Right Index', color: 'border-emerald-500 text-emerald-400' },

  // Right Middle
  '8': { finger: 'Right Middle', color: 'border-blue-500 text-blue-400' },
  'I': { finger: 'Right Middle', color: 'border-blue-500 text-blue-400' },
  'K': { finger: 'Right Middle', color: 'border-blue-500 text-blue-400' },
  ',': { finger: 'Right Middle', color: 'border-blue-500 text-blue-400' },

  // Right Ring
  '9': { finger: 'Right Ring', color: 'border-purple-500 text-purple-400' },
  'O': { finger: 'Right Ring', color: 'border-purple-500 text-purple-400' },
  'L': { finger: 'Right Ring', color: 'border-purple-500 text-purple-400' },
  '.': { finger: 'Right Ring', color: 'border-purple-500 text-purple-400' },

  // Right Pinky
  '0': { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' },
  '-': { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' },
  '=': { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' },
  'P': { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' },
  '[': { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' },
  ']': { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' },
  ';': { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' },
  "'": { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' },
  '/': { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' },
  'Enter': { finger: 'Right Pinky', color: 'border-pink-500 text-pink-400' }
};

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  currentKey = '',
  isError = false
}) => {
  const normKey = currentKey === ' ' ? 'Space' : currentKey.toUpperCase();
  const currentFingerInfo = FINGER_MAP[normKey];

  return (
    <div className="bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl p-4 shadow-xl max-w-2xl mx-auto select-none">
      {/* Finger Guide Header */}
      {currentFingerInfo && (
        <div className="flex items-center justify-between text-xs mb-3 px-2">
          <span className="text-slate-400 font-medium">Touch Typing Guide:</span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 font-bold text-amber-400 animate-pulse">
            Use: {currentFingerInfo.finger}
          </span>
        </div>
      )}

      {/* Keyboard Grid */}
      <div className="flex flex-col gap-1.5">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1.5">
            {row.map((key, kIdx) => {
              const isTarget = normKey === key;
              const fingerInfo = FINGER_MAP[key];

              let keyStyle = 'bg-slate-800 text-slate-300 border-slate-700';
              let width = 'w-9 sm:w-11';

              if (key === 'Backspace') width = 'w-16 sm:w-20';
              if (key === 'Tab') width = 'w-12 sm:w-16';
              if (key === 'Caps') width = 'w-14 sm:w-18';
              if (key === 'Enter') width = 'w-16 sm:w-20 bg-amber-500/20 text-amber-300 border-amber-500/40';
              if (key === 'Shift') width = 'w-16 sm:w-22';
              if (key === 'Space') width = 'w-64 sm:w-80';

              if (isTarget) {
                if (isError) {
                  keyStyle = 'bg-red-500 text-white border-red-400 scale-110 shadow-lg shadow-red-500/50 animate-wiggle';
                } else {
                  keyStyle = 'bg-amber-400 text-slate-950 border-amber-300 scale-110 shadow-lg shadow-amber-400/50 font-black';
                }
              }

              return (
                <div
                  key={`${key}-${kIdx}`}
                  className={`h-9 sm:h-11 ${width} flex items-center justify-center rounded-lg border-2 text-xs sm:text-sm font-bold transition-all duration-150 ${keyStyle}`}
                >
                  {key}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
