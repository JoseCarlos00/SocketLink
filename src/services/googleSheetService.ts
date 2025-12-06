import { google } from 'googleapis';
import { SERVICE_ACCOUNT } from '../config.js';
import { googleSheetLogger as logger } from './logger.js';
import {
	CRITICAL_MAPPING_RANGE,
	METADATA_RANGE,
	SPREAD_SHEET_ID,
	IP_COLUMN,
	ANDROID_ID_COLUMN,
} from '../constants.js';
import type { MappingData } from '../types/inventory.d.ts';

const sheetsAuth = new google.auth.JWT(SERVICE_ACCOUNT.client_email, undefined, SERVICE_ACCOUNT.private_key, [
	'https://www.googleapis.com/auth/spreadsheets',
]);

const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });

export async function fetchInventoryFromGoogleSheet(): Promise<MappingData[][]> {
	const result = await sheets.spreadsheets.values.get({
		spreadsheetId: SPREAD_SHEET_ID,
		range: CRITICAL_MAPPING_RANGE,
	});

	// Retorna los valores o un array vacío si no hay datos
	return result.data.values || [];
}

/**
 * Obtiene todos los datos críticos de mapeo de la hoja.
 * @returns Promesa con los valores de la hoja.
 */
export async function getCriticalMappingData(spreadsheetId: string) {
	const result = await sheets.spreadsheets.values.get({
		spreadsheetId: spreadsheetId,
		range: CRITICAL_MAPPING_RANGE,
	});

	// Retorna los valores o un array vacío si no hay datos
	return result.data.values || [];
}

/**
 * Obtiene el timestamp de la celda de metadatos.
 * @returns Promesa con el valor del timestamp como string.
 */
export async function getMetadataTimestamp(spreadsheetId: string): Promise<string | undefined> {
	const result = await sheets.spreadsheets.values.get({
		spreadsheetId: spreadsheetId,
		range: METADATA_RANGE,
	});
	// El resultado es un array de arrays, tomamos el primer valor
	return result.data.values?.[0]?.[0];
}

/**
 * Busca la fila de un dispositivo por su IP Fija.
 * @param ipAddress La IP a buscar.
 * @returns El índice de la fila basado en 1, o null si no se encuentra.
 */
export async function findRowIndexByIp(spreadsheetId: string, ipAddress: string): Promise<number | null> {
	try {
		const result = await sheets.spreadsheets.values.get({
			spreadsheetId: spreadsheetId,
			range: IP_COLUMN,
		});

		const rows = result.data.values || [];

		const headerOffset = 0;

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			if (row[0] === ipAddress) {
				return i + headerOffset;
			}
		}
		return null;
	} catch (error) {
		logger.error(`Error al buscar el índice por IP: ${error}`);
		throw new Error(`Error al buscar el índice por IP.`);
	}
}

/**
 * Función principal para actualizar el androidId de un dispositivo por su IP.
 * @param ipAddress La IP Fija que identifica la fila a actualizar.
 * @param androidId El nuevo ID único del dispositivo.
 * @returns true si tiene éxito.
 */
export async function updateAndroidIdInSheets(rowIndex: string, ipAddress: string, androidId: string): Promise<boolean> {
	if (rowIndex === null) {
		logger.warn(`No se puede actualizar: IP Fija ${ipAddress} no encontrada.`);
		return false;
	}

	// Calculamos el rango de la celda a actualizar: [Hoja]![Columna_ID_Android][Número_de_Fila]
	const rangeToUpdate = `${ANDROID_ID_COLUMN}${rowIndex}`; // Ej: 'RF!J5'

	try {
		await sheets.spreadsheets.values.update({
			spreadsheetId: SPREAD_SHEET_ID,
			range: rangeToUpdate,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [
					[androidId], // El valor a escribir
				],
			},
		});
		logger.info(`androidId actualizado para ${ipAddress} en la fila ${rangeToUpdate}.`);
		return true;
	} catch (error) {
		logger.error(`Error al escribir androidId para ${ipAddress}: ${error}`);
		return false;
	}
}
