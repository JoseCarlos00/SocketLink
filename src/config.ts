import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

function getEnvVar(key: string): string {
	const value = process.env[key];
	if (!value) {
		console.error(`\x1b[31m[Config Error] Missing required environment variable: ${key}\x1b[0m`);
		process.exit(1);
	}
	return value;
}

function getOptionalEnvVar(key: string, defaultValue: string): string {
	return process.env[key] || defaultValue;
}

const allowedOrigins = [
	'http://localhost:5173',
	'http://192.168.15.189:5173',
	'http://192.168.1.8:5173',
];

export const config = {
	JWT_SECRET: getEnvVar('JWT_SECRET'),
	JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
	ACCESS_TOKEN_EXPIRE: getEnvVar('ACCESS_TOKEN_EXPIRE'),
	REFRESH_TOKEN_EXPIRE: getEnvVar('REFRESH_TOKEN_EXPIRE'),
	PORT: parseInt(getOptionalEnvVar('PORT', '3000'), 10),
	CORS_ORIGIN: allowedOrigins,
	API_SECRET_TOKEN: getEnvVar('API_SECRET_TOKEN'),
	NODE_ENV: getOptionalEnvVar('NODE_ENV', 'development'),


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
export const __dirname = path.dirname(__filename);

// Determina cuántos niveles subir basado en el entorno.
const relativePath = config.NODE_ENV === 'production' ? '../../' : '../';

const serviceAccountPath = path.resolve(__dirname, relativePath, 'data', 'service-account.json');

let serviceAccountData: ServiceAccount;
try {
	serviceAccountData = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
	console.error(`\x1b[31m[Config Error] Failed to load service account from ${serviceAccountPath}: ${error instanceof Error ? error.message : error}\x1b[0m`);
	process.exit(1);
}

export const SERVICE_ACCOUNT = serviceAccountData;
