import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { User as UserModel, Bcrypt } from '../models/user.model.js';
import type { User as UserType, AuthPayload } from '../types/user.d.ts';
import { adminLogger as logger } from '../services/logger.js';

import { REFRESH_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME} from "../constants.js";

const timeExpireAccessToken = 1 * 60 * 1000; // 15 minutos
const timeExpireRefreshToken = 7 * 24 * 60 * 60 * 1000; // 7 días


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

		res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: timeExpireRefreshToken
		});

		// Cookie para el Access Token (accesible por el servidor de Next.js)
		res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: timeExpireAccessToken,
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
	// 1. Corregir el nombre de la cookie que se lee.
	const token = req?.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

	if (!token) {
		return res.status(401).json({ message: 'Falta el token de actualización' });
	}

	try {
		const currentPayload = verifyRefreshToken(token) as AuthPayload;

		// 2. Crear un nuevo payload para los nuevos tokens.
		const newPayload: AuthPayload = {
			id: currentPayload.id,
			username: currentPayload.username,
			role: currentPayload.role,
		};

		// 3. Generar un nuevo accessToken Y un nuevo refreshToken (rotación).
		const accessToken = generateAccessToken(newPayload);
		const newRefreshToken = generateRefreshToken(newPayload);

		// 4. Actualizar ambas cookies, igual que en el login.
		res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: timeExpireRefreshToken
		});

		res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: timeExpireAccessToken,
		});

		logger.info(`Token de acceso refrescado para el usuario: ${currentPayload.username}`);
		res.json({ accessToken, message: 'Token refrescado exitosamente' });
	} catch (error) {
		logger.warn(`Intento de refrescar token fallido: ${error}`);
		res.status(403).json({ message: 'Refresh token inválido, expirado o manipulado.' });
	}
};

export const logout = (_req: Request, res: Response) => {
	try {
		// Limpiar la cookie del refresh token
		res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
			httpOnly: true,
			sameSite: 'lax', // Debe coincidir con la configuración de la cookie al crearla
			secure: false, // Debe coincidir con la configuración de la cookie al crearla
		});

		// Limpiar la cookie del access token
		res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
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

export const getProfile = async (req: Request, res: Response) => {
	// El middleware 'verifyToken' ya ha validado el token y ha adjuntado el payload a req.user.
	// No necesitamos volver a buscar el usuario si el payload del token es suficiente.
	// Sin embargo, para obtener datos 100% actualizados, es mejor hacer una consulta a la BD.

	// Asumimos que el middleware verifyToken añade el payload a req.user
	const userId = (req.currentUser as AuthPayload)?.id;

	if (!userId) {
		// Esto no debería ocurrir si el middleware funciona correctamente.
		return res.status(401).json({ message: 'Usuario no autenticado en la petición.' });
	}

	try {
		const user = UserModel.findById(userId) as UserType | undefined;
		if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

		// Devolvemos solo los datos seguros y necesarios para el frontend.
		res.json({ id: user.id, username: user.username, role: user.role });
	} catch (error) {
		logger.error(`Error al obtener el perfil del usuario ${userId}: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};
