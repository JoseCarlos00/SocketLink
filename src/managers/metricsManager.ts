// src/managers/MetricsManager.ts
import db from '../database/connection.js';
import Logger from '../services/logger.js';

interface DeviceState {
	deviceId: string;
	lastSeen: number;
	battery: number;
	charging: boolean;
	online: boolean;
}

export class MetricsManager {
	private deviceStates: Map<string, DeviceState> = new Map();
	private offlineCheckInterval: NodeJS.Timeout | null = null;

	constructor() {
		this.initializeTables();
		this.startOfflineCheck();
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

		// Tabla de alertas de batería
		db.prepare(
			`
      CREATE TABLE IF NOT EXISTS battery_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        battery_level INTEGER NOT NULL,
        charging INTEGER NOT NULL,
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

		// Tabla de heartbeats (para análisis de conectividad)
		db.prepare(
			`
      CREATE TABLE IF NOT EXISTS heartbeats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        battery_level INTEGER NOT NULL,
        charging INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
		).run();

		// Índices para mejorar performance
		db.prepare('CREATE INDEX IF NOT EXISTS idx_alarm_device_time ON alarm_events(device_id, timestamp)').run();
		db.prepare('CREATE INDEX IF NOT EXISTS idx_battery_device_time ON battery_alerts(device_id, timestamp)').run();
		db.prepare('CREATE INDEX IF NOT EXISTS idx_offline_device ON offline_events(device_id, start_time)').run();
		db.prepare('CREATE INDEX IF NOT EXISTS idx_heartbeat_device_time ON heartbeats(device_id, timestamp)').run();

		Logger.info('[MetricsManager] Tablas de métricas inicializadas');
	}

