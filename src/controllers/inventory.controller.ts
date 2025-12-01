import { activeConnections, fixedMappingCache } from '../socket/state.js';

/**
 * Obtiene la lista de todos los dispositivos registrados desde la caché.
 * @returns Array de objetos simplificados para la web.
 */
export function getRegisteredDevicesList(req: any, res: any) {
	try {
		// Transforma el Map a un array de objetos para la respuesta JSON.
		const devicesList = Array.from(fixedMappingCache.values()).map((device) => ({
			id: device.androidId, // El ID que la web enviará como target_device_id
			equipo: device.equipo,
			modelo: device.modelo,
			usuario: device.usuario,
			correo: device.correo,
			aliasUsuario: device.aliasUsuario,
			ip: device.ip,
			macAddress: device.macAddress,
			isConnected: activeConnections.has(device.androidId), // Muestra el estado en tiempo real
		}));

		res.status(200).json(devicesList);
	} catch (error) {
    console.error('Inventory error:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
  }
}
