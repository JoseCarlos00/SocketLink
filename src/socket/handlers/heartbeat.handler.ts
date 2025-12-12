import type { AppSocket } from '../../types/socketInterface.d.ts';
import { HeartbeatAck, HeartbeatPayload } from "../../types/payloadsGetApp.js";
import { metricsManager } from "../../managers/metricsManager.js";
import {androidLogger as logger } from '../../services/logger.js';


export function handleHeartbeatDevice(_socket: AppSocket, data: HeartbeatPayload, ack: HeartbeatAck) {
	const { deviceId, battery, charging, timestamp } = data;

	// Actualizar estado del dispositivo en MetricsManager
	metricsManager.updateDeviceState(deviceId, {
		lastSeen: Date.now(),
		battery,
		charging,
		online: true,
	});

	// Si batería baja, registrar alerta
	if (battery < 20 && !charging) {
		metricsManager.recordBatteryAlert(deviceId, battery);
		logger.warn(`[Alert] Batería baja en ${deviceId}: ${battery}%`);
	}

	// Responder (opcional)
	ack?.({
		status: 'OK',
		serverTime: Date.now(),
	});
}
