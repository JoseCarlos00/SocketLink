// ===== REGISTER_DEVICE =====
export interface RegisterDevicePayload {
	androidId: string;
	ipAddress: string;
	appVersion: string;
}

export interface RegisterDeviceAck {
	(response: { status: 'OK' | 'ERROR'; reason?: string } | null): void;
}

// ==== HEARTBEAT ====

// Dispositivo Android → Servidor
export interface HeartbeatPayload {
  deviceId: string;          // ID único del dispositivo
  battery: number;           // 0-100
  charging: boolean;         // true si está cargando
  timestamp: number;         // Date.now() del dispositivo
}

// Servidor responde (opcional, puede ser sin ACK)
export interface HeartbeatAck {
	(response: { status: 'OK' | 'ERROR'; serverTime?: number; } | null): void;
}
