import { Request, Response } from 'express';
import { User as UserModel, Bcrypt } from '../models/user.model.js';
import type { User as UserType } from '../types/user.d.ts';

type UpdateUser = Pick<UserType, 'username' | 'role'>;

const usernameExists = (username: string) => {
	const user = UserModel.findByUsername(username);
	return !!user;
};

export const getAllUsers = async (req: Request, res: Response) => {
	try {
		const users = UserModel.getAllUsers();

		if (users && (users.length > 0)) {
			res.json(users);
		} else {
			res.status(404).json({ message: 'No se encontraron usuarios.' });
		}
	} catch (error) {
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

		if (role !== 'ADMIN' && role !== 'USER') {
			return res.status(400).json({ message: 'El rol debe ser ADMIN o USER.' });
		}

		if (usernameExists(username)) {
			return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
		}

		const hashedPassword = await Bcrypt.hashPassword(password);

		UserModel.create({
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

export const deleteUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const userId = Number(id);

		if (isNaN(userId)) {
			return res.status(400).json({ message: 'El ID debe ser un número.' });
		}

		const rowsAffected = UserModel.deleteById(userId);

		if (rowsAffected === 0) {
			return res.status(404).json({ message: 'Usuario no encontrado' });
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error al eliminar el usuario:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

export const updateUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const userId = Number(id);

		if (isNaN(userId)) {
			return res.status(400).json({ message: 'El ID debe ser un número.' });
		}

		const userToUpdate = UserModel.findById(userId);

		if (!userToUpdate) {
			return res.status(404).json({ message: 'Usuario no encontrado' });
		}

		const { username, role } = req.body as UpdateUser;

			if (!username && !role) {
				return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
			}

		if (req.body.password) {
			return res.status(400).json({
				message: 'Para cambiar la contraseña, utiliza el endpoint dedicado.',
			});
		}

		if (username) {
			const userWithSameName = UserModel.findByUsername(username);

			if (userWithSameName && userWithSameName.id !== userId) {
				return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
			}
		}

		if (role && role !== 'ADMIN' && role !== 'USER') {
			return res.status(400).json({ message: 'El rol debe ser ADMIN o USER.' });
		}

		// Construir el objeto con los datos a actualizar
		const updateData: UpdateUser = {
			username: username ?? userToUpdate.username,
			role: role ?? userToUpdate.role,
		};

		UserModel.update(userId, updateData);

		res.status(200).json({ message: 'Usuario actualizado con éxito.'});
	} catch (error) {
		console.error('Error al actualizar el usuario:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};

export const updatePassword = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const userId = Number(id);
		const { oldPassword, newPassword } = req.body;

		// Lógica para actualizar la contraseña...
		// 1. Validar que el ID es un número.
		// 2. Validar que oldPassword y newPassword existen.
		// 3. Buscar el usuario por ID.
		// 4. Verificar que la `oldPassword` coincide con la contraseña hasheada en la BD (usando Bcrypt.comparePassword).
		// 5. Hashear la `newPassword`.
		// 6. Actualizar la contraseña en la base de datos.
		// 7. Enviar una respuesta exitosa (ej. 204 No Content).

		res.status(501).json({ message: 'Funcionalidad no implementada todavía.' });
	} catch (error) {
		console.error('Error al actualizar la contraseña:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	}
};
