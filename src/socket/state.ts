import { getCriticalMappingData, getMetadataTimestamp } from '../services/googleSheetService.js';
import { SPREAD_SHEET_ID, POLLING_INTERVAL_MS } from '../constants.js';
import { cacheLogger as logger } from '../services/logger.js';
import type { AppIO } from '../types/socketInterface.d.ts';
import { deviceStatusManager } from '../managers/DeviceStatusManager.js'


// Caché B: Conexiones activas (ID_Android -> Socket.ID)
export const activeConnections = new Map<string, string>();

let lastKnownTimestamp: string | undefined;

/**
 * Carga los datos críticos de Sheets y actualiza la caché A.
 * También obtiene y establece la marca de tiempo inicial de los metadatos.
*/
export async function loadAndSetCache() {
	try {
		logger.info('Iniciando carga de la caché de inventario desde Google Sheets...');
		
		const data = await getCriticalMappingData(SPREAD_SHEET_ID);
		
		data.forEach((row) => {
			const ip = row[8];
			const columnIndex = row[0];
			
			// Caché A: Mapeo de datos fijos (IP -> Equipo/Modelo/Usuario)
			if (ip && columnIndex) {
				deviceStatusManager.setDeviceMapping(ip, {
					index: columnIndex,
					equipo: row[3] ?? 'N/A',
					modelo: row[4] ?? 'N/A',
					usuario: row[5] ?? 'N/A',
					correo: row[6] ?? 'N/A',
					aliasUsuario: row[7] ?? null,
					ip,
					macAddress: row[9] ?? 'N/A',
					androidId: row[10] ?? null,
				});
			}
		});

		deviceStatusManager.initializeDevicesFromCache();


		// Después de cargar los datos, obtenemos el timestamp para evitar una recarga inmediata.
		lastKnownTimestamp = await getMetadataTimestamp(SPREAD_SHEET_ID);
		logger.info(
			`Caché de inventario cargada con ${deviceStatusManager.getSizeDevicesMappingCache()} entradas. Timestamp inicial: ${lastKnownTimestamp}`
		);
	} catch (error) {
		logger.error(`Error crítico al cargar la caché de inventario: ${error}`);
		throw error; // Relanzamos el error para que el servidor no inicie si la caché falla.
	}
}

/**
 * Inicia el polling para revisar el timestamp de Google Sheets.
 * Esta función debe llamarse DESPUÉS de que el servidor esté escuchando.
 */
export function startSheetsPolling(io: AppIO) {
	setInterval(async () => {
		try {
			const currentTimestamp = await getMetadataTimestamp(SPREAD_SHEET_ID);

			if (currentTimestamp && currentTimestamp !== lastKnownTimestamp) {
				logger.info(`Timestamp de Sheets cambiado (${lastKnownTimestamp} -> ${currentTimestamp}). Recargando caché...`);
				await loadAndSetCache();

				deviceStatusManager.emitDataModified();
				logger.info('Notificación de actualización de inventario enviada a los clientes web.');
			}
		} catch (error) {
			logger.error(`Falló la revisión del timestamp en el polling: ${error}`);
		}
	}, POLLING_INTERVAL_MS);
}
