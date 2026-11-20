import { Server } from 'socket.io';
import {
  RoomState,
  RoundResult,
  ClientToServerEvents,
  ServerToClientEvents,
  Player
} from '@typefest/shared';
import { WordSelector } from '../words/WordSelector.js';

export class GameEngine {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private room: RoomState;
  private usedWords: Set<string> = new Set();
  private timerHandle: NodeJS.Timeout | null = null;
  private countdownHandle: NodeJS.Timeout | null = null;
  private roundEndHandle: NodeJS.Timeout | null = null;
  private botTimeouts: NodeJS.Timeout[] = [];
  private onGameOverCallback: (room: RoomState) => void;

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    room: RoomState,
    onGameOver: (room: RoomState) => void
  ) {
    this.io = io;
    this.room = room;
    this.onGameOverCallback = onGameOver;
  }

  public startGame(): void {
    if (this.room.status === 'countdown') return;

    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.countdownHandle) {
      clearInterval(this.countdownHandle);
      this.countdownHandle = null;
    }
    if (this.roundEndHandle) {
      clearTimeout(this.roundEndHandle);
      this.roundEndHandle = null;
    }
    this.botTimeouts.forEach(clearTimeout);
    this.botTimeouts = [];

    this.room.status = 'countdown';
    this.room.currentRound = 0;
    this.room.history = [];
    this.room.lastRoundResult = undefined;
    this.room.currentTurnPlayerId = undefined;
    this.usedWords.clear();

    // Reset player scores and status for new game
    Object.values(this.room.players).forEach((p) => {
      p.score = 0;
      p.streak = 0;
      p.lives = 3;
      p.status = 'idle';
      p.progressPercent = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.finishRank = undefined;
      p.lastSubmitTimeMs = undefined;
    });

    this.broadcastState();

    // 3..2..1 Countdown
    let count = 3;
    this.io.to(this.room.code).emit('game:countdown', count);

    this.countdownHandle = setInterval(() => {
      count -= 1;
      if (count > 0) {
        this.io.to(this.room.code).emit('game:countdown', count);
      } else {
        if (this.countdownHandle) {
          clearInterval(this.countdownHandle);
          this.countdownHandle = null;
        }
        this.startNextRound();
      }
    }, 1000);
  }

  public startNextRound(): void {
    if (this.timerHandle) clearTimeout(this.timerHandle);

    this.room.currentRound += 1;

    // Check if game is over (rounds limit or only 1 player alive in elimination modes)
    const activePlayers = Object.values(this.room.players).filter((p) => p.lives > 0);
    const isEliminationMode = this.room.settings.mode === 'bomb-pass' || this.room.settings.mode === 'type-or-die';

    if (
      this.room.currentRound > this.room.settings.rounds ||
      (isEliminationMode && activePlayers.length <= 1 && Object.keys(this.room.players).length > 1)
    ) {
      this.finishGame();
      return;
    }

    this.room.status = 'in-game';
    if (this.room.settings.mode === 'keydash-race') {
      this.room.currentWord = WordSelector.getRaceParagraph(this.room.settings.difficulty);
    } else {
      this.room.currentWord = WordSelector.getRandomWord(this.room.settings.difficulty, this.usedWords);
    }

    // Reset status and progress for active players
    Object.values(this.room.players).forEach((p) => {
      if (p.lives > 0) {
        p.status = 'typing';
        p.lastSubmitTimeMs = undefined;
        p.progressPercent = 0;
        p.wpm = 0;
        p.accuracy = 100;
        p.finishRank = undefined;
      } else {
        p.status = 'eliminated';
      }
    });

    // Handle Turn for Bomb Pass mode
    if (this.room.settings.mode === 'bomb-pass') {
      const candidates = activePlayers;
      if (candidates.length > 0) {
        const turnIndex = Math.floor(Math.random() * candidates.length);
        this.room.currentTurnPlayerId = candidates[turnIndex].id;
      }
    } else {
      this.room.currentTurnPlayerId = undefined;
    }

    const now = Date.now();
    let durationMs: number;

    if (this.room.settings.mode === 'bomb-pass') {
      // HIDDEN RANDOM BOMB TIMER:
      // Minimum safe duration: 14s (never explodes in the 1st second!)
      // Maximum duration: 26s
      const minSeconds = 14;
      const maxSeconds = 26;
      const bombSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
      durationMs = bombSeconds * 1000;
      this.room.roundStartTime = now;
      this.room.roundEndTime = now + durationMs;
    } else if (this.room.settings.mode === 'keydash-race') {
      // KEYDASH SPEEDWAY PARAGRAPH SPRINT: 75 seconds limit
      durationMs = 75 * 1000;
      this.room.roundStartTime = now;
      this.room.roundEndTime = now + durationMs;
    } else {
      durationMs = this.room.settings.timerSec * 1000;
      this.room.roundStartTime = now;
      this.room.roundEndTime = now + durationMs;
    }

    this.io.to(this.room.code).emit('game:round_start', {
      round: this.room.currentRound,
      word: this.room.currentWord,
      timerSec: this.room.settings.timerSec,
      currentTurnPlayerId: this.room.currentTurnPlayerId
    });

    this.broadcastState();

    // Round Timer / Detonation Timer
    this.timerHandle = setTimeout(() => {
      this.endRound();
    }, durationMs);

    // Clear any previous bot typing timers and schedule new AI actions
    this.botTimeouts.forEach(clearTimeout);
    this.botTimeouts = [];

    const activeBots = Object.values(this.room.players).filter((p) => p.isBot && p.lives > 0);
    if (activeBots.length > 0) {
      if (this.room.settings.mode === 'bomb-pass') {
        // If initial bomb holder is a bot, simulate typing to pass before detonation
        if (this.room.currentTurnPlayerId) {
          const currentBot = this.room.players[this.room.currentTurnPlayerId];
          if (currentBot && currentBot.isBot) {
            const delay = Math.max(1300, 1500 + Math.random() * 1500);
            const t = setTimeout(() => {
              if (this.room.status === 'in-game' && this.room.currentTurnPlayerId === currentBot.id) {
                this.handleSubmit(currentBot.id, this.room.currentWord);
              }
            }, delay);
            this.botTimeouts.push(t);
          }
        }
      } else if (this.room.settings.mode === 'keydash-race') {
        // Multi-lane Real-Time Bot Speedway Racing Simulation!
        const totalWords = this.room.currentWord.trim().split(/\s+/).length || 25;
        const baseWpm =
          this.room.settings.difficulty === 'easy'
            ? 42
            : this.room.settings.difficulty === 'medium'
            ? 58
            : 74;

        const botSpeeds = new Map<string, number>();
        activeBots.forEach((bot, i) => {
          const variation = (i * 5 - 5) + (Math.random() * 8 - 4);
          botSpeeds.set(bot.id, Math.round(baseWpm + variation));
        });

        const raceStart = Date.now();
        const raceInterval = setInterval(() => {
          if (this.room.status !== 'in-game') {
            clearInterval(raceInterval);
            return;
          }

          const elapsedSec = (Date.now() - raceStart) / 1000;
          let updated = false;

          activeBots.forEach((bot) => {
            if (bot.status === 'submitted') return;

            const wpm = botSpeeds.get(bot.id) || baseWpm;
            const wordsDone = (wpm / 60) * elapsedSec;
            const prog = Math.min(100, Math.round((wordsDone / totalWords) * 100));

            bot.progressPercent = prog;
            bot.wpm = wpm;
            bot.accuracy = Math.round(96 + Math.random() * 3);
            bot.score = Math.round(prog * 3);
            updated = true;

            if (prog >= 100) {
              bot.status = 'submitted';
              const finishedCount = Object.values(this.room.players).filter((p) => p.finishRank !== undefined).length;
              bot.finishRank = finishedCount + 1;
              const rankBonus = Math.max(100, 500 - (bot.finishRank - 1) * 100);
              bot.score += rankBonus;

              this.io.to(this.room.code).emit('chat:message', {
                id: `sys-${Date.now()}-${bot.id}`,
                senderId: 'system',
                senderName: 'KEYDASH SPEEDWAY',
                text: `🏁 ${bot.nickname} crossed the finish line in ${bot.finishRank === 1 ? '1st Place 👑' : `${bot.finishRank}th Place`} (${wpm} WPM)!`,
                timestamp: Date.now(),
                isSystem: true
              });
            }
          });

          if (updated) {
            this.broadcastState();
          }

          const pending = Object.values(this.room.players).filter(
            (p) => p.lives > 0 && p.status === 'typing'
          );
          if (pending.length === 0) {
            clearInterval(raceInterval);
            if (this.timerHandle) clearTimeout(this.timerHandle);
            setTimeout(() => this.endRound(), 1000);
          }
        }, 250);

        this.botTimeouts.push(raceInterval as any);
      } else {
        // word-blitz & type-or-die: single word typing
        activeBots.forEach((bot) => {
          const timeLimitMs = this.room.settings.timerSec * 1000;
          const baseDelay = (this.room.currentWord.length * 280) + (Math.random() * 1600 - 300);
          const delay = Math.max(1100, Math.min(timeLimitMs - 500, baseDelay));

          const t = setTimeout(() => {
            if (this.room.status === 'in-game' && bot.status === 'typing' && bot.lives > 0) {
              this.handleSubmit(bot.id, this.room.currentWord);
            }
          }, delay);
          this.botTimeouts.push(t);
        });
      }
    }
  }

  public handleRaceProgress(
    playerId: string,
    progressPercent: number,
    wpm: number,
    accuracy: number
  ): void {
    if (this.room.status !== 'in-game' || this.room.settings.mode !== 'keydash-race') return;

    const player = this.room.players[playerId];
    if (!player || player.status === 'submitted' || player.lives <= 0) return;

    const boundedProg = Math.max(0, Math.min(100, Math.round(progressPercent)));
    player.progressPercent = boundedProg;
    player.wpm = Math.max(0, Math.round(wpm));
    player.accuracy = Math.max(0, Math.min(100, Math.round(accuracy)));
    player.score = Math.max(player.score, Math.round(boundedProg * 3));

    if (boundedProg >= 100) {
      player.status = 'submitted';
      const finishedCount = Object.values(this.room.players).filter((p) => p.finishRank !== undefined).length;
      player.finishRank = finishedCount + 1;
      const rankBonus = Math.max(150, 600 - (player.finishRank - 1) * 150);
      player.score += rankBonus;

      this.io.to(this.room.code).emit('chat:message', {
        id: `sys-${Date.now()}-${player.id}`,
        senderId: 'system',
        senderName: 'KEYDASH SPEEDWAY',
        text: `🏁 ${player.nickname} crossed the finish line in ${player.finishRank === 1 ? '1st Place 👑' : `${player.finishRank}th Place`} with ${player.wpm} WPM & ${player.accuracy}% accuracy!`,
        timestamp: Date.now(),
        isSystem: true
      });

      const pending = Object.values(this.room.players).filter(
        (p) => p.lives > 0 && p.status === 'typing'
      );
      if (pending.length === 0) {
        if (this.timerHandle) clearTimeout(this.timerHandle);
        setTimeout(() => this.endRound(), 1000);
      }
    }

    this.broadcastState();
  }

  public handleSubmit(
    playerId: string,
    submittedWord: string
  ): { correct: boolean; scoreDelta: number; message?: string } {
    if (this.room.status !== 'in-game') {
      return { correct: false, scoreDelta: 0, message: 'No active round' };
    }

    const player = this.room.players[playerId];
    if (!player || player.lives <= 0 || player.status === 'submitted') {
      return { correct: false, scoreDelta: 0, message: 'Invalid or already submitted' };
    }

    // In Bomb Pass mode, only the current turn player can submit
    if (this.room.settings.mode === 'bomb-pass' && this.room.currentTurnPlayerId !== playerId) {
      return { correct: false, scoreDelta: 0, message: 'Not your turn!' };
    }

    const isMatch = submittedWord.trim().toLowerCase() === this.room.currentWord.trim().toLowerCase();

    if (!isMatch) {
      player.streak = 0;
      return { correct: false, scoreDelta: 0, message: 'Wrong word, try again!' };
    }

    // Correct Submission!
    player.status = 'submitted';
    const elapsedMs = Date.now() - this.room.roundStartTime;
    player.lastSubmitTimeMs = elapsedMs;
    player.streak += 1;

    // Calculate score: Base 100 + Speed Bonus (up to 50) + Streak Bonus
    const totalDurationMs = this.room.settings.timerSec * 1000;
    const timeRemainingFraction = Math.max(0, (totalDurationMs - elapsedMs) / totalDurationMs);
    const speedBonus = Math.round(timeRemainingFraction * 50);
    const streakBonus = Math.min(player.streak * 10, 50);
    const scoreDelta = 100 + speedBonus + streakBonus;

    player.score += scoreDelta;

    const timeSec = parseFloat((elapsedMs / 1000).toFixed(2));

    this.io.to(this.room.code).emit('game:word_solved', {
      playerId: player.id,
      nickname: player.nickname,
      points: scoreDelta,
      timeSec
    });

    this.broadcastState();

    // In Bomb Pass mode, pass the bomb to another living player!
    if (this.room.settings.mode === 'bomb-pass') {
      const activeLivingOthers = Object.values(this.room.players).filter(
        (p) => p.lives > 0 && p.id !== playerId
      );

      const nextTarget = activeLivingOthers.length > 0
        ? activeLivingOthers[Math.floor(Math.random() * activeLivingOthers.length)]
        : player;

      this.room.currentTurnPlayerId = nextTarget.id;
      this.room.currentWord = WordSelector.getRandomWord(this.room.settings.difficulty, this.usedWords);

      player.status = 'idle';
      nextTarget.status = 'typing';

      const passMsg = `💣 ${player.nickname} passed the ticking bomb to ${nextTarget.nickname}! ⚠️ BOMB EXPLODING SOON! 🏃💨`;
      this.io.to(this.room.code).emit('chat:message', {
        id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: 'system',
        senderName: 'HOT POTATO',
        text: passMsg,
        timestamp: Date.now(),
        isSystem: true
      });

      this.broadcastState();

      // Clear previous bot timeouts and schedule if next recipient is a bot
      this.botTimeouts.forEach(clearTimeout);
      this.botTimeouts = [];

      if (nextTarget.isBot) {
        const delay = Math.max(1300, 1500 + Math.random() * 1600);
        const t = setTimeout(() => {
          if (this.room.status === 'in-game' && this.room.currentTurnPlayerId === nextTarget.id) {
            this.handleSubmit(nextTarget.id, this.room.currentWord);
          }
        }, delay);
        this.botTimeouts.push(t);
      }

      return { correct: true, scoreDelta, message: `Passed to ${nextTarget.nickname}!` };
    } else {
      const activePending = Object.values(this.room.players).filter(
        (p) => p.lives > 0 && p.status === 'typing'
      );
      if (activePending.length === 0) {
        if (this.timerHandle) clearTimeout(this.timerHandle);
        setTimeout(() => this.endRound(), 500);
      }
      return { correct: true, scoreDelta };
    }
  }

  private endRound(): void {
    if (this.timerHandle) clearTimeout(this.timerHandle);
    this.botTimeouts.forEach(clearTimeout);
    this.botTimeouts = [];

    this.room.status = 'round-end';

    const eliminated: string[] = [];
    const submissions: RoundResult['submissions'] = [];
    let explodedPlayerId: string | undefined;
    let explodedPlayerName: string | undefined;

    Object.values(this.room.players).forEach((p) => {
      if (p.lives > 0) {
        if (p.status === 'submitted') {
          submissions.push({
            playerId: p.id,
            nickname: p.nickname,
            timeSec: p.lastSubmitTimeMs ? parseFloat((p.lastSubmitTimeMs / 1000).toFixed(2)) : 0,
            pointsEarned: 100,
            isCorrect: true
          });
        } else {
          // Player failed to submit in time
          p.streak = 0;
          p.status = 'idle';

          // In bomb-pass, the person holding the bomb loses a life
          if (this.room.settings.mode === 'bomb-pass') {
            if (p.id === this.room.currentTurnPlayerId) {
              explodedPlayerId = p.id;
              explodedPlayerName = p.nickname;
              p.lives -= 1;
              const bombMsg = p.lives <= 0
                ? `💥 BOOM! The bomb detonated on ${p.nickname}! 💀 ELIMINATED!`
                : `💥 BOOM! The bomb detonated on ${p.nickname}! (-1 Life ❤️, ${p.lives} left)`;
              
              this.io.to(this.room.code).emit('chat:message', {
                id: `sys-${Date.now()}-${p.id}`,
                senderId: 'system',
                senderName: 'BOMB PASS',
                text: bombMsg,
                timestamp: Date.now(),
                isSystem: true
              });

              if (p.lives <= 0) {
                p.status = 'eliminated';
                eliminated.push(p.id);
              }
            }
          } else if (this.room.settings.mode === 'type-or-die') {
            p.lives -= 1;
            const lavaMsg = p.lives <= 0
              ? `🌋 The rising lava engulfed ${p.nickname}! 💀 ELIMINATED!`
              : `🌋 Lava touched ${p.nickname}! (-1 Life ❤️, ${p.lives} left)`;

            this.io.to(this.room.code).emit('chat:message', {
              id: `sys-${Date.now()}-${p.id}`,
              senderId: 'system',
              senderName: 'TYPE OR DIE',
              text: lavaMsg,
              timestamp: Date.now(),
              isSystem: true
            });

            if (p.lives <= 0) {
              p.status = 'eliminated';
              eliminated.push(p.id);
            }
          }
        }
      }
    });

    // Sort submissions by fastest time
    submissions.sort((a, b) => a.timeSec - b.timeSec);

    const roundResult: RoundResult = {
      round: this.room.currentRound,
      word: this.room.currentWord,
      submissions,
      eliminatedPlayerIds: eliminated,
      explodedPlayerId,
      explodedPlayerName
    };

    this.room.lastRoundResult = roundResult;
    this.room.history.push(roundResult);

    this.io.to(this.room.code).emit('game:round_end', roundResult);
    this.broadcastState();

    // Wait 3.5 seconds to show round result splash on display board before starting next round
    if (this.roundEndHandle) clearTimeout(this.roundEndHandle);
    this.roundEndHandle = setTimeout(() => {
      this.startNextRound();
    }, 3500);
  }

  private finishGame(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.countdownHandle) {
      clearInterval(this.countdownHandle);
      this.countdownHandle = null;
    }
    if (this.roundEndHandle) {
      clearTimeout(this.roundEndHandle);
      this.roundEndHandle = null;
    }
    this.botTimeouts.forEach(clearTimeout);
    this.botTimeouts = [];

    this.room.status = 'game-over';

    const standings = Object.values(this.room.players).sort((a, b) => b.score - a.score);

    this.io.to(this.room.code).emit('game:game_over', standings);
    this.broadcastState();
    this.onGameOverCallback(this.room);
  }

  public resetToLobby(): void {
    this.stop();

    this.room.status = 'lobby';
    this.room.currentRound = 0;
    this.room.history = [];
    this.room.lastRoundResult = undefined;
    this.room.currentTurnPlayerId = undefined;
    this.usedWords.clear();

    Object.values(this.room.players).forEach((p) => {
      p.score = 0;
      p.streak = 0;
      p.lives = 3;
      p.status = 'idle';
      p.progressPercent = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.finishRank = undefined;
      p.lastSubmitTimeMs = undefined;
      p.isReady = !!(p.isHost || p.isBot);
    });

    this.broadcastState();
  }

  public stop(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.countdownHandle) {
      clearInterval(this.countdownHandle);
      this.countdownHandle = null;
    }
    if (this.roundEndHandle) {
      clearTimeout(this.roundEndHandle);
      this.roundEndHandle = null;
    }
    this.botTimeouts.forEach(clearTimeout);
    this.botTimeouts = [];
  }

  private broadcastState(): void {
    this.io.to(this.room.code).emit('room:state', this.room);
  }
}
