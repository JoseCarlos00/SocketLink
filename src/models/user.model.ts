import db from './db.js'; // Importar la instancia de la DB
import bcrypt from 'bcryptjs';
import type { User as UserType } from "../types/user.d.ts";

const salt = await bcrypt.genSalt(10)

export class User {
	static findByUsername(username: string) {
		// Usamos .get() porque esperamos una sola fila
		const statement = db.prepare('SELECT * FROM users WHERE username = ?');
		return statement.get(username);
	}

	static async comparePassword(password: string, hash: string): Promise<boolean> {
		// Lógica de comparación con bcrypt (que es asíncrona)
		return bcrypt.compare(password, hash);
	}

	static async getAllUsers() {
		const statement = db.prepare('SELECT * FROM users');
		return statement.all();
	}

	static async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, salt);
	}

	/**
	 * Crea un nuevo usuario en la base de datos.
	 * Se encarga de hashear la contraseña antes de guardarla.
	 * @param user - Objeto con los datos del usuario a crear. La contraseña debe estar en texto plano.
	 */
	static async create(user: Omit<UserType, 'id' | 'password_hash'> & { password: string }) {
		const hashedPassword = await User.hashPassword(user.password);

		const statement = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
		statement.run(user.username, hashedPassword, user.role);
	}
}
