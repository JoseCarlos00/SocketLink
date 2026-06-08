import type { Server } from 'socket.io';
import { roomsName, submittedEventWeb } from '../constants.js';
import { socketLogger } from '../services/logger.js';
import type { Devices } from '../types/inventory.d.ts';

interface DeviceStatus {
	deviceId: string;
	online: boolean;
	appVersion?: number;
}

// Interfaz combinada para el frontend
export interface DeviceWithStatus extends Devices {
	online: boolean;
	appVersion?: number;
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

	public cleanDeviceMappingCache(): void {
		this.devicesMappingCache.clear();
	}

	// ============ MÉTODO PRINCIPAL PARA EL FRONTEND ============

	/**
	 * Combina devicesMappingCache (DB) con devices (estado en tiempo real)
	 */
	public getAllDevicesWithStatus(): DeviceWithStatus[] {
		const devicesList: DeviceWithStatus[] = [];

		// Iterar sobre todos los dispositivos de la DB
		for (const device of this.devicesMappingCache.values()) {
			const androidId = device.androidId;
			const currentDevice = androidId ? this.devices.get(androidId) : undefined;

			devicesList.push({
				...device,
				online: currentDevice?.online ?? false,
				appVersion: currentDevice?.appVersion,
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

		const currentDevice = androidId ? this.devices.get(androidId) : undefined;

		return {
			...device,
			online: currentDevice?.online ?? false,
			appVersion: currentDevice?.appVersion,
		};
	}

	// ============ GESTIÓN DE ESTADO EN TIEMPO REAL ============
	public markAsDisconnected(deviceId: string) {
		const device = this.devices.get(deviceId);

		if (device && device.online) {
			device.online = false;

			this.emitToWeb('device:disconnected', {
				deviceId,
			});

			socketLogger.warn(`[DeviceStatus] ${deviceId} marcado como desconectado`);
		}
	}

	public markAsOnline(deviceId: string) {
		let device = this.devices.get(deviceId);

		// Si el dispositivo no existe en el mapa de estado (ej: registro nuevo post-inicio), lo creamos
		if (!device) {
			device = {
				deviceId,
				online: false,
			};

			this.devices.set(deviceId, device);
		}

		if (!device.online) {
			device.online = true;

			this.emitToWeb('device:connected', { deviceId });

			socketLogger.info(`[DeviceStatus] ${deviceId} marcado como online`);
		}
	}

	public addAppVersion(deviceId: string, version: number) {
		const device = this.devices.get(deviceId);

		if (device) {
			device.appVersion = version;
		}
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

		const webCLientRoom = this.io.sockets.adapter.rooms.get(roomsName.WEB_CLIENT);
		if (!webCLientRoom || webCLientRoom.size === 0) {
			socketLogger.warn('No hay clientes web conectados. No se emitirá el evento.');
			return;
		}

		this.io.to(roomsName.WEB_CLIENT).emit(submittedEventWeb.DATA_MODIFIED, {
			timestamp: Date.now(),
			reason: reason || 'Device data modified',
		});

		socketLogger.info(`[DeviceStatus] Emitido: data:modified a ${webCLientRoom.size} clientes web.`);
	}

	// ============ UTILIDADES ============

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
				});
			}
		}

		socketLogger.info(`[DeviceStatus] ${this.devices.size} dispositivos inicializados como offline`);
	}
}

export const deviceStatusManager = new DeviceStatusManager();
