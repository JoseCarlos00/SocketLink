import type { appToServerEvents, serverToAppEvents, receivedEventWeb, submittedEventWeb } from '../constants.ts';
import type { Inventory } from './inventory.js';
import type { RegisterDevicePayload, RegisterDeviceAck, HeartbeatPayload, HeartbeatAck } from './payloadsGetApp.d.ts';

import type {
	AlarmActivationPayload,
	IdentifyClientPayload,
	SendMessagePayload,
	SendAllMessagePayload,
	TargetedDevicePayload,
	WebCallback,
} from './payloadsGetWeb.d.ts';

import type {
	AlarmAck,
	AlarmPayload,
	GetDeviceInfoAck,
	MessageAck,
	MessagePayload,
	PingAck,
	MaintenanceModeAck,
	MaintenanceModePayload,
	CheckForUpdateAck,
} from './payloadsSendApp.d.ts';

type SubmittedEventWebKeys = keyof typeof submittedEventWeb;

export interface ServerToClientEvents {
	// Android
	[serverToAppEvents.ALARM_ACTIVATE]: (payload?: AlarmPayload, ack: AlarmAck) => void;

	[serverToAppEvents.PING]: (payload: null, ack: PingAck) => void;

	[serverToAppEvents.MESSAGE_RECEIVE]: (payload: MessagePayload, ack: MessageAck) => void;

	[serverToAppEvents.CHECK_FOR_UPDATE]: (payload: null, ack: CheckForUpdateAck) => void;

	[serverToAppEvents.GET_DEVICE_INFO]: (payload: null, ack: GetDeviceInfoAck) => void;

	[serverToAppEvents.SET_MAINTENANCE_MODE]: (payload: MaintenanceModePayload, ack: MaintenanceModeAck) => void;

	// Web
	[submittedEventWeb.INVENTORY_UPDATE_ALERT]: (payload?: { message: string }) => void;

	[submittedEventWeb.DEVICE_HEARTBEAT]: (payload: HeartbeatPayload) => void;
}

export interface ClientToServerEvents {
	// Android
	[appToServerEvents.REGISTER_DEVICE]: (payload: RegisterDevicePayload, ack: RegisterDeviceAck) => void;

	[appToServerEvents.HEARTBEAT]: (payload: HeartbeatPayload, ack: HeartbeatAck) => void;

	// Web
	[receivedEventWeb.IDENTIFY_CLIENT]: (payload: IdentifyClientPayload) => void;

	[receivedEventWeb.ALARM_ACTIVATE]: (payload: AlarmActivationPayload, ack: WebCallback) => void;

	[receivedEventWeb.SEND_MESSAGE]: (payload: SendMessagePayload, ack: WebCallback) => void;

	[receivedEventWeb.SEND_PING]: (payload: TargetedDevicePayload, ack: WebCallback) => void;

	[receivedEventWeb.CHECK_FOR_UPDATE]: (payload: TargetedDevicePayload, ack: WebCallback) => void;

	[receivedEventWeb.GET_DEVICE_INFO]: (payload: TargetedDevicePayload, ack: WebCallback) => void;

	[receivedEventWeb.CHECK_FOR_UPDATE_BROADCAST]: (ack: WebCallback) => void;

	[receivedEventWeb.SEND_BROADCAST_MESSAGE]: (payload: SendAllMessagePayload, ack: WebCallback) => void;

	[receivedEventWeb.SET_BROADCAST_MAINTENANCE_MODE]: (payload: MaintenanceModePayload, ack: WebCallback) => void;
}
