import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config } from './src/config.js';
import { initializeDatabase } from './src/models/db.js'
import { updateInventory } from './src/socket/state.js';
import { initializeSocketLogic } from './src/socket/connection.js';
import { fetchInventoryFromGoogleSheet } from './src/services/googleSheetService.js';
import type { ClientToServerEvents, ServerToClientEvents } from './src/types/serverEvents.js';

// Import Routes
import socketApiRoutes from './src/api/socket.route.js';
import authApiRoutes from './src/api/auth.route.js';

// 1. Inicializar la base de datos
initializeDatabase();

/**
 * Configura y devuelve una instancia de la aplicación Express.
 * @returns {express.Application} La aplicación Express configurada.
 */
function configureApp(): express.Application {
const app = express();
	app.use(express.json());
	return app;
}

/**
 * Inicializa y configura Socket.IO en el servidor HTTP.
 * @param {http.Server} server El servidor HTTP.
 * @returns {SocketIOServer} La instancia de Socket.IO configurada.
 */
function configureSocketIO(server: http.Server): SocketIOServer {
	const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
	cors: {
		origin: config.CORS_ORIGIN,
		methods: ['GET', 'POST'],
	},
});
	return io;
}

const app = configureApp();

/**
 * Configura y devuelve un servidor HTTP con la aplicación Express.
 * @param {express.Application} app La aplicación Express.
 * @returns {http.Server} El servidor HTTP configurado.
 */
const server = http.createServer(app);

const io = configureSocketIO(server);

// Routes
app.use('/api', socketApiRoutes(io));
app.use('/api/auth', authApiRoutes);

initializeSocketLogic(io);

async function startServer() {
	try {
		// Cargar inventario inicial
		const initialInventory = await fetchInventoryFromGoogleSheet();
		updateInventory(initialInventory);
		console.log('Inventario inicial cargado.');

		server.listen(config.PORT, () => {
			console.log(`Servidor Socket.IO/Express escuchando en el puerto ${config.PORT}`);
		});
	} catch (error) {
		console.error('Error fatal al iniciar el servidor:', error);
		process.exit(1);
	}
}

// Inicia el servidor
startServer();
