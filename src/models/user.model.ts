import db from './db.js'; // Importar la instancia de la DB
import bcrypt from 'bcryptjs';
import type { User as UserType } from "../types/user.d.ts";

const salt = await bcrypt.genSalt(10)

export class User {
	static create(user: Omit<UserType, 'id'>) {
		const statement = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
		statement.run(user.username, user.password_hash, user.role);
	}

	static delete(id: number): number {
		const statement = db.prepare('DELETE FROM users WHERE id = ?');
		const info = statement.run(id);
		return info.changes;
	}

	static findByUsername(username: string) {
		const statement = db.prepare('SELECT * FROM users WHERE username = ?');
		return statement.get(username) as UserType | undefined;;
	}

	static  findById(id: number) {
		const statement = db.prepare('SELECT * FROM users WHERE id = ?');
		return statement.get(id) as UserType | undefined;
	}

	static getAllUsers() {
		const statement = db.prepare('SELECT * FROM users');
		return statement.all() as UserType[] | undefined;
	}

	static update(id: number, user: Omit<UserType, 'id'>): number {
		const statement = db.prepare('UPDATE users SET username = ?, password_hash = ?, role = ? WHERE id = ?');
		const info = statement.run(user.username, user.password_hash, user.role, id);
		return info.changes;
	}
}

export class Bcrypt {
	static async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, salt);
	}

	static async comparePassword(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}
}
