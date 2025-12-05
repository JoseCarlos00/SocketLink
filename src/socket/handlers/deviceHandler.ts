import type { AppSocket } from '../../types/socketInterface.d.ts';
import { roomsName } from '../../consts.js';
import { activeConnections, fixedMappingCache } from '../state.js';
import type { RegisterDevicePayload, RegisterDeviceAck } from '../../types/payloadsGetApp.d.ts';
import { updateAndroidIdInSheets } from '../../services/googleSheetService.js';
import { androidLogger, googleSheetLogger } from '../../services/logger.js';

export async function handleDeviceRegistration(
	socket: AppSocket,
	data: RegisterDevicePayload,
	ack: RegisterDeviceAck
) {
	const { androidId, ipAddress } = data; // androidId es el DEVICE_ID que envía el móvil

	if (!androidId || !ipAddress) {
		ack?.({ status: 'ERROR', reason: 'Datos de identificación incompletos.' });
		return;
	}

	const deviceData = fixedMappingCache.get(ipAddress);

	if (!deviceData) {
		// Dispositivo Desconocido: No existe en la hoja de cálculo
			googleSheetLogger.warn(`[REGISTRO] Dispositivo DESCONOCIDO intentó conectarse. IP: ${ipAddress}`);
		ack?.({ status: 'ERROR', reason: `Dispositivo con IP ${ipAddress} no registrado.` });
		return;
	}

	// Si el androidId de la hoja está vacío o es diferente al que envía el móvil:
	if (!deviceData.androidId || deviceData.androidId !== androidId) {
			googleSheetLogger.warn(`[REGISTRO] IP ${ipAddress} necesita actualización de androidId.`);

		try {
			// **ACTUALIZACIÓN EN SHEETS (Persistencia)**
			await updateAndroidIdInSheets(deviceData.index, ipAddress, androidId);
		} catch (error) {
			androidLogger.error(`[REGISTRO]: ${error}`);
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

	androidLogger.info(`[REGISTRO] Dispositivo registrado. IP: ${ipAddress}, ID: ${androidId}`);
	ack?.({ status: 'OK' });
}

export function handleDeviceDisconnect(socket: AppSocket) {
	const { deviceId } = socket.data;
	
	if (deviceId) {
		androidLogger.info(`[DESCONEXIÓN] Dispositivo desconectado: ${deviceId}`);
		activeConnections.delete(deviceId);
		socket.leave(deviceId);
		socket.leave(roomsName.ANDROID_APP);
		socket.data.deviceId = undefined;
	}
}
