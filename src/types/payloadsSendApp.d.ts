// ===== ALARM =====
export interface AlarmPayload {
	durationSeconds?: number; // default 10
	deviceAlias?: string; // default "desconocido"
}

// Respuesta de la app: true = éxito, false = fallo
export type AlarmAck = (success: boolean) => void;

// ===== PING_ALARM =====
// No payload
// Respuesta: objeto con info del dispositivo o null
export interface PingAlarmResponse {
	androidId: string;
	ipAddress: string;
	appVersion: string;
}
export type PingAlarmAck = (response: PingAlarmResponse | null) => void;

// ===== MESSAGE =====
export interface MessagePayload {
	message: string;
	sender?: string; // default "Nuevo Mensaje"
}

// ===== CHECK_FOR_UPDATE =====
// No payload, no respuesta

// ===== GET_DEVICE_INFO =====
export interface DeviceInfoResponse {
	androidId: string;
	ipAddress: string;
	appVersion: string;
}
export type GetDeviceInfoAck = (info: DeviceInfoResponse | null) => void;
