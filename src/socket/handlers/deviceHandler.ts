import { roomsName } from '../../../consts.js';
import { activeConnections } from '../state.js';

// Evento emitido desde app android -> `REGISTER_DEVICE`
export function handleDeviceRegistration(socket, data) {
	const { deviceId: device_id, currentIp: current_ip } = data;

	if (!device_id) {
		console.error('Error de registro: falta DEVICE_ID');
		return;
	}

	socket.deviceId = device_id;
	socket.join(device_id);
	socket.join(roomsName.ANDROID_CLIENT);

	activeConnections.set(device_id, socket.id);
	console.log(`Dispositivo registrado: ${device_id} (IP: ${current_ip})`);
	console.log(`Conexiones activas: ${activeConnections.size}`);
}

// Evento emitido desde app android -> `DEVICE_INFO`
export function handleDeviceInfo(socket, data) {
	const { androidId: device_id, ipAddress, appVersion } = data;

	if (!device_id) {
		console.error('Error en handleDeviceInfo: androidId (DEVICE_ID) no fue proporcionado en el payload.');
		return;
	}

	// Aquí puedes procesar la información recibida del dispositivo.
	console.log(`Información recibida del dispositivo ${device_id}: IP=${ipAddress}, Version=${appVersion}`);
}

export function handleDeviceDisconnect(socket) {
	if (socket.deviceId) {
		activeConnections.delete(socket.deviceId);
		console.log(`Dispositivo desconectado y eliminado: ${socket.deviceId}`);
	}
}
