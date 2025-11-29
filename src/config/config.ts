import dotenv from 'dotenv';

dotenv.config();

function getEnvVar(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

export const config = {
	JWT_SECRET: getEnvVar('JWT_SECRET'),
	JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
	ACCESS_TOKEN_EXPIRE: getEnvVar('ACCESS_TOKEN_EXPIRE'),
	REFRESH_TOKEN_EXPIRE: getEnvVar('REFRESH_TOKEN_EXPIRE'),
	PORT: getEnvVar('PORT'),
};
