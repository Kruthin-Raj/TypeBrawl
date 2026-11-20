import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@typefest/shared';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    socket = io(url, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};
