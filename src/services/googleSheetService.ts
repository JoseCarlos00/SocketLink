import { google } from 'googleapis';
import { SERVICE_ACCOUNT } from '../config.js';
import { CRITICAL_MAPPING_RANGE, METADATA_RANGE } from '../consts.js';

import { activeConnections } from '../socket/state.js';
import { Inventory } from '../types/inventory.js';

const sheetsAuth = new google.auth.JWT(
  SERVICE_ACCOUNT.client_email,
  undefined,
  SERVICE_ACCOUNT.private_key,
  ['https://www.googleapis.com/auth/spreadsheets.readonly']
);

const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });


export async function fetchInventoryFromGoogleSheet(): Promise<Inventory[]> {
	// 🚨 Esta función es un placeholder 🚨
	// Aquí va la lógica real para llamar a tu API que expone los datos de Google Sheet.
	console.log('--- Llamando a la API de Google Sheet ---');

	// Ejemplo de formato esperado:
	return [
		{
			alias: 'Almacen_1',
			device_id: '4d6e9e4f5a',
			current_ip: '192.168.1.101',
			conectado: activeConnections.has('4d6e9e4f5a'),
		},
		{
			alias: 'Muelles_2',
			device_id: 'a1b2c3d4e5',
			current_ip: '192.168.1.102',
			conectado: activeConnections.has('a1b2c3d4e5'),
		},
		// ... más equipos
	];
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
