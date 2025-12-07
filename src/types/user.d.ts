import type { JwtPayload } from 'jsonwebtoken';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

/**
 * Representa la estructura de un usuario tal como se almacena en la base de datos.
 */
export interface User {
	id: number;
	username: string;
	password_hash: string;
	role: UserRole;
}


/**
 * Representa el payload que se incluirá en los tokens JWT.
 */
export type AuthPayload = Pick<User, 'id' | 'username' | 'role'> & JwtPayload;
