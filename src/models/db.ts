import Database from 'better-sqlite3';
import { config } from '../config.js';
const { DB_FILE_NAME } = config;


// 1. Crear la instancia de la base de datos
// 'options' es opcional, pero útil para depuración.
const db = new Database(DB_FILE_NAME, {
	// verbose: console.log,
});

/**
 * Función para inicializar las tablas (ejecutada una sola vez al inicio del servidor)
 */
export function initializeDatabase() {
	console.log(`[DB] Conectado a la base de datos: ${DB_FILE_NAME}`);

	// Crear la tabla de usuarios si no existe
	const createUserTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('ADMIN', 'USER'))
        )
    `);
	createUserTable.run();
}

// 2. Exportar la instancia de la base de datos para que otros módulos la usen
export default db;
