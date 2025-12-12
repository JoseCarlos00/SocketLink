import { roomsName } from "../../constants.js"
import { WebCallback } from "../../types/payloadsGetWeb.js"
import { MaintenanceModePayload } from "../../types/payloadsSendApp.js"
import { AppIO } from "../../types/socketInterface.js"
import { serverToAppEvents } from "../../constants.js"
import { socketLogger as logger } from '../../services/logger.js'


// Función helper para enviar mantenimiento a todos
export function handleSetMaintenanceMode(io: AppIO, data: MaintenanceModePayload, callback: WebCallback) {
	const { untilTimestampMs } = data;

	if (!untilTimestampMs || typeof untilTimestampMs !== 'number') {
		callback({ status: 'ERROR', message: 'Timestamp inválido o ausente.' });
		return;
	}

	if (untilTimestampMs <= Date.now()) {
		callback({ status: 'ERROR', message: 'El timestamp debe ser futuro.' });
		return;
	}

	// Validación razonable: no más de 30 días en el futuro
	const maxFuture = Date.now() + 30 * 24 * 60 * 60 * 1000;
	if (untilTimestampMs > maxFuture) {
		callback({ status: 'ERROR', message: 'El timestamp no puede ser mayor a 30 días.' });
		return;
	}

	// Obtenemos el conjunto de sockets conectados a la sala de clientes Android.
	const androidClientsRoom = io.sockets.adapter.rooms.get(roomsName.ANDROID_APP);

	// Validamos si la sala existe y si tiene al menos un miembro.
	if (androidClientsRoom && androidClientsRoom.size > 0) {
		io.to(roomsName.ANDROID_APP)
			.timeout(5000)
			.emit(serverToAppEvents.SET_MAINTENANCE_MODE, { untilTimestampMs }, (err, responses) => {
				if (err) {
					logger.error(`Error en ${serverToAppEvents.SET_MAINTENANCE_MODE}: Ningún dispositivo respondió a tiempo.`);
					callback({ status: 'ERROR', message: 'Ningún dispositivo respondió a tiempo.' });
					return;
				}

				logger.info(
					`Evento ${serverToAppEvents.SET_MAINTENANCE_MODE} enviado a ${androidClientsRoom.size} dispositivo(s) en la sala '${roomsName.ANDROID_APP}'.`
				);
				callback({
					status: 'OK',
					message: `Solicitud de actualización enviada a ${androidClientsRoom.size} dispositivos.`,
				});
			});

		// Guardar métricas antes de apagar
		// await saveMetricsBeforeShutdown();

		logger.info(`[Maintenance] Modo mantenimiento activado hasta ${new Date(untilTimestampMs)}`);
	} else {
		logger.warn(
			`Se intentó enviar ${serverToAppEvents.CHECK_FOR_UPDATE} a la sala '${roomsName.ANDROID_APP}', pero no hay dispositivos conectados.`
		);
		callback({ status: 'WARN', message: 'No hay dispositivos Android conectados para recibir la solicitud.' });
	}  
}
