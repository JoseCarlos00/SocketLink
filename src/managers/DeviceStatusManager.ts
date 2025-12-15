// src/managers/DeviceStatusManager.ts
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

export class DeviceStatusManager {
	private devices: Map<string, DeviceStatus> = new Map();
	private devicesMappingCache = new Map<string, Devices>();
	private io: Server | null = null;

	setIO(io: Server) {
		this.io = io;
	}

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

	updateFromHeartbeat(deviceId: string, battery: number, charging: boolean) {
		const now = Date.now();
		let device = this.devices.get(deviceId);

		if (!device) {
			// Dispositivo nuevo
			device = { deviceId, online: true, battery, charging, lastSeen: now };
			this.devices.set(deviceId, device);
			this.emitToWeb('device:connected', { deviceId, battery, charging, timestamp: now });
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
			this.emitToWeb('device:disconnected', { deviceId, lastSeen: device.lastSeen, timestamp: Date.now() });
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
