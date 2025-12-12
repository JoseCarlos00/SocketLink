import { cleanupOldMetrics } from '../database/connection.js';
import Logger from '../services/logger.js';

/**
 * Job de mantenimiento que se ejecuta diariamente
 * - Limpia datos antiguos (>90 días)
 * - Optimiza la base de datos
 */
export function startMaintenanceJob() {
	// Ejecutar limpieza cada 24 horas (a las 3 AM)
	const scheduleTime = getNextMaintenanceTime();
	const timeUntilNext = scheduleTime - Date.now();

	Logger.info(`[Maintenance] Próxima limpieza programada en ${Math.floor(timeUntilNext / 3600000)} horas`);

	setTimeout(() => {
		runMaintenance();

		// Programar siguiente ejecución (cada 24 horas)
		setInterval(() => {
			runMaintenance();
		}, 24 * 60 * 60 * 1000);
	}, timeUntilNext);
}

/**
 * Ejecuta las tareas de mantenimiento
 */
function runMaintenance() {
	Logger.info('[Maintenance] Iniciando mantenimiento programado...');

	try {
		// Limpiar datos antiguos (mantener últimos 90 días)
		cleanupOldMetrics(90);

		Logger.info('[Maintenance] Mantenimiento completado exitosamente');
	} catch (error) {
		Logger.error(`[Maintenance] Error durante mantenimiento: ${error}`);
	}
}

/**
 * Calcula la próxima hora de mantenimiento (3 AM)
 */
function getNextMaintenanceTime(): number {
	const now = new Date();
	const next = new Date();

	// Establecer a las 3:00 AM
	next.setHours(3, 0, 0, 0);

	// Si ya pasaron las 3 AM hoy, programar para mañana
	if (next <= now) {
		next.setDate(next.getDate() + 1);
	}

	return next.getTime();
}

/**
 * Ejecuta mantenimiento inmediato (útil para testing o manual)
 */
export function runMaintenanceNow(daysToKeep: number = 90) {
	Logger.info('[Maintenance] Ejecutando mantenimiento manual...');

	try {
		cleanupOldMetrics(daysToKeep);
		Logger.info('[Maintenance] Mantenimiento manual completado');
		return { success: true };
	} catch (error) {
		Logger.error(`[Maintenance] Error en mantenimiento manual: ${error}`);
		return { success: false, error: String(error) };
	}
}


// src/server.ts - AGREGAR ESTO AL INICIO
// import { startMaintenanceJob } from './jobs/maintenanceJob.js';

// ... tu código existente ...

// Después de inicializar la DB
// initializeDatabase();

// Iniciar job de mantenimiento
// startMaintenanceJob();
