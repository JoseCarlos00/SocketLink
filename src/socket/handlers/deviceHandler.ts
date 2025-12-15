import type { AppSocket } from '../../types/socketInterface.d.ts';
import { roomsName } from '../../constants.js';
import { activeConnections } from '../state.js';
import type { RegisterDevicePayload, RegisterDeviceAck } from '../../types/payloadsGetApp.d.ts';
import { updateAndroidIdInSheets } from '../../services/googleSheetService.js'; // Mantenemos la importación de la función
import { androidLogger as logger } from '../../services/logger.js'; // Usamos un solo logger para este módulo
import { deviceStatusManager } from '../../managers/DeviceStatusManager.js'

export async function handleDeviceRegistration(socket: AppSocket, data: RegisterDevicePayload, ack: RegisterDeviceAck) {
	const { androidId, ipAddress } = data; // androidId es el DEVICE_ID que envía el móvil
	let newRegister = false;

	if (!androidId || !ipAddress) {
		ack?.({ status: 'ERROR', reason: 'Datos de identificación incompletos.' });
		return;
	}

	const deviceData = deviceStatusManager.getDeviceByIp(ipAddress);

	if (!deviceData) {
		// Dispositivo Desconocido: No existe en la hoja de cálculo
		logger.warn(
			`[REGISTRO] Dispositivo DESCONOCIDO intentó conectarse. IP: ${ipAddress}. No se encontró en el inventario.`
		);
		ack?.({ status: 'ERROR', reason: `Dispositivo con IP ${ipAddress} no registrado.` });
		return;
	}

	// Si el androidId de la hoja está vacío o es diferente al que envía el móvil:
	if (!deviceData.androidId || deviceData.androidId !== androidId) {
		logger.warn(
			`[REGISTRO] El androidId para la IP ${ipAddress} requiere actualización. Procediendo a actualizarlo en Google Sheets.`
		);

		try {
			// **ACTUALIZACIÓN EN SHEETS (Persistencia)**
			await updateAndroidIdInSheets(deviceData.index, ipAddress, androidId);
		} catch (error) {
			logger.error(
				`[REGISTRO]: Error al intentar actualizar el androidId en Google Sheets para la IP ${ipAddress}. Error: ${error}`
			);
			ack?.({ status: 'ERROR', reason: `Error al actualizar Google Sheets para la IP ${ipAddress}.` });
			return;
		}

		deviceData.androidId = androidId;
	}

	// Establecer Conexión en Memoria (Caché B)
	socket.data.deviceId = androidId;
	socket.join(androidId); // La room de destino
	socket.join(roomsName.ANDROID_APP);
	activeConnections.set(androidId, socket.id); // Registra en Caché B

	logger.info(`[REGISTRO] Dispositivo registrado. IP: ${ipAddress}, ID: ${androidId}`);
	ack?.({ status: 'OK' });
}

export function handleDeviceDisconnect(socket: AppSocket) {
	const { deviceId } = socket.data;

	if (deviceId) {
		logger.info(`[DESCONEXIÓN] Dispositivo desconectado: ${deviceId}`);
		deviceStatusManager.markAsDisconnected(deviceId);
		activeConnections.delete(deviceId);
		socket.leave(deviceId);
		socket.leave(roomsName.ANDROID_APP);
		socket.data.deviceId = undefined;
	}
}
