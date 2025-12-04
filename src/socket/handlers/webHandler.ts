import type { AppIO, AppSocket } from '../../types/socketInterface.d.ts';
import { roomsName, submittedEventsApp, clientType, submittedEventWeb } from '../../consts.js';
import { activeConnections } from '../state.js';
import type {
	AlarmActivationPayload,
	IdentifyClientPayload,
	SendMessagePayload,
	SendAllMessagePayload,
	TargetedDevicePayload,
	WebCallback,
} from '../../types/payloadsGetWeb.d.ts';

export function handleWebClientIdentification(socket: AppSocket, payload: IdentifyClientPayload) {
	const type = payload?.clientType;

	if (type === clientType.WEB) {
		socket.join(roomsName.WEB_CLIENT);
		console.log(`Cliente web ${socket.id} unido a la room '${roomsName.WEB_CLIENT}'`);
	}
}

export function handleAlarm(io: AppIO, data: AlarmActivationPayload, callback: WebCallback) {
	const { target_device_id } = data;
	
	if (!target_device_id) {
		console.error('Error en handleAlarm: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		// Prepara el payload para el dispositivo, usando valores por defecto si no se proveen.
		const { durationSeconds, deviceAlias } = data;
		const payload = { durationSeconds, deviceAlias };

		io.to(target_device_id).timeout(5000).emit(submittedEventsApp.ALARM, payload, (err, responses) => {
			if (err) {
				console.error(`Error en ${submittedEventsApp.ALARM}: El dispositivo ${target_device_id} no respondió (timeout).`);
				callback({ status: 'ERROR', message: 'El dispositivo no respondió a tiempo.' });
				return;
			}
			const response = responses[0]; // La respuesta real está en un array
			callback({ status: response?.status || 'OK', message: response?.status || 'Alarma procesada.' });
		});

		console.log(`Evento ${submittedEventsApp.ALARM} enviado a ${target_device_id} con payload:`, payload);
	} else {
		console.error(`Error en handleAlarm: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Dispositivo ${target_device_id} desconectado.` });
	}
}

export function handleSendMessage(io: AppIO, data: SendMessagePayload, callback: WebCallback) {
	const { target_device_id, dataMessage } = data;

	if (!target_device_id) {
		console.error('Error en handleSendMessage: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		io.to(target_device_id).timeout(5000).emit(submittedEventsApp.MESSAGE, dataMessage, (err, responses) => {
			if (err) {
				console.error(`Error en ${submittedEventsApp.MESSAGE}: El dispositivo ${target_device_id} no respondió (timeout).`);
				callback({ status: 'ERROR', message: 'El dispositivo no respondió a tiempo.' });
				return;
			}
			const response = responses[0];
			callback({ status: response?.status || 'OK', message: response?.status || 'Mensaje procesado.' });
		});

		console.log(`Evento MESSAGE enviado a: ${target_device_id}`);
	} else {
		console.error(`Error en handleSendMessage: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Dispositivo ${target_device_id} desconectado.` });
	}
}

export function handlePingAlarm(io: AppIO, data: TargetedDevicePayload, callback: WebCallback) {
	const { target_device_id } = data;

	if (!target_device_id) {
		console.error('Error en handlePingAlarm: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		io.to(target_device_id).timeout(5000).emit(submittedEventsApp.PING, null, (err, responses) => {
			if (err) {
				console.error(`Error en ${submittedEventsApp.PING}: El dispositivo ${target_device_id} no respondió (timeout).`);
				callback({ status: 'ERROR', message: 'El dispositivo no respondió a tiempo.' });
				return;
			}
			const response = responses[0];
			callback({ status: 'OK', message: `Ping respondido: ${response?.status}` });
		});

		console.log(`Evento ${submittedEventsApp.PING} enviado a: ${target_device_id}`);
	} else {
		console.error(`Error en handlePingAlarm: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Dispositivo ${target_device_id} desconectado.` });
	}
}

export function handleCheckForUpdate(io: AppIO, data: TargetedDevicePayload, callback: WebCallback) {
	const { target_device_id } = data;

	if (!target_device_id) {
		console.error('Error en handleCheckForUpdate: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		io.to(target_device_id).emit(submittedEventsApp.CHECK_FOR_UPDATE);

		console.log(`Evento ${submittedEventsApp.CHECK_FOR_UPDATE} enviado a: ${target_device_id}`);
		callback({ status: 'OK', message: 'Solicitud de búsqueda de actualización enviada.' });
	} else {
		console.error(`Error en handleCheckForUpdate: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Dispositivo ${target_device_id} desconectado.` });
	}
}

