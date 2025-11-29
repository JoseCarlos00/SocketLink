import type { receivedEventsApp, submittedEventsApp, receivedEventWeb } from '../../consts.js';
import type { RegisterDevicePayload } from './payloadsGetApp.d.ts';
import type {
	AlarmActivationPayload,
	IdentifyClientPayload,
	SendMessagePayload,
	SendAllMessagePayload,
	TargetedDevicePayload,
	WebCallback,
} from './payloadsGetWeb.d.ts';

import type { AlarmAck, AlarmPayload, GetDeviceInfoAck, MessageAck, MessagePayload, PingAck } from './payloadsSendApp.d.ts';

export interface ServerToClientEvents {
	[submittedEventsApp.ALARM]: (payload?: AlarmPayload, ack?: AlarmAck) => void;

	[submittedEventsApp.PING]: (ack?: PingAck) => void;

	[submittedEventsApp.MESSAGE]: (payload: MessagePayload, ack?: MessageAck) => void;

	[submittedEventsApp.CHECK_FOR_UPDATE]: () => void;

	[submittedEventsApp.GET_DEVICE_INFO]: (ack: GetDeviceInfoAck) => void;
}


export interface ClientToServerEvents {
	// Android
	[receivedEventsApp.REGISTER_DEVICE]: (payload: RegisterDevicePayload) => void;

	// Web
	[receivedEventWeb.IDENTIFY_CLIENT]: (payload: IdentifyClientPayload) => void;

	[receivedEventWeb.ALARM_ACTIVATION]: (payload: AlarmActivationPayload, ack: WebCallback) => void;

	[receivedEventWeb.SEND_MESSAGE]: (payload: SendMessagePayload, ack: WebCallback) => void;

	[receivedEventWeb.SEND_PING]: (payload: TargetedDevicePayload, ack: WebCallback) => void;

	[receivedEventWeb.CHECK_FOR_UPDATE]: (payload: TargetedDevicePayload, ack: WebCallback) => void;

	[receivedEventWeb.GET_DEVICE_INFO]: (payload: TargetedDevicePayload, ack: WebCallback) => void;

	[receivedEventWeb.CHECK_FOR_ALL_UPDATE]: (ack: WebCallback) => void;

	[receivedEventWeb.SEND_ALL_MESSAGE]: (payload: SendAllMessagePayload, ack: WebCallback) => void;
}
