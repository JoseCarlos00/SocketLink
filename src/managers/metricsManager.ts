// src/managers/MetricsManager.ts
import db from '../database/connection.js';
import Logger from '../services/logger.js';

export class MetricsManager {
	private offlineCheckInterval: NodeJS.Timeout | null = null;

	constructor() {
		this.initializeTables();
	}

	private initializeTables() {
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

	
		// Índices para mejorar performance
		db.prepare('CREATE INDEX IF NOT EXISTS idx_alarm_device_time ON alarm_events(device_id, timestamp)').run();

		Logger.info('[MetricsManager] Tablas de métricas inicializadas');
	}

	// ============ REGISTRO DE EVENTOS ============

	recordAlarm(deviceId: string) {
		const timestamp = Date.now();

		try {
			db.prepare(
				`
        INSERT INTO alarm_events (device_id, timestamp)
        VALUES (?, ?)
      `
			).run(deviceId, timestamp);

			Logger.info(`[MetricsManager] Alarma registrada para ${deviceId}`);
		} catch (error) {
			Logger.error(`[MetricsManager] Error registrando alarma: ${error}`);
		}
	}

	// ============ REPORTES ============

	getDeviceLossReport(days: number = 30) {
		const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

		try {
			const devices = db
				.prepare(
					`
        SELECT 
          device_id,
          COUNT(*) as total_alarms,
          MIN(timestamp) as first_alarm_time,
          MAX(timestamp) as last_alarm_time,
          ROUND(CAST(COUNT(*) AS FLOAT) / ?, 2) as average_per_day
        FROM alarm_events
        WHERE timestamp > ?
        GROUP BY device_id
        ORDER BY total_alarms DESC
      `
				)
				.all(days, cutoffTime) as any[];

			const totalAlarms = devices.reduce((sum, d) => sum + d.total_alarms, 0);

			return {
				period: `${days} días`,
				totalAlarms,
				devicesAffected: devices.length,
				averageAlarmsPerDay: totalAlarms / days,
				topDevices: devices.slice(0, 10),
				allDevices: devices,
			};
		} catch (error) {
			Logger.error(`[MetricsManager] Error en getDeviceLossReport: ${error}`);
			return null;
		}
	}


	// ============ LIMPIEZA Y MANTENIMIENTO ============

	cleanOldData(daysToKeep: number = 90) {
		const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

		try {
			const transaction = db.transaction(() => {
				const alarmsDeleted = db.prepare('DELETE FROM alarm_events WHERE timestamp < ?').run(cutoffTime);

				Logger.info(`[MetricsManager] Limpieza completada:
          - Alarmas: ${alarmsDeleted.changes}
        `);
			});

			transaction();
		} catch (error) {
			Logger.error(`[MetricsManager] Error en cleanOldData: ${error}`);
		}
	}

	cleanup() {
		if (this.offlineCheckInterval) {
			clearInterval(this.offlineCheckInterval);
		}
		Logger.info('[MetricsManager] Limpieza completada');
	}
}

// Singleton
export const metricsManager = new MetricsManager();
