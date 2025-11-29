import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';

// import { UserModel } from '../models/user.model';
import type { AuthPayload } from '../types/authPayload.d.ts';

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
		// Se usa .select('+password') porque en el schema lo marcamos con `select: false` por seguridad.
		const user = await UserModel.findOne({ username }).select('+password');

		// 2. Si no se encuentra el usuario o la contraseña no coincide, devolver un error genérico.
		// El método `comparePassword` está definido en `user.model.ts` y usa bcrypt.compare.
		if (!user || !(await user.comparePassword(password))) {
			return res.status(401).json({ error: 'Credenciales inválidas' });
		}

		// 3. Crear el payload para los tokens con la información del usuario de la BD.
		const payload: AuthPayload = {
			id: user._id.toString() || user.id, // Aseguramos que usamos el ID correcto
			username: user.username,
			role: user.role,
			name: user.name,
			senderName: user.senderName,
		};

		const accessToken = generateAccessToken(payload);
		const refreshToken = generateRefreshToken(payload);

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			sameSite: 'none',
			secure: true, // Usar `secure: true` solo en producción (HTTPS)
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
			id: payload.id,
			username: payload.username,
			role: payload.role,
			name: payload.name,
			senderName: payload.senderName,
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
			secure: true,
		});
		res.status(200).json({ message: 'Sesión cerrada exitosamente' });
	} catch (error) {
		console.error('Logout error:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

export const registerUser = async (req: Request, res: Response) => {
	try {
		const { username } = req.body;

		const usernameExists = await UserModel.findOne({ username });

		if (!usernameExists) return res.status(400).json({ message: 'Username already exists' });

		const newUser = new UserModel(req.body);
		await newUser.save();
		res.status(201).json(newUser);
	} catch (error) {
		console.error('Error al registrar el usuario:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};
