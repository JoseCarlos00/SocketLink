import type { MessagePayload, AlarmPayload } from './payloadsSendApp.d.ts';
import type { DeviceInfoResponse } from './payloadsSendApp.d.ts';

/**
 * Interfaz para la respuesta del callback que se envía desde el servidor
 * al cliente web después de procesar un evento.
 */
export interface CallbackResponse {
	status: 'OK' | 'ERROR' | 'WARN';
	message: string;
	data?: DeviceInfoResponse | Record<string, unknown>;
}

export type ClientType = 'WEB' | 'ANDROID';

/**
 * Tipo para la función de callback que el cliente web proporciona.
 */
export type WebCallback = (response: CallbackResponse) => void;

export interface IdentifyClientPayload {
	clientType: ClientType;
}

export interface TargetedDevicePayload {
	target_device_id: string;
}

export type AlarmActivationPayload = TargetedDevicePayload & AlarmPayload;
export type SendMessagePayload = TargetedDevicePayload & { dataMessage: MessagePayload };
export type SendAllMessagePayload = { dataMessage: MessagePayload };
