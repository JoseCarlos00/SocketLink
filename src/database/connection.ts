import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import Logger from '../services/logger.js';

const { DB_FILE_NAME } = config;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determina cuántos niveles subir basado en el entorno
const relativePath = config.NODE_ENV === 'production' ? '../../..' : '../..';

// Construye la ruta absoluta al archivo de la base de datos
const absoluteDbPath = path.resolve(__dirname, relativePath, DB_FILE_NAME);

// Crear la instancia de la base de datos
const db = new Database(absoluteDbPath, {
	// verbose: console.log, // Descomentar para debug
});

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Configurar para mejor performance
db.pragma('journal_mode = WAL'); // Write-Ahead Logging
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');

/**
 * Función para inicializar las tablas
 */
export function initializeDatabase() {
	Logger.info(`[DB] Conectado a la base de datos en: [${absoluteDbPath}]`);

	try {
		// ============ TABLA DE USUARIOS (EXISTENTE) ============
		db.prepare(
			`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('ADMIN', 'USER', 'SUPER_ADMIN', 'OPERATOR')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
		).run();

		// ============ TABLAS DE MÉTRICAS ============

		// Tabla de eventos de alarma
		db.prepare(
			`
      CREATE TABLE IF NOT EXISTS alarm_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
		).run();

		// Tabla de alertas de batería
		db.prepare(
			`
      CREATE TABLE IF NOT EXISTS battery_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        battery_level INTEGER NOT NULL,
        charging INTEGER NOT NULL DEFAULT 0,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
		).run();

		// Tabla de eventos offline
		db.prepare(
			`
      CREATE TABLE IF NOT EXISTS offline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration_minutes INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
		).run();

		// Tabla de heartbeats (muestreo)
		db.prepare(
			`
      CREATE TABLE IF NOT EXISTS heartbeats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        battery_level INTEGER NOT NULL,
        charging INTEGER NOT NULL DEFAULT 0,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
		).run();

		// ============ ÍNDICES PARA PERFORMANCE ============

		// Índices para alarm_events
		db.prepare(
			`
      CREATE INDEX IF NOT EXISTS idx_alarm_device_time 
      ON alarm_events(device_id, timestamp)
    `
		).run();

		db.prepare(
			`
      CREATE INDEX IF NOT EXISTS idx_alarm_timestamp 
      ON alarm_events(timestamp)
    `
		).run();

		// Índices para battery_alerts
		db.prepare(
			`
      CREATE INDEX IF NOT EXISTS idx_battery_device_time 
      ON battery_alerts(device_id, timestamp)
    `
		).run();

		db.prepare(
			`
      CREATE INDEX IF NOT EXISTS idx_battery_timestamp 
      ON battery_alerts(timestamp)
    `
		).run();

		// Índices para offline_events
		db.prepare(
			`
      CREATE INDEX IF NOT EXISTS idx_offline_device 
      ON offline_events(device_id, start_time)
    `
		).run();

		db.prepare(
			`
      CREATE INDEX IF NOT EXISTS idx_offline_open 
      ON offline_events(device_id, end_time) 
      WHERE end_time IS NULL
    `
		).run();

		// Índices para heartbeats
		db.prepare(
			`
      CREATE INDEX IF NOT EXISTS idx_heartbeat_device_time 
      ON heartbeats(device_id, timestamp)
    `
		).run();

		Logger.info('[DB] Tablas e índices creados correctamente');

		// Mostrar estadísticas de la base de datos
		showDatabaseStats();
	} catch (error) {
		Logger.error(`[DB] Error inicializando base de datos: ${error}`);
		throw error;
	}
}

/**
 * Muestra estadísticas de la base de datos
 */
function showDatabaseStats() {
	try {
		const tables = ['users', 'alarm_events', 'battery_alerts', 'offline_events', 'heartbeats'];

		Logger.info('[DB] Estadísticas de tablas:');

		for (const table of tables) {
			const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any;
			Logger.info(`  - ${table}: ${result.count} registros`);
		}
	} catch (error) {
		Logger.error(`[DB] Error obteniendo estadísticas: ${error}`);
	}
}

/**
 * Limpia datos antiguos de métricas
 * Útil para ejecutar como cron job
 */
export function cleanupOldMetrics(daysToKeep: number = 90) {
	const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

	try {
		const transaction = db.transaction(() => {
			const alarms = db.prepare('DELETE FROM alarm_events WHERE timestamp < ?').run(cutoffTime);
			const battery = db.prepare('DELETE FROM battery_alerts WHERE timestamp < ?').run(cutoffTime);
			const heartbeats = db.prepare('DELETE FROM heartbeats WHERE timestamp < ?').run(cutoffTime);
			const offline = db
				.prepare('DELETE FROM offline_events WHERE start_time < ? AND end_time IS NOT NULL')
				.run(cutoffTime);

			Logger.info(`[DB] Limpieza de datos antiguos (>${daysToKeep} días):`);
			Logger.info(`  - Alarmas eliminadas: ${alarms.changes}`);
			Logger.info(`  - Alertas batería eliminadas: ${battery.changes}`);
			Logger.info(`  - Heartbeats eliminados: ${heartbeats.changes}`);
			Logger.info(`  - Eventos offline cerrados eliminados: ${offline.changes}`);
		});

		transaction();

		// Optimizar base de datos después de eliminar datos
		db.prepare('VACUUM').run();
		Logger.info('[DB] Base de datos optimizada (VACUUM)');
	} catch (error) {
		Logger.error(`[DB] Error en limpieza: ${error}`);
		throw error;
	}
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase() {
	try {
		db.close();
		Logger.info('[DB] Conexión cerrada correctamente');
	} catch (error) {
		Logger.error(`[DB] Error cerrando conexión: ${error}`);
	}
}

// Exportar la instancia de la base de datos
export default db;
