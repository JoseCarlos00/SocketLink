import type { AppSocket } from '../../types/socketInterface.d.ts';
import { roomsName } from '../../../consts.js';
import { activeConnections } from '../state.js';
import { RegisterDevicePayload } from '../../types/payloadsGetApp.js'



export function handleDeviceRegistration(socket: AppSocket, data: RegisterDevicePayload) {
	const { androidId: deviceId, ipAddress } = data;

	if (!deviceId) {
		console.error('Error de registro: falta DEVICE_ID');
		return;
	}

	// Asignamos el deviceId a la propiedad personalizada del socket
	socket.data.deviceId = deviceId;
	socket.join(deviceId);
	socket.join(roomsName.ANDROID_CLIENT);

	activeConnections.set(deviceId, socket.id);
	console.log(`Dispositivo registrado: ${deviceId} (IP: ${ipAddress})`);
	console.log(`Conexiones activas: ${activeConnections.size}`);
}


export function handleDeviceDisconnect(socket: AppSocket) {
	if (socket.data.deviceId) {
		activeConnections.delete(socket.data.deviceId);
		console.log(`Dispositivo desconectado y eliminado: ${socket.data.deviceId}`);
	}
}
