import { receivedEventsApp, receivedEventWeb } from '../../consts.js';
import { handleDeviceRegistration, handleDeviceInfo, handleDeviceDisconnect } from './handlers/deviceHandler.js';
import {
	handleWebClientIdentification,
	handleAlarm,
	handleSendMessage,
	handlePingAlarm,
	handleCheckForUpdate,
	handleGetDeviceInfo,
	handleCheckForAllUpdate,
	handleSendAllMessage
} from './handlers/webHandler.js';


export function initializeSocketLogic(io) {
	io.on('connection', (socket) => {
		console.log(`Cliente conectado: ${socket.id}`);

		// Eventos de dispositivos Android
		socket.on(receivedEventsApp.REGISTER_DEVICE, (data) => handleDeviceRegistration(socket, data));
		socket.on(receivedEventsApp.DEVICE_INFO, (data) => handleDeviceInfo(socket, data));

		// Eventos de clientes Web
		socket.on(receivedEventWeb.IDENTIFY_CLIENT, (payload) => handleWebClientIdentification(socket, payload));
		socket.on(receivedEventWeb.ALARM_ACTIVATION, (data, cb) => handleAlarm(io, data, cb));
		socket.on(receivedEventWeb.SEND_MESSAGE, (data, cb) => handleSendMessage(io, data, cb));
		socket.on(receivedEventWeb.SEND_PING, (data, cb) => handlePingAlarm(io, data, cb));
		socket.on(receivedEventWeb.CHECK_FOR_UPDATE, (data, cb) => handleCheckForUpdate(io, data, cb));
		socket.on(receivedEventWeb.GET_DEVICE_INFO, (data, cb) => handleGetDeviceInfo(io, data, cb));

		/** difusión (broadcast) a una sala (room)  */
		socket.on(receivedEventWeb.CHECK_FOR_ALL_UPDATE, (cb) => handleCheckForAllUpdate(io, cb));
		socket.on(receivedEventWeb.SEND_ALL_MESSAGE, (data, cb) => handleSendAllMessage(io,data, cb))

		// Evento de desconexión general
		socket.on('disconnect', () => {
			handleDeviceDisconnect(socket); // Intenta limpiarlo como dispositivo
			console.log(`Cliente desconectado: ${socket.id}.`);
		});
	});
}
