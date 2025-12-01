import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User as UserModel } from '../models/user.model.js';
import type { AppSocket } from '../types/socketInterface.d.ts';
import type { AuthPayload } from '../types/user.d.ts';
import type { User as UserType } from '../types/user.d.ts';

/**
 * Middleware de Socket.IO para autenticar conexiones de clientes web.
 * Verifica el token JWT enviado en el handshake de conexión.
 */
export const socketAuthMiddleware = async (socket: AppSocket, next: (err?: Error) => void) => {
	// Solo aplicamos este middleware a los clientes que intentan conectarse como 'WEB_CLIENT'
	if (socket.handshake.query.clientType !== 'WEB_CLIENT') {
		return next(); // Si no es un cliente web, lo dejamos pasar (ej. un dispositivo ESP32)
	}

	const token = socket.handshake.auth.token;

	if (!token) {
		return next(new Error('Authentication error: Token no proporcionado.'));
	}

	try {
		const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
		const user = UserModel.findById(decoded.id) as UserType;

		if (!user) {
			return next(new Error('Authentication error: Usuario no encontrado.'));
		}

		// Adjuntamos el usuario al objeto socket para usarlo en los manejadores de eventos.
		socket.currentUser = user;
		next();
	} catch (error) {
		return next(new Error('Authentication error: Token inválido o expirado.'));
	}
};
