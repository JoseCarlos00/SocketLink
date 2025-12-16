import type { Server } from 'socket.io';
import { roomsName, submittedEventWeb } from '../constants.js';
import { socketLogger } from '../services/logger.js';
import type { Devices } from '../types/inventory.d.ts';

interface DeviceStatus {
	deviceId: string;
	online: boolean;
	battery: number;
	charging: boolean;
	lastSeen: number;
}

// Interfaz combinada para el frontend
export interface DeviceWithStatus extends Devices {
	online: boolean;
	battery?: number;
	charging?: boolean;
	lastSeen?: number;
	timeSinceLastSeen?: number;
}

export class DeviceStatusManager {
	private devices: Map<string, DeviceStatus> = new Map();
	private devicesMappingCache = new Map<string, Devices>();
	private io: Server | null = null;

	setIO(io: Server) {
		this.io = io;
	}

	// ============ MÉTODOS DE CACHE DE DISPOSITIVOS (DB) ============

	public setDeviceMapping(ip: string, device: Devices): void {
		this.devicesMappingCache.set(ip, device);
	}

	public getDeviceByIp(ip: string): Devices | undefined {
		return this.devicesMappingCache.get(ip);
	}

	public getSizeDevicesMappingCache(): number {
		return this.devicesMappingCache.size;
	}

	public getAllDevices(): Devices[] {
		return Array.from(this.devicesMappingCache.values());
	}

	// ============ MÉTODO PRINCIPAL PARA EL FRONTEND ============

	/**
	 * Combina devicesMappingCache (DB) con devices (estado en tiempo real)
	 * Este es el método que debes llamar desde tu API
	 */
	public getAllDevicesWithStatus(): DeviceWithStatus[] {
		const devicesList: DeviceWithStatus[] = [];

		// Iterar sobre todos los dispositivos de la DB
		for (const device of this.devicesMappingCache.values()) {
			const androidId = device.androidId;
			const status = androidId ? this.devices.get(androidId) : undefined;

			devicesList.push({
				// Datos de la DB
				...device,
				// Estado en tiempo real
				online: status?.online ?? false,
				battery: status?.battery,
				charging: status?.charging,
				lastSeen: status?.lastSeen,
				timeSinceLastSeen: status?.lastSeen ? Date.now() - status.lastSeen : undefined,
			});
		}

		return devicesList;
	}

	/**
	 * Obtiene el estado de un dispositivo específico por androidId
	 */
	public getDeviceStatusByAndroidId(androidId: string): DeviceWithStatus | undefined {
		// Buscar en devicesMappingCache
		const device = Array.from(this.devicesMappingCache.values()).find((d) => d.androidId === androidId);

		if (!device) return undefined;

		const status = this.devices.get(androidId);

		return {
			...device,
			online: status?.online ?? false,
			battery: status?.battery,
			charging: status?.charging,
			lastSeen: status?.lastSeen,
			timeSinceLastSeen: status?.lastSeen ? Date.now() - status.lastSeen : undefined,
		};
	}

	// ============ GESTIÓN DE ESTADO EN TIEMPO REAL ============

	updateFromHeartbeat(deviceId: string, battery: number, charging: boolean) {
		const now = Date.now();
		let device = this.devices.get(deviceId);

		if (!device) {
			// Dispositivo nuevo conectándose
			device = { deviceId, online: true, battery, charging, lastSeen: now };
			this.devices.set(deviceId, device);

			// Emitir solo si el dispositivo está en devicesMappingCache (existe en DB)
			if (this.isDeviceInCache(deviceId)) {
				this.emitToWeb('device:connected', { deviceId, battery, charging, timestamp: now });
			}
			return;
		}

		const wasOffline = !device.online;
		const batteryChanged = Math.abs(device.battery - battery) >= 5;
		const chargingChanged = device.charging !== charging;

		device.online = true;
		device.battery = battery;
		device.charging = charging;
		device.lastSeen = now;

		if (wasOffline) {
			this.emitToWeb('device:reconnected', { deviceId, battery, charging, timestamp: now });
		} else if (batteryChanged || chargingChanged) {
			this.emitToWeb('device:battery:update', { deviceId, battery, charging, timestamp: now });
		}
	}

