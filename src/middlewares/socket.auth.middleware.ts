import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User as UserModel } from '../models/user.model.js';
import type { AppSocket } from '../types/socketInterface.d.ts';
import type { AuthPayload, User as UserType } from '../types/user.d.ts';

const validClientTypes = ['WEB_CLIENT', 'ANDROID_APP'];
const ANDROID_API_KEY = process.env.ANDROID_API_KEY;


/**
 * Middleware de Socket.IO para autenticar conexiones de clientes web.
 * Verifica el token JWT enviado en el handshake de conexión.
 */
export const socketAuthMiddleware = async (socket: AppSocket, next: (err?: Error) => void) => {
	const clientType = socket.handshake.query.clientType;
	const apiKey = socket.handshake.query.apiKey;

	const type = Array.isArray(clientType) ? clientType[0] : clientType!;

	if (!validClientTypes.includes(type)) {
		return next(new Error('Authentication error: Invalid client type.'));
	}

	// --- Autenticación para clientes Android/dispositivos ---
	if (type === 'ANDROID_APP') {
		// Validar que la API Key sea la correcta.
		// Esto previene que cualquiera que conozca el clientType se conecte.
		if (!apiKey || apiKey !== ANDROID_API_KEY) {
			return next(new Error('Authentication error: Invalid API Key.'));
		}
		// Si la API Key es válida, permitimos la conexión.
		return next();
	}

	// --- Autenticación para clientes Web con JWT ---
	if (type === 'WEB_CLIENT') {
		const token = socket.handshake.auth.token;
		if (!token) {
			return next(new Error('Authentication error: No token provided.'));
		}

		try {
			const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
			const user = UserModel.findById(decoded.id);

			if (!user) {
				return next(new Error('Authentication error: User not found.'));
			}

			socket.currentUser = user as UserType;
			return next();
		} catch (error) {
			return next(new Error('Authentication error: Invalid or expired token.'));
		}
	}
};
