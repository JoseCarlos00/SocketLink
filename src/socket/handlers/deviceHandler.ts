import type { AppSocket } from '../../types/socketInterface.d.ts';
import { roomsName } from '../../consts.js';
import { activeConnections } from '../state.js';
import type { RegisterDevicePayload, RegisterDeviceAck } from '../../types/payloadsGetApp.d.ts';



export function handleDeviceRegistration(socket: AppSocket, data: RegisterDevicePayload, ack?: RegisterDeviceAck) {
	const { androidId, ipAddress } = data;

	if (!androidId) {
		console.error('Error de registro: falta DEVICE_ID');
		ack?.({ status: 'ERROR', reason: 'El ID del dispositivo (androidId) es requerido.' });
		return;
	}

	// Asignamos el deviceId a la propiedad personalizada del socket
	socket.data.deviceId = androidId;
	socket.join(androidId);
	socket.join(roomsName.ANDROID_CLIENT);

	activeConnections.set(androidId, socket.id);
	console.log(`Dispositivo registrado: ${androidId} (IP: ${ipAddress})`);
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
