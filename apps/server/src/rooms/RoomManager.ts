import { Server, Socket } from 'socket.io';
import {
  RoomState,
  RoomSettings,
  Player,
  PublicRoomSummary,
  ChatMessage,
  ClientToServerEvents,
  ServerToClientEvents,
  AvatarConfig,
  GameMode
} from '@typefest/shared';
import { GameEngine } from '../engine/GameEngine.js';

const BOT_PRESETS = [
  {
    name: 'TurboBot',
    avatar: { color: '#06B6D4', eyes: 2, mouth: 1, accessory: 3 }
  },
  {
    name: 'PixelTyper',
    avatar: { color: '#EC4899', eyes: 1, mouth: 2, accessory: 2 }
  },
  {
    name: 'CyberSwift',
    avatar: { color: '#10B981', eyes: 4, mouth: 0, accessory: 1 }
  },
  {
    name: 'NeonRacer',
    avatar: { color: '#8B5CF6', eyes: 3, mouth: 3, accessory: 4 }
  }
];

export class RoomManager {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private rooms: Map<string, RoomState> = new Map();
  private engines: Map<string, GameEngine> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  public createRoom(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    rawSettings: Omit<RoomSettings, 'roomCode'>,
    playerData: { nickname: string; avatar: AvatarConfig }
  ): { success: boolean; roomCode?: string; error?: string } {
    // If socket is already in a room, leave it first to prevent ghost room bugs
    if (this.socketToRoom.has(socket.id)) {
      this.leaveRoom(socket);
    }

    const code = this.generateRoomCode();
    const playerId = socket.id;

    const hostPlayer: Player = {
      id: playerId,
      socketId: socket.id,
      nickname: playerData.nickname.trim().slice(0, 16) || 'Guest',
      avatar: playerData.avatar,
      score: 0,
      streak: 0,
      lives: 3,
      status: 'idle',
      isHost: true,
      isReady: true
    };

    const validModes: GameMode[] = ['keydash-race', 'bomb-pass', 'word-blitz', 'type-or-die'];
    const validatedMode: GameMode = validModes.includes(rawSettings.mode as GameMode)
      ? (rawSettings.mode as GameMode)
      : 'keydash-race';

    const roomSettings: RoomSettings = {
      ...rawSettings,
      mode: validatedMode,
      roomCode: code,
      timerSec: Math.max(3, Math.min(rawSettings.timerSec || 8, 30)),
      rounds: Math.max(5, Math.min(rawSettings.rounds || 10, 50)),
      maxPlayers: Math.max(2, Math.min(rawSettings.maxPlayers || 8, 12))
    };

    const roomState: RoomState = {
      code,
      settings: roomSettings,
      hostId: playerId,
      players: { [playerId]: hostPlayer },
      status: 'lobby',
      currentRound: 0,
      currentWord: '',
      roundStartTime: 0,
      roundEndTime: 0,
      history: []
    };

    this.rooms.set(code, roomState);
    this.socketToRoom.set(socket.id, code);
    socket.join(code);

    const engine = new GameEngine(this.io, roomState, () => {
      // Game over handling
    });
    this.engines.set(code, engine);

    socket.emit('room:state', roomState);
    return { success: true, roomCode: code };
  }

  public joinRoom(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    code: string,
    password: string | undefined,
    playerData: { nickname: string; avatar: AvatarConfig }
  ): { success: boolean; error?: string } {
    const cleanCode = code.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { success: false, error: 'Room does not exist' };
    }

    if (room.settings.password && room.settings.password !== password) {
      return { success: false, error: 'Incorrect room password' };
    }

    // If socket is already in THIS room (e.g. host who just created the room), do NOT destroy or leave the room!
    if (this.socketToRoom.get(socket.id) === cleanCode && room.players[socket.id]) {
      room.players[socket.id].nickname = playerData.nickname.trim().slice(0, 16) || room.players[socket.id].nickname;
      room.players[socket.id].avatar = playerData.avatar || room.players[socket.id].avatar;
      socket.emit('room:state', room);
      return { success: true };
    }

    if (Object.keys(room.players).length >= room.settings.maxPlayers && !room.players[socket.id]) {
      return { success: false, error: 'Room is full' };
    }

    // If socket is in a DIFFERENT room, leave that old room first
    const currentRoomCode = this.socketToRoom.get(socket.id);
    if (currentRoomCode && currentRoomCode !== cleanCode) {
      this.leaveRoom(socket);
    }

    const playerId = socket.id;
    // Check if this player should be host
    const isFirstHuman = Object.values(room.players).filter((p) => !p.isBot).length === 0;
    if (isFirstHuman || room.hostId === playerId) {
      room.hostId = playerId;
    }

