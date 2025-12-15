import type { AppSocket } from '../../types/socketInterface.d.ts';
import { HeartbeatAck, HeartbeatPayload } from "../../types/payloadsGetApp.js";
import { metricsManager } from "../../managers/metricsManager.js";
import {androidLogger as logger } from '../../services/logger.js';
import { deviceStatusManager } from '../../managers/DeviceStatusManager.js'


export function handleHeartbeatDevice(socket: AppSocket, data: HeartbeatPayload, ack: HeartbeatAck) {
	const { deviceId, battery, charging, timestamp } = data;

	// 1. Actualizar métricas (para reportes)
	metricsManager.updateDeviceState(deviceId, {
		lastSeen: Date.now(),
		battery,
		charging,
		online: true,
	});

	// 2. Actualizar estado en tiempo real (emite a web solo si hay cambios)
	// deviceStatusManager.updateFromHeartbeat(deviceId, battery, charging);

	// 3. Alertas de batería baja
	if (battery < 20 && !charging) {
		metricsManager.recordBatteryAlert(deviceId, battery);
		logger.warn(`Batería baja en ${deviceId}: ${battery}%`);
	}

	// 4. ACK al dispositivo
	ack?.({ status: 'OK', serverTime: Date.now() });
}
