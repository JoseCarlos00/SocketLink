import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

function getEnvVar(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

const allowedOrigins = [
	'http://localhost:5173',
	'http://192.168.15.189:5173',
	'http://192.168.1.5:5173',
];

export const config = {
	JWT_SECRET: getEnvVar('JWT_SECRET'),
	JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
	ACCESS_TOKEN_EXPIRE: getEnvVar('ACCESS_TOKEN_EXPIRE'),
	REFRESH_TOKEN_EXPIRE: getEnvVar('REFRESH_TOKEN_EXPIRE'),
	PORT: getEnvVar('PORT') || 3000,
	CORS_ORIGIN: allowedOrigins,
	API_SECRET_TOKEN: getEnvVar('API_SECRET_TOKEN'),
	NODE_ENV: process.env.NODE_ENV || 'development',


	// Nombre del archivo de la base de datos SQLite
	DB_FILE_NAME: getEnvVar('DB_FILE_NAME'),
};


interface ServiceAccount {
	type: string;
	project_id: string;
	private_key_id: string;
	private_key: string;
	client_email: string;
	client_id: string;
	auth_uri: string;
	token_uri: string;
	auth_provider_x509_cert_url: string;
	client_x509_cert_url: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determina cuántos niveles subir basado en el entorno.
const relativePath = config.NODE_ENV === 'production' ? '../../' : '../';

const serviceAccountPath = path.resolve(__dirname, relativePath, 'data', 'service-account.json');

export const SERVICE_ACCOUNT: ServiceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
