import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './serverEvents.js';
import type { User } from './user.d.ts';

// Se usa Pick para seleccionar solo las propiedades seguras del usuario que se adjuntarán al socket.
type SafeUser = Pick<User, 'id' | 'username' | 'role'>;

export interface AppSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
	// La propiedad currentUser es opcional porque no todos los sockets (ej. los de los dispositivos) estarán autenticados.
	currentUser?: SafeUser;
}

export type AppIO = Server<ClientToServerEvents, ServerToClientEvents>;
