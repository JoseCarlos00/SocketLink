import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { AuthPayload } from '../types/user.js';

export const generateAccessToken = (payload: AuthPayload): string => {
	return jwt.sign(payload, config.JWT_SECRET, {
		expiresIn: config.ACCESS_TOKEN_EXPIRE,
	});
};

export const generateRefreshToken = (payload: AuthPayload): string => {
	return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
		expiresIn: config.REFRESH_TOKEN_EXPIRE,
	});
};

export const verifyAccessToken = (token: string): AuthPayload => {
	return jwt.verify(token, config.JWT_SECRET) as AuthPayload;
};

export const verifyRefreshToken = (token: string): AuthPayload => {
	return jwt.verify(token, config.JWT_REFRESH_SECRET) as AuthPayload;
};