	markAsDisconnected(deviceId: string) {
		const device = this.devices.get(deviceId);
		if (device && device.online) {
			device.online = false;
			this.emitToWeb('device:disconnected', {
				deviceId,
				lastSeen: device.lastSeen,
				timestamp: Date.now(),
			});
			socketLogger.warn(`[DeviceStatus] ${deviceId} marcado como desconectado`);
		}
	}

	markAsOnline(deviceId: string) {
		const device = this.devices.get(deviceId);

		if (device && !device.online) {
			device.online = true;
			this.emitToWeb('device:reconnected', {
				deviceId,
				battery: device.battery,
				charging: device.charging,
				timestamp: Date.now(),
			});
			socketLogger.info(`[DeviceStatus] ${deviceId} marcado como online`);
		}
	}

	getAllDevicesStatus() {
		return Array.from(this.devices.values()).map((d) => ({
			deviceId: d.deviceId,
			online: d.online,
			battery: d.battery,
			charging: d.charging,
			lastSeen: d.lastSeen,
			timeSinceLastSeen: Date.now() - d.lastSeen,
		}));
	}

	// ============ EMISIÓN DE EVENTOS ============

	private emitToWeb(event: string, data: any) {
		if (!this.io) return;
		this.io.to(roomsName.WEB_CLIENT).emit(event as any, data);
		socketLogger.debug(`[DeviceStatus] Emitido: ${event} - ${data.deviceId}`);
	}

	/**
	 * Emite evento genérico de datos modificados
	 * Úsalo cuando se modifique la BD (crear/actualizar/eliminar dispositivo)
	 */
	emitDataModified(reason?: string) {
		if (!this.io) return;

		this.io.to(roomsName.WEB_CLIENT).emit(submittedEventWeb.DATA_MODIFIED, {
			timestamp: Date.now(),
			reason: reason || 'Device data modified',
		});

		socketLogger.info(`[DeviceStatus] Emitido: data:modified - ${reason || 'unknown'}`);
	}

	// ============ UTILIDADES ============

	/**
	 * Verifica si un dispositivo existe en el cache (DB)
	 */
	private isDeviceInCache(androidId: string): boolean {
		return Array.from(this.devicesMappingCache.values()).some((d) => d.androidId === androidId);
	}

	/**
	 * Limpia dispositivos del Map de estado que no estén en la DB
	 * Útil para ejecutar periódicamente
	 */
	public cleanupOrphanedDevices() {
		const validAndroidIds = new Set(
			Array.from(this.devicesMappingCache.values())
				.map((d) => d.androidId)
				.filter(Boolean)
		);

		for (const [deviceId] of this.devices) {
			if (!validAndroidIds.has(deviceId)) {
				this.devices.delete(deviceId);
				socketLogger.info(`[DeviceStatus] Dispositivo huérfano eliminado: ${deviceId}`);
			}
		}
	}

	/**
	 * Sincroniza el estado inicial cuando el servidor inicia
	 * Marca como offline todos los dispositivos de la DB
	 */
	public initializeDevicesFromCache() {
		for (const device of this.devicesMappingCache.values()) {
			if (device.androidId && !this.devices.has(device.androidId)) {
				this.devices.set(device.androidId, {
					deviceId: device.androidId,
					online: false,
					battery: 0,
					charging: false,
					lastSeen: Date.now(),
				});
			}
		}
		socketLogger.info(`[DeviceStatus] ${this.devices.size} dispositivos inicializados como offline`);
	}
}

export const deviceStatusManager = new DeviceStatusManager();

// EJEMPLO DE USO:

// // Cuando creas un dispositivo nuevo en tu API
// export async function createDevice(deviceData: CreateDeviceInput) {
//   const newDevice = await db.insert(devices).values(deviceData);

//   // Notificar a todos los clientes web que deben refrescar
//   deviceStatusManager.emitDataModified('new device created');

//   return newDevice;
// }

// // Cuando actualizas un dispositivo
// export async function updateDevice(deviceId: string, updates: UpdateDeviceInput) {
//   const updated = await db.update(devices)
//     .set(updates)
//     .where(eq(devices.id, deviceId));

//   deviceStatusManager.emitDataModified(`device ${deviceId} updated`);

//   return updated;
// }

// // Cuando eliminas un dispositivo
// export async function deleteDevice(deviceId: string) {
//   await db.delete(devices).where(eq(devices.id, deviceId));

//   deviceStatusManager.emitDataModified(`device ${deviceId} deleted`);
// }
