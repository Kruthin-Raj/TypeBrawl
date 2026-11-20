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
    this.usedWords.clear();

    // Reset player scores and status for new game
    Object.values(this.room.players).forEach((p) => {
      p.score = 0;
      p.streak = 0;
      p.lives = 3;
      p.status = 'idle';
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
    this.room.currentWord = WordSelector.getRandomWord(this.room.settings.difficulty, this.usedWords);

    // Reset status for active players
    Object.values(this.room.players).forEach((p) => {
      if (p.lives > 0) {
        p.status = 'typing';
        p.lastSubmitTimeMs = undefined;
      } else {
        p.status = 'eliminated';
      }
    });

    // Handle Turn for Bomb Pass mode
    if (this.room.settings.mode === 'bomb-pass') {
      const candidates = activePlayers;
      if (candidates.length > 0) {
        const turnIndex = (this.room.currentRound - 1) % candidates.length;
        this.room.currentTurnPlayerId = candidates[turnIndex].id;
      }
    } else {
      this.room.currentTurnPlayerId = undefined;
    }

    const now = Date.now();
    const durationMs = this.room.settings.timerSec * 1000;
    this.room.roundStartTime = now;
    this.room.roundEndTime = now + durationMs;

    this.io.to(this.room.code).emit('game:round_start', {
      round: this.room.currentRound,
      word: this.room.currentWord,
      timerSec: this.room.settings.timerSec,
      currentTurnPlayerId: this.room.currentTurnPlayerId
    });

    this.broadcastState();

    // Round Timer
    this.timerHandle = setTimeout(() => {
      this.endRound();
    }, durationMs);

    // Clear any previous bot typing timers and schedule new AI actions
    this.botTimeouts.forEach(clearTimeout);
    this.botTimeouts = [];

    const activeBots = Object.values(this.room.players).filter((p) => p.isBot && p.lives > 0);
    if (activeBots.length > 0) {
      if (this.room.settings.mode === 'bomb-pass') {
        // If current turn player is a bot, simulate typing to pass before detonation
        if (this.room.currentTurnPlayerId) {
          const currentBot = this.room.players[this.room.currentTurnPlayerId];
          if (currentBot && currentBot.isBot) {
            const timeLimitMs = this.room.settings.timerSec * 1000;
            // 75% chance bot solves before detonation, 25% chance it detonates on bot
            const willSolve = Math.random() < 0.75;
            if (willSolve) {
              const delay = Math.max(1200, Math.min(timeLimitMs - 700, 1600 + Math.random() * 2000));
              const t = setTimeout(() => {
                if (this.room.status === 'in-game' && this.room.currentTurnPlayerId === currentBot.id) {
                  this.handleSubmit(currentBot.id, this.room.currentWord);
                }
              }, delay);
              this.botTimeouts.push(t);
            }
          }
        }
      } else {
        // keydash-race, word-blitz, type-or-die: each bot types at realistic cadence
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

    // If all active players submitted, or in Bomb Pass mode after turn player solved, end round early!
    if (this.room.settings.mode === 'bomb-pass') {
      if (this.timerHandle) clearTimeout(this.timerHandle);
      setTimeout(() => this.endRound(), 500);
    } else {
      const activePending = Object.values(this.room.players).filter(
        (p) => p.lives > 0 && p.status === 'typing'
      );
      if (activePending.length === 0) {
        if (this.timerHandle) clearTimeout(this.timerHandle);
        setTimeout(() => this.endRound(), 500);
      }
    }

    return { correct: true, scoreDelta };
  }

  private endRound(): void {
    if (this.timerHandle) clearTimeout(this.timerHandle);

    this.room.status = 'round-end';

    const eliminated: string[] = [];
    const submissions: RoundResult['submissions'] = [];

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
      eliminatedPlayerIds: eliminated
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
