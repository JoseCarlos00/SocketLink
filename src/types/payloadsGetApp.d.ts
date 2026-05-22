// ===== REGISTER_DEVICE =====
export interface RegisterDevicePayload {
	androidId: string;
	ipAddress: string;
	appVersion: string;
}

export interface RegisterDeviceAck {
    (response: 
        | { status: 'OK'; equipo: string }
        | { status: 'ERROR'; reason: string }
        | null
    ): void;
}
