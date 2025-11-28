import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

import { PORT, CORS_ORIGIN } from './config.js';
import { updateInventory } from './src/socket/state.js';
import { initializeSocketLogic } from './src/socket/connection.js';
import { createApiRoutes } from './src/api/routes.js';
import { fetchInventoryFromGoogleSheet } from './src/services/googleSheetService.js';

// --- 1. Configuración del Servidor ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: CORS_ORIGIN,
		methods: ['GET', 'POST'],
	},
});

// --- 2. Middlewares de Express ---
app.use(express.json());
app.use('/api', createApiRoutes(io)); // Montar las rutas de la API

// --- 3. Lógica de Socket.IO ---
initializeSocketLogic(io);

// --- 4. Inicio del Servidor ---
async function startServer() {
	try {
		// Cargar inventario inicial
		const initialInventory = await fetchInventoryFromGoogleSheet();
		updateInventory(initialInventory);
		console.log('Inventario inicial cargado.');

		server.listen(PORT, () => {
			console.log(`Servidor Socket.IO/Express escuchando en el puerto ${PORT}`);
		});
	} catch (error) {
		console.error('Error fatal al iniciar el servidor:', error);
		process.exit(1);
	}
}

startServer();
