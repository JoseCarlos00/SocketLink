import { JwtPayload } from 'jsonwebtoken';

export interface AuthPayload extends JwtPayload {
	id: string;
	username: string;
	role: string;
	name: string;
}
