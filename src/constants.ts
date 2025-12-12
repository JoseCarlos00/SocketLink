export const appToServerEvents  = {
	REGISTER_DEVICE: 'REGISTER_DEVICE',
	HEARTBEAT: 'HEARTBEAT',
} as const;

// Eventos que el servidor/web EMITE y la app Android escucha
export const serverToAppEvents  = {
	ALARM_ACTIVATE: 'ALARM_ACTIVATE',
	PING: 'PING',
	MESSAGE_RECEIVE: 'MESSAGE_RECEIVE',
	CHECK_FOR_UPDATE: 'CHECK_FOR_UPDATE',
	GET_DEVICE_INFO: 'GET_DEVICE_INFO',
	SET_MAINTENANCE_MODE: 'SET_MAINTENANCE_MODE',

	SETTINGS_UPDATED: 'SETTINGS_UPDATED', // *TODO: PENDIENTE DE IMPLEMENTAR EN LA APP*
} as const;

export const receivedEventWeb = {
	IDENTIFY_CLIENT: 'IDENTIFY_CLIENT',
	SEND_PING: 'SEND_PING',
	ALARM_ACTIVATE: 'ALARM_ACTIVATE',
	SEND_MESSAGE: 'SEND_MESSAGE',
	SEND_BROADCAST_MESSAGE: 'SEND_BROADCAST_MESSAGE',
	CHECK_FOR_UPDATE: 'CHECK_FOR_UPDATE',
	CHECK_FOR_UPDATE_BROADCAST: 'CHECK_FOR_ALL_UPDATE',
	GET_DEVICE_INFO: 'GET_DEVICE_INFO',
	SET_BROADCAST_MAINTENANCE_MODE: 'SET_MAINTENANCE_MODE',

	SET_SETTINGS: 'SET_SETTINGS', // *TODO: PENDIENTE DE IMPLEMENTAR EN LA APP*
} as const;

export const submittedEventWeb = {
	INVENTORY_UPDATE_ALERT: 'INVENTORY_UPDATE_ALERT',
	DEVICE_HEARTBEAT: 'DEVICE_HEARTBEAT',
} as const;


export const roomsName = {
	WEB_CLIENT: 'WEB_CLIENT',
	ANDROID_APP: 'ANDROID_APP',
} as const;


export const clientType = {
	WEB: 'WEB',
	ANDROID: 'ANDROID',
} as const;
;


const LIMIT_ROWS_SEARCH = 350;
export const SPREAD_SHEET_ID = '1jYpuNqcyb8RVOgGJ2tXOKZuJ8hnoFsq7Dp2hX8ddczM' as const;

export const SHEET_NAME = 'RF';
export const IP_COLUMN = `${SHEET_NAME}!I2:I${LIMIT_ROWS_SEARCH + 1}` as const;
export const ANDROID_ID_COLUMN = `${SHEET_NAME}!K` as const;
export const CRITICAL_MAPPING_RANGE = `${SHEET_NAME}!A2:K${LIMIT_ROWS_SEARCH + 1}` as const;


export const METADATA_RANGE = 'Metadatos!A1' as const;


// Frecuencia con la que Node.js revisará el timestamp (en milisegundos)
export const POLLING_INTERVAL_MS = 10000 as const; // Cada 10 segundos


export const REFRESH_TOKEN_COOKIE_NAME = 'jwt-refresh-token' as const; // La cookie HttpOnly que establece tu backend
export const ACCESS_TOKEN_COOKIE_NAME = 'jwt-access-token' as const;

