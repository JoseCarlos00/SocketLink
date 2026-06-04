import type { AppIO, AppSocket } from '../types/socketInterface.d.ts';
import { socketLogger } from '../services/logger.js';
import { appToServerEvents , receivedEventWeb } from '../constants.js';
import {
	handleDeviceDisconnect,
	handleDeviceRegistration,
} from './handlers/deviceHandler.js';

import {
	handleAlarm,
	handleGetDeviceInfo,
	handlePingAlarm,
	handleWebClientIdentification,
} from './handlers/web/webHandler.js';

import { handleCheckForUpdate, handleCheckForAllUpdate } from './handlers/web/checkForUpdate.handler.js';
import { handleSendMessage, handleSendAllMessage } from './handlers/web/sendMessage.handler.js';

import type { WebCallback } from '../types/payloadsGetWeb.d.ts'
import { handleSetMaintenanceMode } from './handlers/maintenance.handler.js'

function registerDeviceEventHandlers(socket: AppSocket) {
	socket.on(appToServerEvents.REGISTER_DEVICE, (data, ack) => {
		handleDeviceRegistration(socket, data, ack);
	});

	socket.on(appToServerEvents.PONG, (payload) => {
		socketLogger.debug(`[Device] PONG recibido de ${socket.data.deviceId}: ${payload?.status}`);
	});
}

function registerWebClientEventHandlers(socket: AppSocket, io: AppIO) {
	// Si el socket no tiene un usuario, significa que no es un cliente web autenticado.
	if (!socket.currentUser) {
		return;
	}


	const verifyAdminRole = (cb: WebCallback): boolean => {
		const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];

		if (!socket.currentUser?.role || !allowedRoles.includes(socket.currentUser?.role)) {
			cb?.({ status: 'FORBIDDEN', message: 'Acceso denegado: solo para administradores.' });
			return true;
		}

		return false;
	};

	socket.on(receivedEventWeb.IDENTIFY_CLIENT, (payload) => handleWebClientIdentification(socket, payload));
	
	socket.on(receivedEventWeb.ALARM_ACTIVATE, (data, cb) => handleAlarm(io, data, cb));
	socket.on(receivedEventWeb.SEND_MESSAGE, (data, cb) => handleSendMessage(io, data, cb));
	socket.on(receivedEventWeb.SEND_PING, (data, cb) => handlePingAlarm(io, data, cb));
	socket.on(receivedEventWeb.GET_DEVICE_INFO, (data, cb) => handleGetDeviceInfo(io, data, cb));

	socket.on(receivedEventWeb.CHECK_FOR_UPDATE, (data, cb) => {
		if (verifyAdminRole(cb)) return;
		handleCheckForUpdate(io, data, cb);
	});


	socket.on(receivedEventWeb.CHECK_FOR_UPDATE_BROADCAST, (cb) => {
		if (verifyAdminRole(cb)) return;
		handleCheckForAllUpdate(io, cb);
	});

	socket.on(receivedEventWeb.SEND_BROADCAST_MESSAGE, (data, cb) => {
		if (verifyAdminRole(cb)) return;
		handleSendAllMessage(io, data, cb);
	});

	socket.on(receivedEventWeb.SET_BROADCAST_MAINTENANCE_MODE, (data, cb) => {
		if (verifyAdminRole(cb)) return;
		handleSetMaintenanceMode(io, data, cb);
	});
}

export function initializeSocketLogic(io: AppIO) {
	io.on('connection', (socket: AppSocket) => {
		socketLogger.info(`Nuevo socket conectado. ID: ${socket.id}`);

		registerDeviceEventHandlers(socket);
		registerWebClientEventHandlers(socket, io);

		socket.on('disconnect', () => {
			handleDeviceDisconnect(socket);
			socketLogger.warn(`Socket desconectado. ID: ${socket.id}`);
		});
	});
}
