// ===== ALARM =====
export interface AlarmPayload {
	durationSeconds?: number; // default 10
	deviceAlias?: string; // default "desconocido"
}

// Respuesta:
export interface AlarmResponse {
	status: 'OK' | 'ERROR';
	reason?: string;
}


export type AlarmAck = (response: AlarmResponse | null) => void;

// ===== PING_ALARM =====
// No payload
// Respuesta:
export interface PingResponse {
	status: 'PONG' | 'ERROR';
	reason?: string;
}
export type PingAck = (response: PingResponse | null) => void;

// ===== MESSAGE =====
export interface MessagePayload {
	message: string;
	sender?: string; // default "Nuevo Mensaje"
}

// Respuesta:
export interface MessageResponse {
	status: 'OK' | 'ERROR';
	reason?: string;
}

export type MessageAck = (response: MessageResponse | null) => void;

// ===== CHECK_FOR_UPDATE =====
// No payload, no respuesta

// ===== GET_DEVICE_INFO =====
export interface DeviceInfoResponse {
	androidId: string;
	ipAddress: string;
	appVersion: string;
}

export type GetDeviceInfoAck = (info: DeviceInfoResponse | null) => void;
