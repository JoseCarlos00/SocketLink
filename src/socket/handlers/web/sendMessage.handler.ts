import type { AppIO } from '../../../types/socketInterface.js';
import { roomsName, serverToAppEvents } from '../../../constants.js';
import { webLogger as logger } from '../../../services/logger.js';
import { activeConnections } from '../../state.js';
import type { SendMessagePayload, SendAllMessagePayload, WebCallback } from '../../../types/payloadsGetWeb.js';

export function handleSendMessage(io: AppIO, data: SendMessagePayload, callback: WebCallback) {
	const { target_device_id, dataMessage } = data;

	if (!target_device_id) {
		logger.error('Error en handleSendMessage: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Message respondido: Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		io.to(target_device_id)
			.timeout(15000)
			.emit(serverToAppEvents.MESSAGE_RECEIVE, dataMessage, (err, responses) => {
				if (err) {
					logger.error(
						`Error en ${serverToAppEvents.MESSAGE_RECEIVE}: El dispositivo ${target_device_id} no respondió (timeout).`,
					);
					callback({ status: 'ERROR', message: 'Message respondido: El dispositivo no respondió a tiempo.' });
					return;
				}

				const response = responses[0];

				callback({ status: response?.status || 'OK', message: 'Message respondido: Mensaje enviado.' });
			});

		logger.info(`Evento MESSAGE enviado a: ${target_device_id}`);
	} else {
		logger.error(`Error en handleSendMessage: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Message respondido: Dispositivo ${target_device_id} desconectado.` });
	}
}

/** Difusión (broadcast) a una sala (room)  */

export function handleSendAllMessage(io: AppIO, payload: SendAllMessagePayload, callback: WebCallback) {
	// Obtenemos el conjunto de sockets conectados a la sala de clientes Android.
	const androidClientsRoom = io.sockets.adapter.rooms.get(roomsName.ANDROID_APP);

	// Validamos si la sala existe y si tiene al menos un miembro.
	if (androidClientsRoom && androidClientsRoom.size > 0) {
		io.to(roomsName.ANDROID_APP)
			.timeout(15000)
			.emit(serverToAppEvents.MESSAGE_RECEIVE, payload.dataMessage, (err, responses) => {
				if (err) {
					// Este error se activa si NINGÚN cliente responde.
					logger.error(
						`Error en ${serverToAppEvents.MESSAGE_RECEIVE} a la sala: Ningún dispositivo respondió a tiempo.`,
					);
					callback({ status: 'ERROR', message: 'Ningún dispositivo respondió a tiempo.' });
					return;
				}

				// responses es un array con las respuestas de los clientes que sí contestaron.
				const successfulResponses = responses.filter((r) => r?.status !== 'ERROR');

				callback({
					status: 'OK',
					message: `Mensaje procesado por ${successfulResponses.length} de ${androidClientsRoom.size} dispositivos.`,
				});
			});

		logger.info(
			`Evento ${serverToAppEvents.MESSAGE_RECEIVE} enviado a ${androidClientsRoom.size} dispositivo(s) en la sala '${roomsName.ANDROID_APP}'.`,
		);
	} else {
		logger.warn(
			`Se intentó enviar ${serverToAppEvents.MESSAGE_RECEIVE} a la sala '${roomsName.ANDROID_APP}', pero no hay dispositivos conectados.`,
		);
		callback({ status: 'WARN', message: 'No hay dispositivos Android conectados para recibir la solicitud.' });
	}
}
