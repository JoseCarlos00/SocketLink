import { google } from 'googleapis';
import { SERVICE_ACCOUNT } from '../config.js';
import { CRITICAL_MAPPING_RANGE, METADATA_RANGE, SPREAD_SHEET_ID, IP_COLUMN, SHEET_NAME, ANDROID_ID_COLUMN } from '../consts.js';
import type { MappingData } from '../types/inventory.d.ts'

const sheetsAuth = new google.auth.JWT(
  SERVICE_ACCOUNT.client_email,
  undefined,
  SERVICE_ACCOUNT.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

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
async function findRowIndexByIp(spreadsheetId: string, ipAddress: string): Promise<number | null> {
    const result = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: IP_COLUMN,
    });

    const rows = result.data.values || [];
    
    const headerOffset = 1;
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] === ipAddress) {
            // Devolvemos el índice de la fila en Google Sheets (basado en 1)
            return i + headerOffset;
        }
    }
    return null;
}

/**
 * Función principal para actualizar el androidId de un dispositivo por su IP.
 * @param ipAddress La IP Fija que identifica la fila a actualizar.
 * @param androidId El nuevo ID único del dispositivo.
 * @returns true si tiene éxito.
 */
export async function updateAndroidIdInSheets(ipAddress: string, androidId: string): Promise<boolean> {
    const rowIndex = await findRowIndexByIp(SPREAD_SHEET_ID, ipAddress);

    if (rowIndex === null) {
        console.warn(`[Sheets] No se puede actualizar: IP Fija ${ipAddress} no encontrada.`);
        return false;
    }

    // Calculamos el rango de la celda a actualizar: [Hoja]![Columna_ID_Android][Número_de_Fila]
    const rangeToUpdate = `${SHEET_NAME}!${ANDROID_ID_COLUMN}${rowIndex}`; // Ej: 'RF!J5'

    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREAD_SHEET_ID,
            range: rangeToUpdate,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [androidId] // El valor a escribir
                ],
            },
        });
        console.log(`[Sheets] androidId actualizado para ${ipAddress} en la fila ${rowIndex}.`);
        return true;
    } catch (error) {
        console.error(`[Sheets] Error al escribir androidId para ${ipAddress}:`, error);
        return false;
    }
}
