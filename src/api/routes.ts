import { Router } from 'express';
import { fetchInventoryFromGoogleSheet } from '../services/googleSheetService.js';
import { updateInventory, inventoryMaster } from '../socket/state.js';
import { API_SECRET_TOKEN } from '../../config.js';
import type { AppIO } from '../types/socketInterface.js';
import { roomsName, submittedEventWeb } from "../../consts.js";

export function createApiRoutes(io: AppIO) {
	const router = Router();

	router.get('/update-inventory-master', async (req, res) => {
		const token = req.header('X-Auth-Token');
		if (token !== API_SECRET_TOKEN) {
			return res.status(401).send({ status: 'ERROR', message: 'Acceso no autorizado.' });
		}

		try {
			const newInventory = await fetchInventoryFromGoogleSheet();
			updateInventory(newInventory);

			io.to(roomsName.WEB_CLIENT).emit('UPDATED_INVENTORY', inventoryMaster);

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
