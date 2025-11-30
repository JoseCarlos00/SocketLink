export const receivedEventsApp = {
	REGISTER_DEVICE: 'REGISTER_DEVICE',
} as const;

export const submittedEventsApp = {
	ALARM: 'ALARM',
	PING: 'PING',
	MESSAGE: 'MESSAGE',
	CHECK_FOR_UPDATE: 'CHECK_FOR_UPDATE',
	GET_DEVICE_INFO: 'GET_DEVICE_INFO',
	UPDATE_DEVICE_STATUS: 'UPDATE_DEVICE_STATUS',
	LOCATION_UPDATE: 'LOCATION_UPDATE',
	SETTINGS_UPDATED: 'SETTINGS_UPDATED',
	ERROR_REPORT: 'ERROR_REPORT',
} as const;

export const receivedEventWeb = {
	IDENTIFY_CLIENT: 'IDENTIFY_CLIENT',
	SEND_PING: 'SEND_PING',
	ALARM_ACTIVATION: 'ALARM_ACTIVATION',
	ALARM_RESPONSE: 'ALARM_RESPONSE',
	SEND_MESSAGE: 'SEND_MESSAGE',
	MESSAGE_RESPONSE: 'MESSAGE_RESPONSE',
	SEND_ALL_MESSAGE: 'SEND_ALL_MESSAGE',
	CHECK_FOR_UPDATE: 'CHECK_FOR_UPDATE',
	CHECK_FOR_ALL_UPDATE: 'CHECK_FOR_ALL_UPDATE',
	GET_DEVICE_INFO: 'GET_DEVICE_INFO',
	UPDATE_DEVICE_STATUS: 'UPDATE_DEVICE_STATUS',
} as const;

export const submittedEventWeb = {
	UPDATED_INVENTORY: 'UPDATED_INVENTORY',
} as const;


export const roomsName = {
	WEB_CLIENT: 'WEB_CLIENT',
	ANDROID_CLIENT: 'ANDROID_CLIENT',
} as const;


export const clientType = {
	WEB: 'WEB',
	ANDROID: 'ANDROID',
} as const;


export const SPREAD_SHEET_ID = '1jYpuNqcyb8RVOgGJ2tXOKZuJ8hnoFsq7Dp2hX8ddczM' as const;

export const CRITICAL_MAPPING_RANGE = 'RF!C:J' as const;

export const METADATA_RANGE = 'Metadatos!A1' as const;

// Frecuencia con la que Node.js revisará el timestamp (en milisegundos)
export const POLLING_INTERVAL_MS = 10000 as const; // Cada 10 segundos
