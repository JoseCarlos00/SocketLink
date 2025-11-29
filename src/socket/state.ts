import { Inventory } from "../types/inventory.js"

// 1. Mapa para conexiones activas: { DEVICE_ID: Socket_ID }
export const activeConnections = new Map();

// 2. Cache del Inventario Maestro (de Google Sheet)
export let inventoryMaster: Inventory[] = [];

// Función para actualizar el inventario
export function updateInventory(newInventory: Inventory[]) {
	inventoryMaster = newInventory;
}
