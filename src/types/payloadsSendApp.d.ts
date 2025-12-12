// ===== ALARM =====
export interface AlarmPayload {
	durationSeconds?: number; // default 10
	deviceAlias?: string; // default "desconocido"
}

// Status
type ResponseSts = 'OK' | 'ERROR';


// Respuesta:
export interface AlarmResponse {
	status: ResponseSts;
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
	status: ResponseSts;
	reason?: string;
}

export type MessageAck = (response: MessageResponse | null) => void;

// ===== CHECK_FOR_UPDATE =====
export type CheckForUpdateAck = (response: ResponseSts | null) => void;

// ===== GET_DEVICE_INFO =====
export interface DeviceInfoResponse {
	androidId: string;
	ipAddress: string;
	appVersion: string;
}


// MAINTENANCE MODE

interface MaintenanceModeResponse {
	status: ResponseSts;
	reason?: string;
	message?: string;
}

export type MaintenanceModeAck = (response: MaintenanceModeResponse) => void;

export interface MaintenanceModePayload {
	untilTimestampMs: number; // Timestamp cuando terminará el mantenimiento
}

export type GetDeviceInfoAck = (info: DeviceInfoResponse | null) => void;
