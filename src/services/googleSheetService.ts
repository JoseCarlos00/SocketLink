import { activeConnections } from '../socket/state.js';
import { Inventory } from '../types/inventory.js'

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
