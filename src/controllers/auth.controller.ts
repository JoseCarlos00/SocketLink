import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { User as UserModel, Bcrypt } from '../models/user.model.js';
import type { User as UserType, AuthPayload } from '../types/user.d.ts';

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
		const user = UserModel.findByUsername(username) as UserType | undefined;

		// 2. Si el usuario no existe o la contraseña es incorrecta, devolver un error.
		if (!user || !(await Bcrypt.comparePassword(password, user.password_hash))) {
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

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
		});

		// Es mejor no devolver el payload en la respuesta. El cliente puede decodificar el accessToken si lo necesita.
		res.json({ accessToken, message: 'Inicio de sesión exitoso' });
	} catch (error) {
		console.error('Login error:', error);
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
		res.json({ accessToken, message: 'Token refrescado exitosamente' });
	} catch (error) {
		res.status(403).json({ message: 'Refresh token inválido o expirado' });
	}
};

export const logout = (_req: Request, res: Response) => {
	try {
		res.clearCookie('refreshToken', {
			httpOnly: true,
			sameSite: 'lax', // Debe coincidir con la configuración de la cookie al crearla
			secure: false, // Debe coincidir con la configuración de la cookie al crearla
		});

		res.status(200).json({ message: 'Sesión cerrada exitosamente' });
	} catch (error) {
		console.error('Logout error:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

