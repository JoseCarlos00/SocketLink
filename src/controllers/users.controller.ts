import { Request, Response } from 'express';
import { User as UserModel } from '../models/user.model.js';

export const registerUser = async (req: Request, res: Response) => {
	try {
		const { username, password, role } = req.body;

		// 1. Validar que los campos requeridos estén presentes.
		if (!username || !password || !role) {
			return res.status(400).json({ message: 'Username, password y role son requeridos.' });
		}

		if (role !== 'ADMIN' && role !== 'USER') {
			return res.status(400).json({ message: 'El rol debe ser ADMIN o USER.' });
		}

		// 2. Verificar si el nombre de usuario ya existe.
		const usernameExists = await UserModel.findByUsername(username);

		if (usernameExists) {
			return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
		}

		// 3. Cifrar la contraseña ANTES de crear el usuario
		const hashedPassword = await UserModel.hashPassword(password);

		// 4. Guardar el nuevo usuario con el hash
		await UserModel.create({
			username,
			password_hash: hashedPassword,
			role,
		});

		res.status(201).json({ message: 'Nuevo usuario registrado con éxito.' });
	} catch (error) {
		console.error('Error al registrar el usuario:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};
