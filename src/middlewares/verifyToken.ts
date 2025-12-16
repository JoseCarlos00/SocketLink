import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/user.model.js';
import type { User as UserType } from "../types/user.d.ts";
import Logger from '../services/logger.js'
import { ACCESS_TOKEN_COOKIE_NAME } from '../constants.js'

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
	const token = req.cookies[ACCESS_TOKEN_COOKIE_NAME];

	if (!token) return res.status(401).json({ message: 'Token JWT inválido o ausente.' });

	try {
		const payload = verifyAccessToken(token);

		// Aseguramos que el payload del token tiene la estructura que esperamos
		if (typeof payload !== 'object' || !payload.username || !payload.role) {
			return res.status(401).json({ message: 'La estructura del token no es válida.' });
		}

		const getUser = User.findById(payload.id) as UserType | undefined;

		if (!getUser) {
			return res.status(401).json({ message: 'Usuario no encontrado' });
		}

		req.currentUser = {
			id: getUser.id,
			username: getUser.username,
			role: getUser.role,
		};

		next();
	} catch (error: any) {
		Logger.error(`Error al verificar el token: ${error.message}`);
		// El token puede ser inválido o haber expirado. El cliente debería usar el refresh token en este punto.
		return res.status(403).json({ message: 'Token de acceso inválido o expirado.' });
	}
};
