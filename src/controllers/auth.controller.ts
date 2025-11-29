import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { User as UserModel } from '../models/user.model.js';
import type { User as UserType, AuthPayload } from '../types/user.d.ts';

export const login = async (req: Request, res: Response) => {
	if (!req.body) {
		return res.status(400).json({ error: 'Request body is missing' });
	}

	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ error: 'Username and password are required' });
	}

	try {
		// 1. Buscar al usuario por su nombre de usuario.
		const user = UserModel.findByUsername(username) as UserType | undefined;

		// 2. Si el usuario no existe o la contraseña es incorrecta, devolver un error.
		if (!user || !(await UserModel.comparePassword(password, user.password_hash))) {
			return res.status(401).json({ error: 'Credenciales inválidas' });
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

	if (!token) return res.status(401).json({ error: 'Refresh token missing' });

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
	} catch (err) {
		// Si el refresh token es inválido o expiró, el usuario debe volver a loguearse.
		res.status(403).json({ error: 'Refresh token inválido o expirado' });
	}
};

export const logout = (_req: Request, res: Response) => {
	try {
		res.clearCookie('refreshToken', {
			httpOnly: true,
			sameSite: 'none',
			secure: false,
		});
		res.status(200).json({ message: 'Sesión cerrada exitosamente' });
	} catch (error) {
		console.error('Logout error:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

export const registerUser = async (req: Request, res: Response) => {
	try {
		const { username, password, role } = req.body;

		// 1. Validar que los campos requeridos estén presentes.
		if (!username || !password || !role) {
			return res.status(400).json({ message: 'Username, password y role son requeridos.' });
		}

		if(role !== 'ADMIN' && role !== 'USER') {
			return res.status(400).json({ message: 'El rol debe ser ADMIN o USER.' });
		}

		// 2. Verificar si el nombre de usuario ya existe.
		const usernameExists = await UserModel.findByUsername(username);

		if (usernameExists) {
			return res.status(409).json({ message: 'El nombre de usuario ya existe.' }); // 409 Conflict es más apropiado aquí.
		}

		// 3. Guardar el nuevo usuario.
		await UserModel.create({ username, password, role });

		res.status(201).json({ message: 'Nuevo Usuario registrado con éxito.' });
	} catch (error) {
		console.error('Error al registrar el usuario:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};
