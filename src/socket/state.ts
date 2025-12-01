import { getCriticalMappingData, getMetadataTimestamp } from '../services/googleSheetService.js';
import { SPREAD_SHEET_ID, POLLING_INTERVAL_MS } from '../consts.js';
import type {  MappingData } from '../types/inventory.d.ts';

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
			const ip = row[5];

			if (ip) {
				// Mapea el ID_Android a un objeto de datos
				fixedMappingCache.set(ip, {
					androidId: row[7] ?? 'N/A',
					equipo: row[0] ?? 'N/A',
					modelo: row[1] ?? 'N/A',
					usuario: row[2] ?? 'N/A',
					correo: row[3] ?? 'N/A',
					aliasUsuario: row[4] ?? 'N/A',
					ip: ip,
					macAddress: row[6] ?? 'N/A',
				} as MappingData);
			}
		});

		console.log(`[Cache] Caché A cargada con ${fixedMappingCache.size} entradas.`);
		// console.log(fixedMappingCache.size > 0 ? fixedMappingCache : "Vacío");
		
	} catch (error) {
		console.error('[Cache Error] Error al cargar los datos de Sheets:', error);
	}
}

/**
 * Inicia el polling para revisar el timestamp de Google Sheets.
 */
export function startSheetsPolling() {
	// Realiza la primera carga al iniciar
	loadAndSetCache();

	// Establece el intervalo para el polling del timestamp
	setInterval(async () => {
		try {
			const currentTimestamp = await getMetadataTimestamp(SPREAD_SHEET_ID);

			if (currentTimestamp && currentTimestamp !== lastKnownTimestamp) {
				console.log('[Polling] ¡Timestamp cambiado! Recargando caché A...');
				await loadAndSetCache();
				lastKnownTimestamp = currentTimestamp;
			}
		} catch (error) {
			console.error('[Polling Error] Falló la revisión del timestamp:', error);
		}
	}, POLLING_INTERVAL_MS);
}

