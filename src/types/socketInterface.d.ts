import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './serverEvents.js';

export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export type AppIO = Server<ClientToServerEvents, ServerToClientEvents>;
