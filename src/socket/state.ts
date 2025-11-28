// Estructura de datos crítica en memoria

// 1. Mapa para conexiones activas: { DEVICE_ID: Socket_ID }
export const activeConnections = new Map();

// 2. Cache del Inventario Maestro (de Google Sheet)
export let inventoryMaster = [];

// Función para actualizar el inventario
export function updateInventory(newInventory) {
	inventoryMaster = newInventory;
}
