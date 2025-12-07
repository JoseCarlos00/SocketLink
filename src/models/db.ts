import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import Logger from '../services/logger.js'
const { DB_FILE_NAME } = config;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determina cuántos niveles subir basado en el entorno.
const relativePath = config.NODE_ENV === 'production' ? '../../..' : '../..';

// Construye la ruta absoluta al archivo de la base de datos.
const absoluteDbPath = path.resolve(__dirname, relativePath, DB_FILE_NAME);
// --- FIN: Lógica para resolver la ruta absoluta de la DB ---

// 1. Crear la instancia de la base de datos
// 'options' es opcional, pero útil para depuración.
const db = new Database(absoluteDbPath, {
	// verbose: console.log,
});

/**
 * Función para inicializar las tablas (ejecutada una sola vez al inicio del servidor)
 */
export function initializeDatabase() {
	Logger.info(`[DB] Conectado a la base de datos en: [${absoluteDbPath}]`);

	// Crear la tabla de usuarios si no existe
	const createUserTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('ADMIN', 'USER', 'SUPER_ADMIN'))
        )
    `);
	createUserTable.run();
}

// 2. Exportar la instancia de la base de datos para que otros módulos la usen
export default db;
