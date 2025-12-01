import type { AppSocket } from '../../types/socketInterface.d.ts';
import { roomsName } from '../../consts.js';
import { activeConnections, fixedMappingCache } from '../state.js';
import type { RegisterDevicePayload, RegisterDeviceAck } from '../../types/payloadsGetApp.d.ts';
import { updateAndroidIdInSheets } from '../../services/googleSheetService.js'



export async function handleDeviceRegistration(
	socket: AppSocket,
	data: RegisterDevicePayload,
	ack?: RegisterDeviceAck
) {
	const { androidId, ipAddress } = data; // androidId es el DEVICE_ID que envía el móvil

	if (!androidId || !ipAddress) {
		ack?.({ status: 'ERROR', reason: 'Datos de identificación incompletos.' });
		return;
	}

	// 1. Buscar el dispositivo usando la IP Fija como clave
	const deviceData = fixedMappingCache.get(ipAddress);

	if (!deviceData) {
		// Dispositivo Desconocido: No existe en la hoja de cálculo
		console.warn(`[REGISTRO] Dispositivo DESCONOCIDO intentó conectarse. IP: ${ipAddress}`);
		// No lo registramos en activeConnections.
		return ack?.({ status: 'ERROR', reason: `Dispositivo con IP ${ipAddress} no registrado.` });
	}

	// 2. Dispositivo Conocido: Verificar/Actualizar el androidId

	// Si el androidId de la hoja está vacío o es diferente al que envía el móvil:
	if (!deviceData.androidId || deviceData.androidId !== androidId) {
		console.log(`[REGISTRO] IP ${ipAddress} necesita actualización de androidId.`);

		// **ACTUALIZACIÓN EN SHEETS (Persistencia)**
		await updateAndroidIdInSheets(ipAddress, androidId);

		// **ACTUALIZACIÓN EN CACHÉ A (Uso Inmediato)**
		deviceData.androidId = androidId;
	}

	// 3. Establecer Conexión en Memoria (Caché B)

	// La clave para el socket siempre será el androidId (deviceId) ya que es la clave única del móvil.
	socket.data.deviceId = androidId;
	socket.join(androidId); // La room de destino
	socket.join(roomsName.ANDROID_CLIENT);
	activeConnections.set(androidId, socket.id); // Registra en Caché B

	console.log(`[REGISTRO] IP:'${deviceData.ip}' registrado. ID: ${androidId}.`);
	ack?.({ status: 'OK' });
}


export function handleDeviceDisconnect(socket: AppSocket) {
	if (socket.data.deviceId) {
		activeConnections.delete(socket.data.deviceId);
		console.log(`Dispositivo desconectado y eliminado: ${socket.data.deviceId}`);
	}
}