    const isHost = room.hostId === playerId;

    const newPlayer: Player = {
      id: playerId,
      socketId: socket.id,
      nickname: playerData.nickname.trim().slice(0, 16) || 'Guest',
      avatar: playerData.avatar,
      score: 0,
      streak: 0,
      lives: 3,
      status: 'idle',
      isHost: isHost,
      isReady: isHost
    };

    room.players[playerId] = newPlayer;
    this.socketToRoom.set(socket.id, cleanCode);
    socket.join(cleanCode);

    // Make sure engine exists for the room
    if (!this.engines.has(cleanCode)) {
      const engine = new GameEngine(this.io, room, () => {});
      this.engines.set(cleanCode, engine);
    }

    this.io.to(cleanCode).emit('room:player_joined', newPlayer);
    this.io.to(cleanCode).emit('room:state', room);

    // Announce player in chat
    const joinMessage: ChatMessage = {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'TypeFest',
      text: `${newPlayer.nickname} joined the party! 🎉`,
      timestamp: Date.now(),
      isSystem: true
    };
    this.io.to(cleanCode).emit('chat:message', joinMessage);

    return { success: true };
  }

  public leaveRoom(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    const socketId = socket.id;
    const code = this.socketToRoom.get(socketId);
    if (!code) return;

    this.socketToRoom.delete(socketId);
    socket.leave(code);

    const room = this.rooms.get(code);
    if (!room) return;

    const leavingPlayer = room.players[socketId];
    delete room.players[socketId];

    const remainingHumans = Object.values(room.players).filter((p) => !p.isBot);

    if (remainingHumans.length === 0) {
      // Room has no human players left, clean up engine and delete room immediately
      const engine = this.engines.get(code);
      if (engine) engine.stop();
      this.engines.delete(code);
      this.rooms.delete(code);
      return;
    }

    // If host left, elect new host from remaining humans
    if (room.hostId === socketId) {
      room.hostId = remainingHumans[0].id;
      room.players[room.hostId].isHost = true;
      room.players[room.hostId].isReady = true;
    }

    this.io.to(code).emit('room:player_left', socketId);
    this.io.to(code).emit('room:state', room);

    if (leavingPlayer) {
      const leaveMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'TypeFest',
        text: `${leavingPlayer.nickname} left the room.`,
        timestamp: Date.now(),
        isSystem: true
      };
      this.io.to(code).emit('chat:message', leaveMsg);
    }
  }

  public handleDisconnect(socketId: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(code);
    if (!room) return;

    const leavingPlayer = room.players[socketId];
    delete room.players[socketId];

    const remainingHumans = Object.values(room.players).filter((p) => !p.isBot);

    if (remainingHumans.length === 0) {
      // Room empty of human players, clean up
      const engine = this.engines.get(code);
      if (engine) engine.stop();
      this.engines.delete(code);
      this.rooms.delete(code);
      return;
    }

    // If host left, elect new host from humans
    if (room.hostId === socketId) {
      room.hostId = remainingHumans[0].id;
      room.players[room.hostId].isHost = true;
      room.players[room.hostId].isReady = true;
    }

    this.io.to(code).emit('room:player_left', socketId);
    this.io.to(code).emit('room:state', room);

    if (leavingPlayer) {
      const leaveMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'TypeFest',
        text: `${leavingPlayer.nickname} left the room.`,
        timestamp: Date.now(),
        isSystem: true
      };
      this.io.to(code).emit('chat:message', leaveMsg);
    }
  }

  public toggleReady(socketId: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'lobby') return;

    const player = room.players[socketId];
    if (!player) return;

    player.isReady = !player.isReady;
    this.io.to(code).emit('room:state', room);
  }

  public addBot(socketId: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'lobby') return;
    if (room.hostId !== socketId && !room.players[socketId]?.isHost) return;

    if (Object.keys(room.players).length >= room.settings.maxPlayers) return;

    const currentBots = Object.values(room.players).filter((p) => p.isBot);
    const botIndex = currentBots.length;
    const preset = BOT_PRESETS[botIndex % BOT_PRESETS.length];
    const botId = `bot-${code}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const botNickname = currentBots.some((b) => b.nickname === preset.name)
      ? `${preset.name} ${botIndex + 1}`
      : preset.name;

    const botPlayer: Player = {
      id: botId,
      socketId: botId,
      nickname: botNickname,
      avatar: preset.avatar,
      score: 0,
      streak: 0,
      lives: 3,
      status: 'idle',
      isHost: false,
      isReady: true,
      isBot: true
    };

    room.players[botId] = botPlayer;
    room.settings.withBots = true;
    this.io.to(code).emit('room:state', room);

    const joinMessage: ChatMessage = {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'TypeFest',
      text: `🤖 ${botNickname} was added to the room.`,
      timestamp: Date.now(),
      isSystem: true
    };
    this.io.to(code).emit('chat:message', joinMessage);
  }

  public removeBot(socketId: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'lobby') return;
    if (room.hostId !== socketId && !room.players[socketId]?.isHost) return;

    const currentBots = Object.values(room.players).filter((p) => p.isBot);
    if (currentBots.length === 0) return;

    const botToRemove = currentBots[currentBots.length - 1];
    delete room.players[botToRemove.id];

    if (Object.values(room.players).filter((p) => p.isBot).length === 0) {
      room.settings.withBots = false;
    }

    this.io.to(code).emit('room:state', room);

    const leaveMessage: ChatMessage = {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'TypeFest',
      text: `🤖 ${botToRemove.nickname} was removed from the room.`,
      timestamp: Date.now(),
      isSystem: true
    };
    this.io.to(code).emit('chat:message', leaveMessage);
  }

  public toggleBots(socketId: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'lobby') return;
    if (room.hostId !== socketId && !room.players[socketId]?.isHost) return;

    const existingBots = Object.values(room.players).filter((p) => p.isBot);
    if (existingBots.length > 0) {
      // Remove all bots
      existingBots.forEach((b) => {
        delete room.players[b.id];
      });
      room.settings.withBots = false;
    } else {
      // Add 4 bots
      BOT_PRESETS.forEach((botPreset, i) => {
        const botId = `bot-${code}-${i + 1}`;
        room.players[botId] = {
          id: botId,
          socketId: botId,
          nickname: botPreset.name,
          avatar: botPreset.avatar,
          score: 0,
          streak: 0,
          lives: 3,
          status: 'idle',
          isHost: false,
          isReady: true,
          isBot: true
        };
      });
      room.settings.withBots = true;
    }

    this.io.to(code).emit('room:state', room);
  }

  public startGame(socketId: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'lobby') return;

    // Check host authority
    const isHost = room.hostId === socketId || room.players[socketId]?.isHost;
    if (!isHost) return;

    // If starting with only 1 player in the lobby, automatically spawn a bot opponent so match can run!
    if (Object.keys(room.players).length < 2) {
      this.addBot(socketId);
    }

    let engine = this.engines.get(code);
    if (!engine) {
      engine = new GameEngine(this.io, room, () => {});
      this.engines.set(code, engine);
    }

    engine.startGame();
  }

  public updateRaceProgress(
    socketId: string,
    data: { progressPercent: number; wpm: number; accuracy: number }
  ): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const engine = this.engines.get(code);
    if (!engine) return;

    engine.handleRaceProgress(socketId, data.progressPercent, data.wpm, data.accuracy);
  }

  public submitWord(
    socketId: string,
    word: string
  ): { correct: boolean; scoreDelta: number; message?: string } {
    const code = this.socketToRoom.get(socketId);
    if (!code) return { correct: false, scoreDelta: 0, message: 'Not in a room' };

    const engine = this.engines.get(code);
    if (!engine) return { correct: false, scoreDelta: 0, message: 'No active game engine' };

    return engine.handleSubmit(socketId, word);
  }

  public setTypingStatus(socketId: string, isTyping: boolean): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'in-game') return;

    const player = room.players[socketId];
    if (player && player.status !== 'submitted' && player.lives > 0) {
      player.status = isTyping ? 'typing' : 'idle';
      this.io.to(code).emit('room:state', room);
    }
  }

  public sendChat(socketId: string, text: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) return;

    const player = room.players[socketId];
    if (!player) return;

    const cleanText = text.trim().slice(0, 100);
    if (!cleanText) return;

    const chatMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: player.id,
      senderName: player.nickname,
      senderAvatar: player.avatar,
      text: cleanText,
      timestamp: Date.now()
    };

    this.io.to(code).emit('chat:message', chatMsg);
  }

  public getPublicRooms(): PublicRoomSummary[] {
    const summaries: PublicRoomSummary[] = [];

    this.rooms.forEach((room) => {
      if (room.settings.isPublic && room.status === 'lobby') {
        const hostPlayer = room.players[room.hostId];
        summaries.push({
          code: room.code,
          hostName: hostPlayer ? hostPlayer.nickname : 'Host',
          playerCount: Object.keys(room.players).length,
          maxPlayers: room.settings.maxPlayers,
          mode: room.settings.mode,
          difficulty: room.settings.difficulty,
          timerSec: room.settings.timerSec,
          hasPassword: !!room.settings.password
        });
      }
    });

    return summaries;
  }
}
