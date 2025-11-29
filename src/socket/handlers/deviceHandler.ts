import type { AppSocket } from '../../types/socketInterface.d.ts';
import { roomsName } from '../../../consts.js';
import { activeConnections } from '../state.js';
import type { RegisterDevicePayload, RegisterDeviceAck } from '../../types/payloadsGetApp.d.ts';



export function handleDeviceRegistration(socket: AppSocket, data: RegisterDevicePayload, ack?: RegisterDeviceAck) {
	const { androidId: deviceId, ipAddress } = data;

	if (!deviceId) {
		console.error('Error de registro: falta DEVICE_ID');
		ack?.({ status: 'ERROR', reason: 'El ID del dispositivo (androidId) es requerido.' });
		return;
	}

	// Asignamos el deviceId a la propiedad personalizada del socket
	socket.data.deviceId = deviceId;
	socket.join(deviceId);
	socket.join(roomsName.ANDROID_CLIENT);

	activeConnections.set(deviceId, socket.id);
	console.log(`Dispositivo registrado: ${deviceId} (IP: ${ipAddress})`);
	console.log(`Conexiones activas: ${activeConnections.size}`);

	// Enviamos la confirmación de éxito al dispositivo
	ack?.({ status: 'OK' });
}


export function handleDeviceDisconnect(socket: AppSocket) {
	if (socket.data.deviceId) {
		activeConnections.delete(socket.data.deviceId);
		console.log(`Dispositivo desconectado y eliminado: ${socket.data.deviceId}`);
	}
}
