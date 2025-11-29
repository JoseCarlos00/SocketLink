import type { AppIO, AppSocket } from '../../types/socketInterface.d.ts';
import { roomsName, submittedEventsApp, clientType, submittedEventWeb } from '../../consts.js';
import { activeConnections, inventoryMaster } from '../state.js';
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
		socket.emit('UPDATED_INVENTORY', inventoryMaster);
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

		io.to(target_device_id).emit(submittedEventsApp.ALARM, payload, response => {
			console.log('Respuesta recibida:', response);
			if (response?.status === 'ERROR') {
				callback({ status: 'ERROR', message: response?.reason! });
				return;
			}

			callback({ status: 'OK', message: response?.status! });
		});

		console.log(`Evento ${submittedEventsApp.ALARM} enviado a ${target_device_id} con payload:`, payload);
	} else {
		console.error(`Error en handleAlarm: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Dispositivo ${target_device_id} desconectado.` });
	}
}

export function handleSendMessage(io: AppIO,data: SendMessagePayload, callback: WebCallback) {
	const { target_device_id, dataMessage } = data;

	if (!target_device_id) {
		console.error('Error en handleSendMessage: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		io.to(target_device_id).emit(submittedEventsApp.MESSAGE, dataMessage, response => {
			console.log('Respuesta recibida:', response);
			if (response?.status === 'ERROR') {
				callback({ status: 'ERROR', message: response?.reason! });
				return;
			}

			callback({ status: 'OK', message: response?.status! });
		});


		console.log(`Evento MESSAGE enviado a: ${target_device_id}`);
		callback({ status: 'OK', message: 'Mensaje enviado correctamente.' });
	} else {
		console.error(`Error en handleSendMessage: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Dispositivo ${target_device_id} desconectado.` });
	}
}

export function handlePingAlarm(io: AppIO,data: TargetedDevicePayload, callback: WebCallback) {
	const { target_device_id } = data;

	if (!target_device_id) {
		console.error('Error en handlePingAlarm: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		io.to(target_device_id).emit(submittedEventsApp.PING, null, response => {
			console.log('Respuesta recibida:', response);

			if (response?.status === 'ERROR') {
					callback({ status: 'ERROR', message: response?.reason!});
					return;
			}

			callback({ status: 'OK', message: response?.status! });
		});

		console.log(`Evento ${submittedEventsApp.PING} enviado a: ${target_device_id}`);
	} else {
		console.error(`Error en handlePingAlarm: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Dispositivo ${target_device_id} desconectado.` });
	}
}

export function handleCheckForUpdate(io: AppIO,data: TargetedDevicePayload, callback: WebCallback) {
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

export function handleGetDeviceInfo(io: AppIO,data: TargetedDevicePayload, callback: WebCallback) {
	const { target_device_id } = data;

	if (!target_device_id) {
		console.error('Error en handleGetDeviceInfo: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		// El servidor pide la información y espera la respuesta en el callback (si la app lo soporta)
		io.to(target_device_id).emit(submittedEventsApp.GET_DEVICE_INFO, (response) => {
			const deviceInfo = Array.isArray(response) ? response[0] : response;

			if (deviceInfo && deviceInfo.androidId) {
				console.log('Respuesta recibida:', deviceInfo);
				callback({ status: 'OK', message: 'Información del dispositivo obtenida.', data: deviceInfo });
			} else {
				console.error('La app no pudo procesar la solicitud.');
				callback({
					status: 'ERROR',
					message: 'El dispositivo no respondió o la respuesta no fue válida.',
				});
			}
		});

		console.log(`Evento ${submittedEventsApp.GET_DEVICE_INFO} enviado a: ${target_device_id}`);
	} else {
		console.error(`Error en handleGetDeviceInfo: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Dispositivo ${target_device_id} desconectado.` });
	}
}

/** Difusión (broadcast) a una sala (room)  */

export function handleCheckForAllUpdate(io: AppIO, callback: WebCallback) {
	// Obtenemos el conjunto de sockets conectados a la sala de clientes Android.
	const androidClientsRoom = io.sockets.adapter.rooms.get(roomsName.ANDROID_CLIENT);

	// Validamos si la sala existe y si tiene al menos un miembro.
	if (androidClientsRoom && androidClientsRoom.size > 0) {
		io.to(roomsName.ANDROID_CLIENT).emit(submittedEventsApp.CHECK_FOR_UPDATE);

		console.log(`Evento ${submittedEventsApp.CHECK_FOR_UPDATE} enviado a ${androidClientsRoom.size} dispositivo(s) en la sala '${roomsName.ANDROID_CLIENT}'.`);
		callback({ status: 'OK', message: `Solicitud de actualización enviada a ${androidClientsRoom.size} dispositivos.` });
	} else {
		console.warn(`Se intentó enviar ${submittedEventsApp.CHECK_FOR_UPDATE} a la sala '${roomsName.ANDROID_CLIENT}', pero no hay dispositivos conectados.`);
		callback({ status: 'WARN', message: 'No hay dispositivos Android conectados para recibir la solicitud.' });
	}
}

export function handleSendAllMessage(io: AppIO,payload: SendAllMessagePayload,callback: WebCallback) {
	// Obtenemos el conjunto de sockets conectados a la sala de clientes Android.
	const androidClientsRoom = io.sockets.adapter.rooms.get(roomsName.ANDROID_CLIENT);

	// Validamos si la sala existe y si tiene al menos un miembro.
	if (androidClientsRoom && androidClientsRoom.size > 0) {
		io.to(roomsName.ANDROID_CLIENT).emit(submittedEventsApp.MESSAGE, payload.dataMessage, response => {
			console.log('Respuesta recibida:', response);
			if (response?.status === 'ERROR') {
				callback({ status: 'ERROR', message: response?.reason! });
				return;
			};

			callback({
				status: 'OK',
				message: `Mensajes Enviados a ${androidClientsRoom.size} dispositivos.`,
			});
		});


		console.log(
			`Evento ${submittedEventsApp.MESSAGE} enviado a ${androidClientsRoom.size} dispositivo(s) en la sala '${roomsName.ANDROID_CLIENT}'.`
		);
	} else {
		console.warn(
			`Se intentó enviar ${submittedEventsApp.MESSAGE} a la sala '${roomsName.ANDROID_CLIENT}', pero no hay dispositivos conectados.`
		);
		callback({ status: 'WARN', message: 'No hay dispositivos Android conectados para recibir la solicitud.' });
	}
}
