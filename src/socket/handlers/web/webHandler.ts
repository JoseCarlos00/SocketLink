import type { AppIO, AppSocket } from '../../../types/socketInterface.js';
import { roomsName, serverToAppEvents, appToServerEvents, clientType } from '../../../constants.js';
import { webLogger as logger } from '../../../services/logger.js';
import { activeConnections } from '../../state.js';
import type {
	AlarmActivationPayload,
	IdentifyClientPayload,
	TargetedDevicePayload,
	WebCallback,
} from '../../../types/payloadsGetWeb.js';
import { metricsManager } from '../../../managers/metricsManager.js'

export function handleWebClientIdentification(socket: AppSocket, payload: IdentifyClientPayload) {
	const type = payload?.clientType;

	if (type === clientType.WEB) {
		socket.join(roomsName.WEB_CLIENT);
		logger.info(`Cliente web ${socket.id} unido a la room '${roomsName.WEB_CLIENT}'`);
	}
}

export function handleAlarm(io: AppIO, data: AlarmActivationPayload, callback: WebCallback) {
	const { target_device_id } = data;

	if (!target_device_id) {
		logger.error('Error en handleAlarm: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Alarm respondido: Falta el ID del dispositivo de destino.' });
	}

	// Registrar alarma en métricas
	metricsManager.recordAlarm(target_device_id);

	if (activeConnections.has(target_device_id)) {
		// Prepara el payload para el dispositivo, usando valores por defecto si no se proveen.
		const { durationSeconds, deviceAlias } = data;
		const payload = { durationSeconds, deviceAlias };

		io.to(target_device_id)
			.timeout(15000)
			.emit(serverToAppEvents.ALARM_ACTIVATE, payload, (err, responses) => {
				if (err) {
					logger.error(
						`Error en ${serverToAppEvents.ALARM_ACTIVATE}: El dispositivo ${target_device_id} no respondió (timeout).`
					);
					callback({ status: 'ERROR', message: 'Alarm respondido: El dispositivo no respondió a tiempo.' });
					return;
				}
				const response = responses[0]; // La respuesta real está en un array
				callback({ status: response?.status || 'OK', message: 'Alarm respondido: Alarma enviada.' });
			});

		logger.info(
			`Evento ${serverToAppEvents.ALARM_ACTIVATE} enviado a ${target_device_id} con payload: ${JSON.stringify(payload)}`
		);
	} else {
		logger.error(`Error en handleAlarm: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Alarm respondido: Dispositivo ${target_device_id} desconectado.` });
	}
}


export function handlePingAlarm(io: AppIO, data: TargetedDevicePayload, callback: WebCallback) {
	const { target_device_id } = data;

	if (!target_device_id) {
		logger.error('Error en handlePingAlarm: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Ping respondido: Falta el ID del dispositivo de destino.' });
	}

	const deviceSocketId = activeConnections.get(target_device_id);
	const deviceSocket = deviceSocketId ? io.sockets.sockets.get(deviceSocketId) : null;

	if (deviceSocket) {
		let isResolved = false;

		// 1. Escuchar el evento PONG que enviará el dispositivo después de sus 3s de delay
		const handlePong = (payload: { status: string }) => {
			if (isResolved) return;
			isResolved = true;
			clearTimeout(timeout);
			callback({ status: 'OK', message: `Ping respondido: ${payload.status}` });
		};

		deviceSocket.once(appToServerEvents.PONG, handlePong);

		// 2. Timeout de seguridad por si el dispositivo se desconecta o falla
		const timeout = setTimeout(() => {
			if (isResolved) return;
			isResolved = true;
			deviceSocket.off(appToServerEvents.PONG, handlePong);
			logger.warn(`Timeout esperando PONG de ${target_device_id}`);
			callback({ status: 'ERROR', message: 'Ping respondido: El dispositivo no envió PONG a tiempo.' });
		}, 10000); // 10 segundos de espera máxima (3s de delay + margen)

		// 3. Emitir el PING al dispositivo (ahora sin callback de ack)
		deviceSocket.emit(serverToAppEvents.PING, null);
		
		logger.info(`Evento ${serverToAppEvents.PING} enviado a: ${target_device_id}. Esperando PONG asíncrono...`);
	} else {
		logger.error(`Error en handlePingAlarm: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Ping respondido: Dispositivo ${target_device_id} desconectado.` });
	}
}


export function handleGetDeviceInfo(io: AppIO, data: TargetedDevicePayload, callback: WebCallback) {
	const { target_device_id } = data;

	if (!target_device_id) {
		logger.error('Error en handleGetDeviceInfo: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Get device info respondido: Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		// El servidor pide la información y espera la respuesta en el callback (si la app lo soporta)
		io.to(target_device_id).timeout(15000).emit(serverToAppEvents.GET_DEVICE_INFO, null, (err, responses) => {
			if (err) {
				logger.error(`Error en ${serverToAppEvents.GET_DEVICE_INFO}: El dispositivo ${target_device_id} no respondió (timeout).`);
				callback({ status: 'ERROR', message: 'Get device info respondido: El dispositivo no respondió a tiempo.' });
				return;
			}

			const deviceInfo = responses[0]; // responses es un array, tomamos el primer elemento.
			
			if (deviceInfo?.androidId) {
				callback({
					status: 'OK',
					message: 'Get device info respondido: Información del dispositivo obtenida.',
					data: deviceInfo,
				});
			} else {
				callback({
					status: 'ERROR',
					message: 'Get device info respondido: El dispositivo no respondió o la respuesta no fue válida.',
				});
			}
		});
	} else {
		logger.error(`Error en handleGetDeviceInfo: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Get device info respondido: Dispositivo ${target_device_id} desconectado.` });
	}
}
