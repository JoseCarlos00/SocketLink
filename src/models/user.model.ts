import db from './db.js'; // Importar la instancia de la DB
import bcrypt from 'bcryptjs';


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

	// ... otros métodos (createUser, findById, etc.)
}
