import type { AppIO, AppSocket } from '../types/socketInterface.d.ts';
import { socketLogger } from '../services/logger.js';
import { appToServerEvents , receivedEventWeb } from '../constants.js';
import {
	handleDeviceDisconnect,
	handleDeviceRegistration,
} from './handlers/deviceHandler.js';

import {
	handleAlarm,
	handleCheckForAllUpdate,
	handleCheckForUpdate,
	handleGetDeviceInfo,
	handlePingAlarm,
	handleSendAllMessage,
	handleSendMessage,
	handleWebClientIdentification,
} from './handlers/webHandler.js';

import type { WebCallback } from '../types/payloadsGetWeb.d.ts'
import { handleHeartbeatDevice } from './handlers/heartbeat.handler.js'

function registerDeviceEventHandlers(socket: AppSocket) {
	socket.on(appToServerEvents.REGISTER_DEVICE, (data, ack) => {
		handleDeviceRegistration(socket, data, ack);
	});

	socket.on(appToServerEvents.HEARTBEAT, (data, ask)=> {
		handleHeartbeatDevice(socket, data, ask)
	})
}

function registerWebClientEventHandlers(socket: AppSocket, io: AppIO) {
	// Si el socket no tiene un usuario, significa que no es un cliente web autenticado.
	if (!socket.currentUser) {
		return;
	}


	const verifyAdminRole = (cb: WebCallback): boolean => {
		if (socket.currentUser?.role !== 'ADMIN') {
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
