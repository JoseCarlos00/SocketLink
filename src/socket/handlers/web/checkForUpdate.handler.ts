import type { AppIO } from '../../../types/socketInterface.js';
import { roomsName, serverToAppEvents } from '../../../constants.js';
import { webLogger as logger } from '../../../services/logger.js';
import { activeConnections } from '../../state.js';
import type { TargetedDevicePayload, WebCallback } from '../../../types/payloadsGetWeb.js';


export function handleCheckForUpdate(io: AppIO, data: TargetedDevicePayload, callback: WebCallback) {
	const { target_device_id } = data;

	if (!target_device_id) {
		logger.error('Error en handleCheckForUpdate: target_device_id no fue proporcionado.');
		return callback({ status: 'ERROR', message: 'Check update respondido: Falta el ID del dispositivo de destino.' });
	}

	if (activeConnections.has(target_device_id)) {
		io.to(target_device_id)
			.timeout(15000)
			.emit(serverToAppEvents.CHECK_FOR_UPDATE, null, (err, responses) => {
				logger.info(`Evento ${serverToAppEvents.CHECK_FOR_UPDATE} enviado a: ${target_device_id}`);

				if (err) {
					logger.error(
						`Error en ${serverToAppEvents.CHECK_FOR_UPDATE}: del dispositivo ${target_device_id} no respondió (timeout).`,
					);
					callback({ status: 'ERROR', message: 'Check update respondido: El dispositivo no respondió a tiempo.' });
					return;
				}

				const response = responses[0];
				console.log(`Respuesta recibida de ${target_device_id}:`, response);

				callback({
					status: response?.status || 'OK',
					message: 'Check update respondido: Solicitud de búsqueda de actualización enviada.',
				});

			});
	} else {
		logger.error(`Error en handleCheckForUpdate: Dispositivo ${target_device_id} no encontrado o desconectado.`);
		callback({ status: 'ERROR', message: `Check update respondido: Dispositivo ${target_device_id} desconectado.` });
	}
}


/** Difusión (broadcast) a una sala (room)  */

export function handleCheckForAllUpdate(io: AppIO, callback: WebCallback) {
	// Obtenemos el conjunto de sockets conectados a la sala de clientes Android.
	const androidClientsRoom = io.sockets.adapter.rooms.get(roomsName.ANDROID_APP);

	// Validamos si la sala existe y si tiene al menos un miembro.
	if (androidClientsRoom && androidClientsRoom.size > 0) {
		io.to(roomsName.ANDROID_APP).timeout(15000).emit(serverToAppEvents.CHECK_FOR_UPDATE, null, (err, responses) => {
			  console.log('Respuesta recibida de un dispositivo:', responses);

			if (err) {
				// Este error se activa si NINGÚN cliente responde.
				logger.error(`Error en ${serverToAppEvents.CHECK_FOR_UPDATE} a la sala: Ningún dispositivo respondió a tiempo.`);
				callback({ status: 'ERROR', message: 'El dispositivo no respondió a tiempo.' });
				return;
			}

			logger.info(`Evento ${serverToAppEvents.CHECK_FOR_UPDATE} enviado a ${androidClientsRoom.size} dispositivo(s) en la sala '${roomsName.ANDROID_APP}'.`);

      const response = responses[0];
      
      callback({
				status: response?.status || 'OK',
				message: `Solicitud de actualización enviada a ${androidClientsRoom.size} dispositivos.`,
			});
		});

	} else {
		logger.warn(`Se intentó enviar ${serverToAppEvents.CHECK_FOR_UPDATE} a la sala '${roomsName.ANDROID_APP}', pero no hay dispositivos conectados.`);
		callback({ status: 'WARN', message: 'No hay dispositivos Android conectados para recibir la solicitud.' });
	}
}
