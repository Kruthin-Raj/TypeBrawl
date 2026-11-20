'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@typefest/shared';
import { Send, MessageSquare } from 'lucide-react';
import { sound } from '@/lib/sound';

interface PartyChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

const QUICK_EMOJIS = ['🔥', '⚔️', '💀', '🎉', '⚡', '👑', '😎', '💥'];

export const PartyChat: React.FC<PartyChatProps> = ({ messages, onSendMessage }) => {
  const [inputVal, setInputVal] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sound.playKeyClick();
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  const handleEmojiClick = (emoji: string) => {
    sound.playKeyClick();
    onSendMessage(emoji);
  };

  return (
    <div className="flex flex-col h-[460px] w-full max-w-sm bg-retro-card border-2 border-slate-900 rounded-2xl shadow-retro overflow-hidden">
      {/* Arena Chat Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border-b-2 border-slate-900">
        <span className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          ARENA LOG & COMMS
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs font-mono">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="text-center py-1 px-2 my-1 rounded-lg bg-slate-950 border border-slate-900 text-amber-300 font-bold text-[10px]"
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex flex-col text-left">
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-amber-400">
                  {msg.senderName}:
                </span>
                <span className="text-slate-200 font-medium break-words">
                  {msg.text}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Reaction Emojis */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-950 border-t border-slate-900">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="p-1 rounded hover:bg-slate-900 active:scale-125 transition-transform text-sm"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center p-2 bg-retro-card border-t-2 border-slate-900 gap-1.5">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Send a battle cry..."
          maxLength={80}
          className="flex-1 bg-slate-950 border-2 border-slate-900 focus:border-amber-400 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="p-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black border-2 border-black shadow-retro-sm disabled:opacity-40 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
