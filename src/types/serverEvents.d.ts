export interface ServerToClientEvents {
	ALARM: (payload?: AlarmPayload, ack?: AlarmAck) => void;

	PING_ALARM: (ack?: PingAlarmAck) => void;

	MESSAGE: (payload: MessagePayload) => void;

	CHECK_FOR_UPDATE: () => void;

	GET_DEVICE_INFO: (ack: GetDeviceInfoAck) => void;
}


export interface ClientToServerEvents {
	REGISTER_DEVICE: (payload: RegisterDevicePayload) => void;
}
