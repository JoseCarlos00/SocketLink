import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { User as UserModel, Bcrypt } from '../models/user.model.js';
import type { User as UserType, AuthPayload } from '../types/user.d.ts';
import { adminLogger as logger } from '../services/logger.js';

export const login = async (req: Request, res: Response) => {
	if (!req.body) {
		return res.status(400).json({ message: 'Falta el body de la request.' });
	}

	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ message: 'El username y password son requeridos' });
	}

	try {
		// 1. Buscar al usuario por su nombre de usuario.
		logger.info(`Intento de inicio de sesión para el usuario: ${username}`);
		const user = UserModel.findByUsername(username) as UserType | undefined;

		// 2. Si el usuario no existe o la contraseña es incorrecta, devolver un error.
		if (!user || !(await Bcrypt.comparePassword(password, user.password_hash))) {
			logger.warn(`Credenciales inválidas para el usuario: ${username}`);
			return res.status(401).json({ message: 'Credenciales inválidas' });
		}

		// 3. Crear el payload para los tokens con la información del usuario de la BD.
		const payload: AuthPayload = {
			id: user.id,
			username: user.username,
			role: user.role,
		};

		const accessToken = generateAccessToken(payload);
		const refreshToken = generateRefreshToken(payload);

		res.cookie('jwt-refresh-token', refreshToken, {
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
		});

		// Cookie para el Access Token (accesible por el servidor de Next.js)
		res.cookie('jwt-access-token', accessToken, {
			httpOnly: false, // Para que el servidor Next.js pueda leerla
			sameSite: 'lax',
			secure: false,
			maxAge: 15 * 60 * 1000, // 15 minutos (debe coincidir con la expiración del token)
		});

		// Es mejor no devolver el payload en la respuesta. El cliente puede decodificar el accessToken si lo necesita.
		logger.info(`Inicio de sesión exitoso para el usuario: ${username}`);
		res.json({ accessToken, message: 'Inicio de sesión exitoso' });
	} catch (error) {
		logger.error(`Error en el proceso de login para ${username}: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

export const refreshToken = (req: Request, res: Response) => {
	const token = req?.cookies?.refreshToken;

	if (!token) {
		return res.status(401).json({ message: 'Falta el token de actualización' });
	}

	try {
		const payload = verifyRefreshToken(token);

		// Re-crear el payload para el nuevo access token
		const newPayload: AuthPayload = {
			id: Number(payload.id),
			username: payload.username,
			role: payload.role,
		};

		const accessToken = generateAccessToken(newPayload);
		logger.info(`Token de acceso refrescado para el usuario: ${payload.username}`);
		res.json({ accessToken, message: 'Token refrescado exitosamente' });
	} catch (error) {
		logger.warn(`Intento de refrescar token fallido: ${error}`);
		res.status(403).json({ message: 'Refresh token inválido, expirado o manipulado.' });
	}
};

export const logout = (_req: Request, res: Response) => {
	try {
		// Limpiar la cookie del refresh token
		res.clearCookie('jwt-refresh-token', {
			httpOnly: true,
			sameSite: 'lax', // Debe coincidir con la configuración de la cookie al crearla
			secure: false, // Debe coincidir con la configuración de la cookie al crearla
		});

		// Limpiar la cookie del access token
		res.clearCookie('jwt-access-token', {
			httpOnly: false,
			sameSite: 'lax',
			secure: false,
		});

		logger.info('Sesión cerrada exitosamente. Cookies eliminadas.');
		res.status(200).json({ message: 'Sesión cerrada exitosamente' });
	} catch (error) {
		logger.error(`Error durante el cierre de sesión: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};
