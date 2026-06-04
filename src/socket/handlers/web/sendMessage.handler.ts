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
				const responsesCount = responses?.length || 0;

				// Si hay error pero tenemos respuestas, no es un fallo total de comunicación
				if (err && responsesCount === 0) {
					logger.error(
						`Error en ${serverToAppEvents.MESSAGE_RECEIVE} a la sala: Ningún dispositivo respondió a tiempo.`,
					);
					callback({ status: 'ERROR', message: 'Ningún dispositivo respondió a tiempo.' });
					return;
				}

				logger.info(
					`Evento ${serverToAppEvents.MESSAGE_RECEIVE} procesado por ${responsesCount} de ${androidClientsRoom.size} dispositivo(s).`,
				);

				// Si hubo timeout pero tenemos respuestas, el estado general es OK o WARN (parcial)
				const overallStatus = responsesCount < androidClientsRoom.size ? 'OK' : 'OK';
				// Nota: Podrías usar 'WARN' si quieres que la web sepa que no todos respondieron.

				callback({
					status: overallStatus,
					message: `Mensajes enviados por ${responsesCount} dispositivo(s).`,
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
