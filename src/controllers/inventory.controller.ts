import { activeConnections } from '../socket/state.js';
import { inventoryLogger as logger } from '../services/logger.js';
import { deviceStatusManager } from '../managers/DeviceStatusManager.js'

/**
 * Obtiene la lista de todos los dispositivos registrados desde la caché.
 * @returns Array de objetos simplificados para la web.
 */
export function getRegisteredDevicesList(req: any, res: any) {
	try {

		const devices = deviceStatusManager.getAllDevices();

		// Transforma el Map a un array de objetos para la respuesta JSON.
		const devicesList = devices.map((device) => ({
			id: device.androidId ?? `index-${device.index}`,
			androidId: device.androidId,
			equipo: device.equipo,
			modelo: device.modelo,
			usuario: device.usuario,
			correo: device.correo,
			aliasUsuario: device.aliasUsuario,
			ipAddress: device.ip,
			macAddress: device.macAddress,
			online: device.androidId ? activeConnections.has(device.androidId) : false,
		}));

		logger.info(`Se ha solicitado la lista de inventario. Total de dispositivos en caché: ${devicesList.length}`);
		res.status(200).json(devicesList);
	} catch (error) {
		logger.error(`Error al obtener la lista de dispositivos del inventario: ${error}`);
		res.status(500).json({ message: 'Error interno del servidor' });
  }
}
