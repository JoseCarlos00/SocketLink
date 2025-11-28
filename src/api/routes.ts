import { Router } from 'express';
import { fetchInventoryFromGoogleSheet } from '../services/googleSheetService.js';
import { updateInventory, inventoryMaster } from '../socket/state.js';
import { API_SECRET_TOKEN } from '../../config.js';

export function createApiRoutes(io) {
	const router = Router();

	router.get('/actualizar-inventario-maestro', async (req, res) => {
		const token = req.header('X-Auth-Token');
		if (token !== API_SECRET_TOKEN) {
			return res.status(401).send({ status: 'ERROR', message: 'Acceso no autorizado.' });
		}

		try {
			const newInventory = await fetchInventoryFromGoogleSheet();
			updateInventory(newInventory);

			io.to('web_clients').emit('INVENTARIO_ACTUALIZADO', inventoryMaster);

			const webClientsCount = io.sockets.adapter.rooms.get('web_clients')?.size || 0;
			console.log(`Inventario actualizado y notificado a ${webClientsCount} clientes web.`);

			res.status(200).send({ status: 'OK', message: 'Inventario maestro actualizado.' });
		} catch (error) {
			console.error('Fallo al actualizar el inventario:', error.message);
			res.status(500).send({ status: 'ERROR', message: 'Error interno del servidor.' });
		}
	});

	return router;
}