export function handleGetDeviceInfo(io: AppIO, data: TargetedDevicePayload, callback: WebCallback) {
	const { target_device_id } = data;

	if (!target_device_id) {
		console.error('Error en handleGetDeviceInfo: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		// El servidor pide la información y espera la respuesta en el callback (si la app lo soporta)
		io.to(target_device_id).timeout(5000).emit(submittedEventsApp.GET_DEVICE_INFO, null, (err, responses) => {
			if (err) {
				console.error(`Error en ${submittedEventsApp.GET_DEVICE_INFO}: El dispositivo ${target_device_id} no respondió (timeout).`);
				callback({ status: 'ERROR', message: 'El dispositivo no respondió a tiempo.' });
				return;
			}

			const deviceInfo = responses[0]; // responses es un array, tomamos el primer elemento.
			if (deviceInfo?.androidId) {
				callback({ status: 'OK', message: 'Información del dispositivo obtenida.', data: deviceInfo });
			} else {
				callback({
					status: 'ERROR',
					message: 'El dispositivo no respondió o la respuesta no fue válida.',
				});
			}
		});
	} else {
		console.error(`Error en handleGetDeviceInfo: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Dispositivo ${target_device_id} desconectado.` });
	}
}

/** Difusión (broadcast) a una sala (room)  */

export function handleCheckForAllUpdate(io: AppIO, callback: WebCallback) {
	// Obtenemos el conjunto de sockets conectados a la sala de clientes Android.
	const androidClientsRoom = io.sockets.adapter.rooms.get(roomsName.ANDROID_APP);

	// Validamos si la sala existe y si tiene al menos un miembro.
	if (androidClientsRoom && androidClientsRoom.size > 0) {
		io.to(roomsName.ANDROID_APP).emit(submittedEventsApp.CHECK_FOR_UPDATE);

		console.log(`Evento ${submittedEventsApp.CHECK_FOR_UPDATE} enviado a ${androidClientsRoom.size} dispositivo(s) en la sala '${roomsName.ANDROID_APP}'.`);
		callback({ status: 'OK', message: `Solicitud de actualización enviada a ${androidClientsRoom.size} dispositivos.` });
	} else {
		console.warn(`Se intentó enviar ${submittedEventsApp.CHECK_FOR_UPDATE} a la sala '${roomsName.ANDROID_APP}', pero no hay dispositivos conectados.`);
		callback({ status: 'WARN', message: 'No hay dispositivos Android conectados para recibir la solicitud.' });
	}
}

export function handleSendAllMessage(io: AppIO, payload: SendAllMessagePayload, callback: WebCallback) {
	// Obtenemos el conjunto de sockets conectados a la sala de clientes Android.
	const androidClientsRoom = io.sockets.adapter.rooms.get(roomsName.ANDROID_APP);

	// Validamos si la sala existe y si tiene al menos un miembro.
	if (androidClientsRoom && androidClientsRoom.size > 0) {
		io.to(roomsName.ANDROID_APP).timeout(5000).emit(submittedEventsApp.MESSAGE, payload.dataMessage, (err, responses) => {
			if (err) {
				// Este error se activa si NINGÚN cliente responde.
				console.error(`Error en ${submittedEventsApp.MESSAGE} a la sala: Ningún dispositivo respondió a tiempo.`);
				callback({ status: 'ERROR', message: 'Ningún dispositivo respondió a tiempo.' });
				return;
			}

			// responses es un array con las respuestas de los clientes que sí contestaron.
			const successfulResponses = responses.filter(r => r?.status !== 'ERROR');

			callback({ status: 'OK', message: `Mensaje procesado por ${successfulResponses.length} de ${androidClientsRoom.size} dispositivos.` });
		});


		console.log(
			`Evento ${submittedEventsApp.MESSAGE} enviado a ${androidClientsRoom.size} dispositivo(s) en la sala '${roomsName.ANDROID_APP}'.`
		);
	} else {
		console.warn(
			`Se intentó enviar ${submittedEventsApp.MESSAGE} a la sala '${roomsName.ANDROID_APP}', pero no hay dispositivos conectados.`
		);
		callback({ status: 'WARN', message: 'No hay dispositivos Android conectados para recibir la solicitud.' });
	}
}
