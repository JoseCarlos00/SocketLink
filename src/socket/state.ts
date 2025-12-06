import { getCriticalMappingData, getMetadataTimestamp } from '../services/googleSheetService.js';
import { SPREAD_SHEET_ID, POLLING_INTERVAL_MS, roomsName, submittedEventWeb } from '../constants.js';
import { cacheLogger as logger } from '../services/logger.js';
import type {  MappingData } from '../types/inventory.d.ts';
import type { AppIO } from '../types/socketInterface.d.ts';

// Caché A: Mapeo de datos fijos (IP -> Equipo/Modelo/Usuario)
export const fixedMappingCache = new Map<string, MappingData>();

// Caché B: Conexiones activas (ID_Android -> Socket.ID)
export const activeConnections = new Map<string, string>();

let lastKnownTimestamp: string | undefined;

/**
 * Carga los datos críticos de Sheets y actualiza la caché A.
 */
async function loadAndSetCache() {
	try {
		const data = await getCriticalMappingData(SPREAD_SHEET_ID);

		data.forEach((row) => {
			const ip = row[8];

			if (ip) {
				// Mapea el ID_Android a un objeto de datos
				fixedMappingCache.set(ip, {
					index: row[0] ?? null,
					equipo: row[3] ?? 'N/A',
					modelo: row[4] ?? 'N/A',
					usuario: row[5] ?? 'N/A',
					correo: row[6] ?? 'N/A',
					aliasUsuario: row[7] ?? 'N/A',
					ip: ip,
					macAddress: row[9] ?? 'N/A',
					androidId: row[10] ?? 'N/A',
				} as MappingData);
			}
		});


		logger.info(`Caché de inventario cargada con ${fixedMappingCache.size} entradas.`);
	} catch (error) {
		logger.error(`Error al cargar los datos de Sheets: ${error}`);
	}
}

/**
 * Inicia el polling para revisar el timestamp de Google Sheets.
 */
export function startSheetsPolling(io: AppIO) {
	// Realiza la primera carga al iniciar
	loadAndSetCache();

	// Establece el intervalo para el polling del timestamp
	setInterval(async () => {
		try {
			const currentTimestamp = await getMetadataTimestamp(SPREAD_SHEET_ID);

			if (currentTimestamp && currentTimestamp !== lastKnownTimestamp) {
				logger.info('¡Timestamp de Sheets cambiado! Recargando caché de inventario...');
				await loadAndSetCache();
				lastKnownTimestamp = currentTimestamp;

				// Notificar a los clientes web sobre la actualización
				io.to(roomsName.WEB_CLIENT).emit(submittedEventWeb.INVENTORY_UPDATE_ALERT, { message: 'El inventario ha sido actualizado.'});
				logger.info('Notificación de actualización de inventario enviada a los clientes web.');
			}
		} catch (error) {
			logger.error(`Falló la revisión del timestamp en el polling: ${error}`);
		}
	}, POLLING_INTERVAL_MS);
}
