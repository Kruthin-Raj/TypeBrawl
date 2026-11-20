import { Server, Socket } from 'socket.io';
import {
  RoomState,
  RoomSettings,
  Player,
  PublicRoomSummary,
  ChatMessage,
  ClientToServerEvents,
  ServerToClientEvents,
  AvatarConfig
} from '@typefest/shared';
import { GameEngine } from '../engine/GameEngine.js';

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

    const roomSettings: RoomSettings = {
      ...rawSettings,
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

    if (Object.keys(room.players).length >= room.settings.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    const playerId = socket.id;
    const newPlayer: Player = {
      id: playerId,
      socketId: socket.id,
      nickname: playerData.nickname.trim().slice(0, 16) || 'Guest',
      avatar: playerData.avatar,
      score: 0,
      streak: 0,
      lives: 3,
      status: 'idle',
      isHost: false,
      isReady: false
    };

    room.players[playerId] = newPlayer;
    this.socketToRoom.set(socket.id, cleanCode);
    socket.join(cleanCode);

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

  public handleDisconnect(socketId: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(code);
    if (!room) return;

    const leavingPlayer = room.players[socketId];
    delete room.players[socketId];

    if (Object.keys(room.players).length === 0) {
      // Room empty, clean up
      const engine = this.engines.get(code);
      if (engine) engine.stop();
      this.engines.delete(code);
      this.rooms.delete(code);
      return;
    }

    // If host left, elect new host
    if (room.hostId === socketId) {
      const remainingIds = Object.keys(room.players);
      room.hostId = remainingIds[0];
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

  public startGame(socketId: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.hostId !== socketId || room.status !== 'lobby') return;

    const engine = this.engines.get(code);
    if (engine) {
      engine.startGame();
    }
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