	private startOfflineCheck() {
		// Verificar dispositivos offline cada 2 minutos
		this.offlineCheckInterval = setInterval(() => {
			this.checkOfflineDevices();
		}, 2 * 60 * 1000);
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

	recordBatteryAlert(deviceId: string, batteryLevel: number, charging: boolean = false) {
		const timestamp = Date.now();

		try {
			db.prepare(
				`
        INSERT INTO battery_alerts (device_id, battery_level, charging, timestamp)
        VALUES (?, ?, ?, ?)
      `
			).run(deviceId, batteryLevel, charging ? 1 : 0, timestamp);

			Logger.info(`[MetricsManager] Alerta de batería registrada para ${deviceId}: ${batteryLevel}%`);
		} catch (error) {
			Logger.error(`[MetricsManager] Error registrando alerta de batería: ${error}`);
		}
	}

	recordHeartbeat(deviceId: string, battery: number, charging: boolean) {
		const timestamp = Date.now();

		try {
			// Solo guardar 1 de cada 10 heartbeats para no saturar la DB
			// (cada 45s * 10 = ~7.5 minutos)
			const shouldRecord = Math.random() < 0.1;

			if (shouldRecord) {
				db.prepare(
					`
          INSERT INTO heartbeats (device_id, battery_level, charging, timestamp)
          VALUES (?, ?, ?, ?)
        `
				).run(deviceId, battery, charging ? 1 : 0, timestamp);
			}
		} catch (error) {
			Logger.error(`[MetricsManager] Error registrando heartbeat: ${error}`);
		}
	}

	updateDeviceState(deviceId: string, state: Partial<DeviceState>) {
		let device = this.deviceStates.get(deviceId);

		if (!device) {
			device = {
				deviceId,
				lastSeen: Date.now(),
				battery: state.battery || 100,
				charging: state.charging || false,
				online: true,
			};
			this.deviceStates.set(deviceId, device);
		}

		// Detectar cambio de offline a online
		const wasOffline = !device.online;

		// Actualizar estado
		Object.assign(device, state);

		// Si estaba offline y ahora está online, cerrar el evento
		if (wasOffline && state.online) {
			this.closeOfflineEvent(deviceId);
		}

		// Registrar heartbeat
		if (state.battery !== undefined) {
			this.recordHeartbeat(deviceId, state.battery, state.charging || false);
		}
	}

	private checkOfflineDevices() {
		const now = Date.now();
		const offlineThreshold = 2 * 60 * 1000; // 2 minutos

		for (const device of this.deviceStates.values()) {
			const timeSinceLastSeen = now - device.lastSeen;

			if (timeSinceLastSeen > offlineThreshold && device.online) {
				device.online = false;
				this.recordOfflineEvent(device.deviceId, now);
				Logger.warn(`[MetricsManager] Dispositivo ${device.deviceId} marcado como offline`);
			}
		}
	}

	private recordOfflineEvent(deviceId: string, startTime: number) {
		try {
			db.prepare(
				`
        INSERT INTO offline_events (device_id, start_time)
        VALUES (?, ?)
      `
			).run(deviceId, startTime);
		} catch (error) {
			Logger.error(`[MetricsManager] Error registrando evento offline: ${error}`);
		}
	}

	private closeOfflineEvent(deviceId: string) {
		try {
			const endTime = Date.now();

			// Encontrar el último evento offline sin cerrar
			const event = db
				.prepare(
					`
        SELECT id, start_time FROM offline_events
        WHERE device_id = ? AND end_time IS NULL
        ORDER BY start_time DESC
        LIMIT 1
      `
				)
				.get(deviceId) as any;

			if (event) {
				const durationMinutes = Math.floor((endTime - event.start_time) / 60000);

				db.prepare(
					`
          UPDATE offline_events
          SET end_time = ?, duration_minutes = ?
          WHERE id = ?
        `
				).run(endTime, durationMinutes, event.id);

				Logger.info(`[MetricsManager] Evento offline cerrado para ${deviceId} (${durationMinutes} min)`);
			}
		} catch (error) {
			Logger.error(`[MetricsManager] Error cerrando evento offline: ${error}`);
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

	getBatteryReport() {
		const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

		try {
			const devices = db
				.prepare(
					`
        SELECT 
          device_id,
          COUNT(*) as total_alerts,
          SUM(CASE WHEN timestamp > ? THEN 1 ELSE 0 END) as recent_alerts,
          MIN(battery_level) as lowest_battery,
          MAX(timestamp) as last_alert_time,
          (SELECT battery_level FROM battery_alerts b2 
           WHERE b2.device_id = battery_alerts.device_id 
           ORDER BY timestamp DESC LIMIT 1) as last_alert_level
        FROM battery_alerts
        GROUP BY device_id
        ORDER BY recent_alerts DESC
      `
				)
				.all(sevenDaysAgo) as any[];

			const totalAlerts = devices.reduce((sum, d) => sum + d.total_alerts, 0);

			return {
				devicesWithIssues: devices.length,
				totalAlerts,
				devices: devices.map((d) => ({
					deviceId: d.device_id,
					totalAlerts: d.total_alerts,
					recentAlerts: d.recent_alerts,
					lowestBattery: d.lowest_battery,
					lastAlert: {
						timestamp: d.last_alert_time,
						level: d.last_alert_level,
					},
				})),
			};
		} catch (error) {
			Logger.error(`[MetricsManager] Error en getBatteryReport: ${error}`);
			return null;
		}
	}

	getDailyReport(days: number = 7) {
		try {
			const reports = [];
			const now = Date.now();

			for (let i = 0; i < days; i++) {
				const dayStart = now - i * 24 * 60 * 60 * 1000;
				const dayEnd = dayStart + 24 * 60 * 60 * 1000;
				const date = new Date(dayStart).toISOString().split('T')[0];

				const alarms = db
					.prepare(
						`
          SELECT COUNT(*) as count, COUNT(DISTINCT device_id) as devices
          FROM alarm_events
          WHERE timestamp >= ? AND timestamp < ?
        `
					)
					.get(dayStart, dayEnd) as any;

				const batteryIssues = db
					.prepare(
						`
          SELECT COUNT(*) as count
          FROM battery_alerts
          WHERE timestamp >= ? AND timestamp < ?
        `
					)
					.get(dayStart, dayEnd) as any;

				const offlineDevices = db
					.prepare(
						`
          SELECT COUNT(DISTINCT device_id) as count
          FROM offline_events
          WHERE start_time >= ? AND start_time < ?
        `
					)
					.get(dayStart, dayEnd) as any;

				reports.push({
					date,
					totalAlarms: alarms.count || 0,
					devicesAffected: alarms.devices || 0,
					batteryIssues: batteryIssues.count || 0,
					offlineDevices: offlineDevices.count || 0,
				});
			}

			return reports.reverse();
		} catch (error) {
			Logger.error(`[MetricsManager] Error en getDailyReport: ${error}`);
			return [];
		}
	}

	getCurrentDeviceStates() {
		return Array.from(this.deviceStates.values()).map((d) => ({
			deviceId: d.deviceId,
			online: d.online,
			battery: d.battery,
			charging: d.charging,
			lastSeen: d.lastSeen,
			timeSinceLastSeen: Date.now() - d.lastSeen,
		}));
	}

	getOfflineHistory(deviceId: string, days: number = 30) {
		const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

		try {
			return db
				.prepare(
					`
        SELECT 
          start_time,
          end_time,
          duration_minutes,
          CASE 
            WHEN end_time IS NULL THEN 1
            ELSE 0
          END as is_currently_offline
        FROM offline_events
        WHERE device_id = ? AND start_time > ?
        ORDER BY start_time DESC
      `
				)
				.all(deviceId, cutoffTime);
		} catch (error) {
			Logger.error(`[MetricsManager] Error en getOfflineHistory: ${error}`);
			return [];
		}
	}

	// ============ LIMPIEZA Y MANTENIMIENTO ============

	cleanOldData(daysToKeep: number = 90) {
		const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

		try {
			const transaction = db.transaction(() => {
				const alarmsDeleted = db.prepare('DELETE FROM alarm_events WHERE timestamp < ?').run(cutoffTime);
				const batteryDeleted = db.prepare('DELETE FROM battery_alerts WHERE timestamp < ?').run(cutoffTime);
				const heartbeatsDeleted = db.prepare('DELETE FROM heartbeats WHERE timestamp < ?').run(cutoffTime);
				const offlineDeleted = db.prepare('DELETE FROM offline_events WHERE start_time < ?').run(cutoffTime);

				Logger.info(`[MetricsManager] Limpieza completada:
          - Alarmas: ${alarmsDeleted.changes}
          - Batería: ${batteryDeleted.changes}
          - Heartbeats: ${heartbeatsDeleted.changes}
          - Offline: ${offlineDeleted.changes}
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
