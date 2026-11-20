import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ClientToServerEvents,
  ServerToClientEvents
} from '@typefest/shared';
import { RoomManager } from './rooms/RoomManager.js';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '100kb' }));

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e5 // 100 KB payload cap to prevent buffer exhaustion DDoS
});

// IP connection limiter (prevents single-machine socket flooding DDoS)
const ipConnectionCount = new Map<string, number>();
const MAX_CONNECTIONS_PER_IP = 12;

io.use((socket, next) => {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : socket.handshake.address;

  const current = ipConnectionCount.get(ip) || 0;
  if (current >= MAX_CONNECTIONS_PER_IP) {
    return next(new Error('Connection limit exceeded for this IP. Please slow down.'));
  }

  ipConnectionCount.set(ip, current + 1);
  socket.on('disconnect', () => {
    const count = ipConnectionCount.get(ip) || 1;
    if (count <= 1) {
      ipConnectionCount.delete(ip);
    } else {
      ipConnectionCount.set(ip, count - 1);
    }
  });

  next();
});

const roomManager = new RoomManager(io);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// REST endpoint for listing public rooms
app.get('/api/rooms', (_req, res) => {
  res.json(roomManager.getPublicRooms());
});

io.on('connection', (socket) => {
  // Create Room
  socket.on('room:create', (payload, callback) => {
    try {
      const res = roomManager.createRoom(socket, payload.settings, payload.player);
      callback(res);
    } catch (err: any) {
      callback({ success: false, error: err.message || 'Failed to create room' });
    }
  });

  // Join Room
  socket.on('room:join', (payload, callback) => {
    try {
      const res = roomManager.joinRoom(socket, payload.roomCode, payload.password, payload.player);
      callback(res);
    } catch (err: any) {
      callback({ success: false, error: err.message || 'Failed to join room' });
    }
  });

  // List Public Rooms
  socket.on('room:list', (callback) => {
    callback(roomManager.getPublicRooms());
  });

  // Ready Toggle
  socket.on('room:ready', () => {
    roomManager.toggleReady(socket.id);
  });

  // Explicit Leave Room
  socket.on('room:leave', () => {
    roomManager.leaveRoom(socket);
  });

  // Add AI Bot to Lobby
  socket.on('room:add_bot', () => {
    roomManager.addBot(socket.id);
  });

  // Remove AI Bot from Lobby
  socket.on('room:remove_bot', () => {
    roomManager.removeBot(socket.id);
  });

  // Toggle AI Bots in Lobby
  socket.on('room:toggle_bots', () => {
    roomManager.toggleBots(socket.id);
  });

  // Start Game / Rematch
  socket.on('room:start', () => {
    roomManager.startGame(socket.id);
  });

  // Return to Lobby
  socket.on('room:return_to_lobby', () => {
    roomManager.returnToLobby(socket.id);
  });

  // Typing status change
  socket.on('game:typing_status', (isTyping) => {
    roomManager.setTypingStatus(socket.id, isTyping);
  });

  // Real-time race progress (KeyDash Speedway)
  socket.on('game:race_progress', (data) => {
    roomManager.updateRaceProgress(socket.id, data);
  });

  // Word submission (Player hit Enter)
  socket.on('game:submit_word', (word, callback) => {
    const res = roomManager.submitWord(socket.id, word);
    callback(res);
  });

  // Chat message (rate-limited and capped to 150 characters to prevent spam/buffer abuse)
  let lastChatTime = 0;
  socket.on('chat:send', (text) => {
    const now = Date.now();
    if (now - lastChatTime < 350) return; // Drop messages sent faster than 350ms
    lastChatTime = now;
    const cleanText = typeof text === 'string' ? text.trim().slice(0, 150) : '';
    if (cleanText) {
      roomManager.sendChat(socket.id, cleanText);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`[TypeFest Server] 🚀 Real-time game engine running at http://localhost:${PORT}`);
});
