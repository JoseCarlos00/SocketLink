import { Router } from 'express';
import { roomsName, submittedEventWeb } from "../consts.js";

import { fetchInventoryFromGoogleSheet } from '../services/googleSheetService.js';
import { updateInventory, inventoryMaster } from '../socket/state.js';
import { checkAdminRole } from '../middlewares/auth.middleware.js';
import type { AppIO } from '../types/socketInterface.js';

export default function createApiRoutes(io: AppIO) {
	const router = Router();

	router.get('admin/update-inventory-master', checkAdminRole, async (req, res) => {
		try {
			const newInventory = await fetchInventoryFromGoogleSheet();
			updateInventory(newInventory);

			io.to(roomsName.WEB_CLIENT).emit(submittedEventWeb.INVENTORY_UPDATE_ALERT);

			const webClientsCount = io.sockets.adapter.rooms.get(roomsName.WEB_CLIENT)?.size || 0;
			console.log(`Inventario actualizado y notificado a ${webClientsCount} ${roomsName.WEB_CLIENT}.`);

			res.status(200).send({ status: 'OK', message: 'Inventario maestro actualizado.' });
		} catch (error: any) {
			console.error('Fallo al actualizar el inventario:', error.message);
			res.status(500).send({ status: 'ERROR', message: 'Error interno del servidor.' });
		}
	});

	return router;
}
