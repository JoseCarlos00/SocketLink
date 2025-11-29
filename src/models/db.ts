import Database from 'better-sqlite3';
import { config } from '../config.js';
const { DB_FILE_NAME } = config;


// 1. Crear la instancia de la base de datos
// 'options' es opcional, pero útil para depuración.
const db = new Database(DB_FILE_NAME, {
	verbose: console.log,
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

	// Opcional: Inserta un usuario administrador si la tabla está vacía
	const userCount = db.prepare('SELECT COUNT(*) FROM users').get();
	if (userCount['COUNT(*)'] === 0) {
		console.log('[DB] Inicializando usuario administrador por defecto.');
		// **IMPORTANTE:** En producción, esto debe hacerse con un hash real de bcrypt
		db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
			'admin',
			'TEMP_HASH_REMPLAZAR',
			'ADMIN'
		);
	}
}

// 2. Exportar la instancia de la base de datos para que otros módulos la usen
export default db;
