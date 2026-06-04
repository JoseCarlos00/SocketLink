import type { Request, Response } from 'express';
import { inventoryLogger as logger } from '../services/logger.js';
import { deviceStatusManager } from '../managers/DeviceStatusManager.js';

/**
 * Obtiene la lista de todos los dispositivos registrados desde la caché.
 * @returns Array de objetos simplificados para la web.
 */
export function getAllDeviceList(_: Request, res: Response) {
	try {
			const devicesWithStatus = deviceStatusManager.getAllDevicesWithStatus();
	
			// Transformar al formato que espera el frontend
			const devicesList = devicesWithStatus.map((device) => ({
				id: device.androidId ?? `index-${device.index}`,
				androidId: device.androidId,
				equipo: device.equipo,
				modelo: device.modelo,
				usuario: device.usuario,
				correo: device.correo,
				aliasUsuario: device.aliasUsuario,
				ipAddress: device.ip,
				macAddress: device.macAddress,
			
				online: device.online,
			}));
			
			res.json({
				success: true,
				data: devicesList,
				timestamp: Date.now(),
			});
		} catch (error) {
			logger.error('[API] Error fetching devices:', error);
			res.status(500).json({
				success: false,
				error: 'Error al obtener dispositivos',
			});
		}
}

export function getDeviceById(req: Request, res: Response) {
	try {
		const { androidId } = req.params;
		const device = deviceStatusManager.getDeviceStatusByAndroidId(androidId);

		if (!device) {
			return res.status(404).json({
				success: false,
				error: 'Dispositivo no encontrado',
			});
		}

		res.json({
			success: true,
			data: {
				id: device.androidId ?? `index-${device.index}`,
				androidId: device.androidId,
				equipo: device.equipo,
				modelo: device.modelo,
				usuario: device.usuario,
				correo: device.correo,
				aliasUsuario: device.aliasUsuario,
				ipAddress: device.ip,
				macAddress: device.macAddress,

				online: device.online,
			},
			timestamp: Date.now(),
		});
	} catch (error) {
		logger.error('[API] Error fetching device:', error);
		res.status(500).json({
			success: false,
			error: 'Error al obtener dispositivo',
		});
	}
}
