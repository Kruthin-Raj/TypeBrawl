'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import {
  PRACTICE_LESSONS,
  PRACTICE_PARAGRAPHS,
  EASY_WORDS,
  MEDIUM_WORDS,
  HARD_WORDS,
  GAMING_WORDS,
  FAMOUS_QUOTES,
  CODE_SNIPPETS,
  NUMBER_SYMBOL_DRILLS
} from '@typefest/shared';
import { sound } from '@/lib/sound';
import {
  BookOpen,
  Timer,
  FileCode,
  Quote,
  Hash,
  Sparkles,
  RefreshCw,
  Trophy,
  Coffee,
  Edit3
} from 'lucide-react';

type PracticeMode =
  | 'lessons'
  | 'timed'
  | 'words'
  | 'quotes'
  | 'code'
  | 'numbers'
  | 'zen'
  | 'custom';

export default function PracticePage() {
  const [mode, setMode] = useState<PracticeMode>('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState(PRACTICE_LESSONS[0].id);

  // Sub-settings
  const [timedDuration, setTimedDuration] = useState<number>(30); // 15, 30, 60, 120
  const [wordTarget, setWordTarget] = useState<number>(25); // 10, 25, 50, 100
  const [codeLanguage, setCodeLanguage] = useState<'javascript' | 'python' | 'html_css' | 'sql'>('javascript');
  const [customInputText, setCustomInputText] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Core typing state
  const [targetText, setTargetText] = useState(PRACTICE_LESSONS[0].content);
  const [typedText, setTypedText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isErrorKey, setIsErrorKey] = useState(false);

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate words helper
  const getRandomWordList = (count: number) => {
    const pool = [...EASY_WORDS, ...MEDIUM_WORDS, ...HARD_WORDS, ...GAMING_WORDS];
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      words.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return words.join(' ');
  };

  const startTest = (text: string, timeLimitSec: number | null = null) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTargetText(text);
    setTypedText('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setIsFinished(false);
    setIsErrorKey(false);
    setTimeRemaining(timeLimitSec);
    setTimeout(() => hiddenInputRef.current?.focus(), 50);
  };

  // Timed Countdown loop
  useEffect(() => {
    if (mode === 'timed' && startTime && timeRemaining !== null && !isFinished) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsFinished(true);
            sound.playCorrect();
            return 0;
          }
          if (prev <= 4) sound.playTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [mode, startTime, isFinished, timeRemaining]);

  // Mode Pickers
  const pickLessonsMode = (lessonId: string) => {
    setMode('lessons');
    setSelectedLessonId(lessonId);
    const lesson = PRACTICE_LESSONS.find((l) => l.id === lessonId);
    if (lesson) startTest(lesson.content);
  };

  const pickTimedMode = (sec: number) => {
    setMode('timed');
    setTimedDuration(sec);
    startTest(getRandomWordList(80), sec);
  };

  const pickWordsMode = (count: number) => {
    setMode('words');
    setWordTarget(count);
    startTest(getRandomWordList(count));
  };

  const pickQuotesMode = () => {
    setMode('quotes');
    const randomQuote = FAMOUS_QUOTES[Math.floor(Math.random() * FAMOUS_QUOTES.length)];
    startTest(`"${randomQuote.quote}" — ${randomQuote.author}`);
  };

  const pickCodeMode = (lang: 'javascript' | 'python' | 'html_css' | 'sql') => {
    setMode('code');
    setCodeLanguage(lang);
    const snippets = CODE_SNIPPETS[lang];
    const snippet = snippets[Math.floor(Math.random() * snippets.length)];
    startTest(snippet);
  };

  const pickNumbersMode = () => {
    setMode('numbers');
    const drill = NUMBER_SYMBOL_DRILLS[Math.floor(Math.random() * NUMBER_SYMBOL_DRILLS.length)];
    startTest(drill);
  };

  const pickZenMode = () => {
    setMode('zen');
    const paras = [...PRACTICE_PARAGRAPHS.easy, ...PRACTICE_PARAGRAPHS.medium];
    startTest(paras[Math.floor(Math.random() * paras.length)]);
  };

  const applyCustomText = () => {
    if (!customInputText.trim()) return;
    setMode('custom');
    setShowCustomModal(false);
    startTest(customInputText.trim().replace(/\s+/g, ' '));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) return;
    sound.playKeyClick();

    if (e.key === 'Backspace') return;

    if (e.key.length === 1) {
      if (!startTime) setStartTime(Date.now());

      const nextCharIndex = typedText.length;
      const expectedChar = targetText[nextCharIndex];

      if (e.key !== expectedChar) {
        setIsErrorKey(true);
        setErrors((prev) => prev + 1);
        sound.playError();
      } else {
        setIsErrorKey(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    const val = e.target.value;

    if (val.length > targetText.length) return;
    setTypedText(val);

    if (startTime) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes > 0) {
        const wordsTyped = val.length / 5;
        const currentWpm = Math.round(wordsTyped / elapsedMinutes);
        setWpm(currentWpm);
      }

      const totalKeystrokes = val.length + errors;
      const acc = totalKeystrokes > 0 ? Math.round((val.length / totalKeystrokes) * 100) : 100;
      setAccuracy(acc);
    }

    if (val === targetText) {
      setIsFinished(true);
      sound.playCorrect();
    }
  };

  const expectedChar = targetText[typedText.length] || '';

  return (
    <div className="min-h-screen bg-retro-dark text-slate-100 flex flex-col select-none">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Codédex Retro HUD Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-retro-card border-2 border-slate-900 rounded-2xl p-4 shadow-retro">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-black flex items-center justify-center text-slate-950 font-black text-xl shadow-retro-sm">
              ⌨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-mono font-black text-white">
                  TRAINING GROUNDS
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-700">
                  FREE ACCESS
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Master touch typing, numbers, coding syntax, and endurance drills.
              </p>
            </div>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold">
            <button
              onClick={() => pickLessonsMode(selectedLessonId)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'lessons' ? 'bg-amber-400 text-slate-950 shadow-retro-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lessons
            </button>
            <button
              onClick={() => pickTimedMode(timedDuration)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'timed' ? 'bg-amber-400 text-slate-950 shadow-retro-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Timed
            </button>
            <button
              onClick={() => pickWordsMode(wordTarget)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'words' ? 'bg-amber-400 text-slate-950 shadow-retro-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Words
            </button>
            <button
              onClick={pickQuotesMode}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'quotes' ? 'bg-amber-400 text-slate-950 shadow-retro-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Quotes
            </button>
            <button
              onClick={() => pickCodeMode(codeLanguage)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'code' ? 'bg-amber-400 text-slate-950 shadow-retro-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Code
            </button>
            <button
              onClick={pickNumbersMode}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'numbers' ? 'bg-amber-400 text-slate-950 shadow-retro-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              123/#
            </button>
            <button
              onClick={pickZenMode}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'zen' ? 'bg-amber-400 text-slate-950 shadow-retro-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Zen
            </button>
            <button
              onClick={() => setShowCustomModal(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'custom' ? 'bg-amber-400 text-slate-950 shadow-retro-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Dynamic Mode Sub-Options Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          {mode === 'lessons' && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              {PRACTICE_LESSONS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => pickLessonsMode(l.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap border-2 font-bold transition-all ${
                    selectedLessonId === l.id
                      ? 'bg-amber-400 text-slate-950 border-black shadow-retro-sm'
                      : 'bg-retro-card text-slate-400 border-slate-900 hover:text-white'
                  }`}
                >
                  {l.title}
                </button>
              ))}
            </div>
          )}

          {mode === 'timed' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">SPRINT DURATION:</span>
              {[15, 30, 60, 120].map((sec) => (
                <button
                  key={sec}
                  onClick={() => pickTimedMode(sec)}
                  className={`px-3 py-1 rounded-lg border-2 font-bold transition-all ${
                    timedDuration === sec
                      ? 'bg-amber-400 text-slate-950 border-black shadow-retro-sm'
                      : 'bg-retro-card text-slate-400 border-slate-900 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}

          {mode === 'words' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">TARGET WORD COUNT:</span>
              {[10, 25, 50, 100].map((count) => (
                <button
                  key={count}
                  onClick={() => pickWordsMode(count)}
                  className={`px-3 py-1 rounded-lg border-2 font-bold transition-all ${
                    wordTarget === count
                      ? 'bg-amber-400 text-slate-950 border-black shadow-retro-sm'
                      : 'bg-retro-card text-slate-400 border-slate-900 hover:text-white'
                  }`}
                >
                  {count} words
                </button>
              ))}
            </div>
          )}

          {mode === 'code' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">SYNTAX PACK:</span>
              {(['javascript', 'python', 'html_css', 'sql'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => pickCodeMode(lang)}
                  className={`px-3 py-1 rounded-lg border-2 font-bold uppercase transition-all ${
                    codeLanguage === lang
                      ? 'bg-amber-400 text-slate-950 border-black shadow-retro-sm'
                      : 'bg-retro-card text-slate-400 border-slate-900 hover:text-white'
                  }`}
                >
                  {lang.replace('_', '/')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Codédex Retro HUD Stats */}
        <div className="grid grid-cols-4 gap-3 bg-retro-card border-2 border-slate-900 rounded-xl p-3.5 text-center shadow-retro">
          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              SPEED
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400">
              {wpm} <span className="text-xs text-slate-400 font-bold">WPM</span>
            </span>
          </div>

          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              ACCURACY
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
              {accuracy}%
            </span>
          </div>

          <div className="border-r border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              {mode === 'timed' ? 'TIME REMAINING' : 'ERRORS'}
            </span>
            <span
              className={`text-2xl sm:text-3xl font-mono font-black ${
                mode === 'timed' && timeRemaining !== null && timeRemaining <= 5
                  ? 'text-rose-400 animate-pulse'
                  : 'text-white'
              }`}
            >
              {mode === 'timed' && timeRemaining !== null ? `${timeRemaining}s` : errors}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              EXP GAINED
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-purple-400">
              +{Math.round(wpm * 1.5 + (accuracy > 95 ? 50 : 0))} <span className="text-xs text-purple-300">XP</span>
            </span>
          </div>
        </div>

        {/* Codédex Retro CRT Canvas */}
        <div
          onClick={() => hiddenInputRef.current?.focus()}
          className="relative bg-slate-950 border-4 border-slate-900 focus-within:border-amber-400 rounded-2xl p-6 sm:p-8 shadow-retro-lg cursor-text min-h-[180px] flex items-center justify-center select-none"
        >
          {/* Subtle CRT scanline overlay */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none rounded-2xl"
            style={{
              backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
              backgroundSize: '100% 4px'
            }}
          />

          <input
            ref={hiddenInputRef}
            type="text"
            value={typedText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 pointer-events-none"
          />

          {isFinished ? (
            <div className="flex flex-col items-center text-center animate-bounce-short z-10">
              <Trophy className="w-12 h-12 text-amber-400 mb-2" />
              <h3 className="text-2xl font-mono font-black text-amber-300">
                QUEST COMPLETED!
              </h3>
              <p className="text-sm font-mono text-slate-300 mt-1">
                Score: <span className="text-amber-400 font-bold">{wpm} WPM</span> • Accuracy:{' '}
                <span className="text-emerald-400 font-bold">{accuracy}%</span>
              </p>
              <button
                onClick={() => startTest(targetText, mode === 'timed' ? timedDuration : null)}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono font-black bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-black shadow-retro active:translate-x-[2px] active:translate-y-[2px] transition-all text-xs uppercase tracking-wider"
              >
                <RefreshCw className="w-4 h-4" /> REPLAY LEVEL
              </button>
            </div>
          ) : (
            <div className="text-lg sm:text-xl font-mono leading-relaxed tracking-wide text-left w-full break-words z-10">
              {targetText.split('').map((char, index) => {
                let colorClass = 'text-slate-600';
                const isCurrent = index === typedText.length;

                if (index < typedText.length) {
                  colorClass = typedText[index] === char ? 'text-amber-300' : 'text-rose-500 underline decoration-2';
                }

                return (
                  <span
                    key={index}
                    className={`relative ${colorClass} ${
                      isCurrent ? 'bg-amber-400 text-slate-950 font-bold rounded px-0.5' : ''
                    }`}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Virtual Keyboard with Finger Guidance */}
        <div className="mt-1">
          <VirtualKeyboard currentKey={expectedChar} isError={isErrorKey} />
        </div>
      </main>

      {/* CUSTOM TEXT MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-retro-card border-4 border-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-retro">
            <h3 className="text-lg font-mono font-black text-amber-300 uppercase tracking-wider mb-2">
              PASTE CUSTOM DRILL TEXT
            </h3>
            <p className="text-xs font-mono text-slate-400 mb-3">
              Paste code, book quotes, or personal notes to practice typing them.
            </p>
            <textarea
              value={customInputText}
              onChange={(e) => setCustomInputText(e.target.value)}
              placeholder="Paste your custom text here..."
              rows={5}
              className="w-full bg-slate-950 border-2 border-slate-900 focus:border-amber-400 rounded-xl p-3 text-xs font-mono text-white focus:outline-none shadow-retro-sm mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-bold text-xs border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={applyCustomText}
                disabled={!customInputText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-xs uppercase border-2 border-black shadow-retro-sm active:translate-x-[1px] active:translate-y-[1px]"
              >
                Load Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
