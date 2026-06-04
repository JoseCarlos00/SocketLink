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
				if (err) {
					logger.error(
						`Error en ${serverToAppEvents.CHECK_FOR_UPDATE}: El dispositivo ${target_device_id} no respondió (timeout).`,
					);
					callback({ status: 'ERROR', message: 'Check update respondido: El dispositivo no respondió a tiempo.' });
					return;
				}
				
				logger.info(`Evento ${serverToAppEvents.CHECK_FOR_UPDATE} respondido por: ${target_device_id}`);
				const response = responses[0];

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
		io.to(roomsName.ANDROID_APP)
			.timeout(15000)
			.emit(serverToAppEvents.CHECK_FOR_UPDATE, null, (err, responses) => {
				const responsesCount = responses?.length || 0;

				// Solo consideramos error de timeout si NADIE respondió.
				if (err && responsesCount === 0) {
					logger.error(`Error en ${serverToAppEvents.CHECK_FOR_UPDATE} a la sala: Ningún dispositivo respondió a tiempo.`);
					return callback({ status: 'ERROR', message: 'Ningún dispositivo respondió a tiempo.' });
				}

				logger.info(`Evento ${serverToAppEvents.CHECK_FOR_UPDATE} procesado por ${responsesCount} de ${androidClientsRoom.size} dispositivo(s).`);

				// Si hubo timeout pero tenemos respuestas, el estado general es OK o WARN (parcial)
				const overallStatus = responsesCount < androidClientsRoom.size ? 'OK' : 'OK'; 
				// Nota: Podrías usar 'WARN' si quieres que la web sepa que no todos respondieron.

				callback({
					status: overallStatus,
					message: `Solicitud procesada por ${responsesCount} dispositivo(s).`,
				});
			});

	} else {
		logger.warn(`Se intentó enviar ${serverToAppEvents.CHECK_FOR_UPDATE} a la sala '${roomsName.ANDROID_APP}', pero no hay dispositivos conectados.`);
		callback({ status: 'WARN', message: 'No hay dispositivos Android conectados para recibir la solicitud.' });
	}
}
