import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express'

import swaggerSpec  from './src/swagger.js';
import { config } from './src/config.js';
import { startSheetsPolling, updateInventory } from './src/socket/state.js';
import { initializeDatabase } from './src/models/db.js'
import { initializeSocketLogic } from './src/socket/connection.js';
import { fetchInventoryFromGoogleSheet } from './src/services/googleSheetService.js';

import type { ClientToServerEvents, ServerToClientEvents } from './src/types/serverEvents.js';

// Import Middlewares
import { socketAuthMiddleware } from './src/middlewares/socket.auth.middleware.js';
import { checkSuperAdminRole } from "./src/middlewares/auth.middleware.js";
import { verifyToken } from './src/middlewares/verifyToken.js';

// Import Routes
import socketApiRoutes from './src/api/socket.route.js';
import authApiRoutes from './src/api/auth.route.js';
import usersApiRoutes from './src/api/users.route.js';

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

// Aplicar middleware de autenticación a todas las conexiones de Socket.IO
io.use(socketAuthMiddleware);

// Routes

app.use('/api/auth', authApiRoutes);
app.use('/api/socket', verifyToken, socketApiRoutes(io));
app.use('/api/admin/users', verifyToken, checkSuperAdminRole, usersApiRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

initializeSocketLogic(io);

async function startServer() {
	try {
		// 1. Cargar inventario inicial (PRIMERA CARGA DE CACHÉ)
		const initialInventory = await fetchInventoryFromGoogleSheet();
		updateInventory(initialInventory); // Función que establece fixedMappingCache.set(...)
		console.log('Inventario inicial cargado.');

		// 2. Iniciar el Polling:
		// Ahora, fixedMappingCache ya tiene datos. startSheetsPolling solo iniciará el temporizador
		// para monitorear el timestamp, sin necesidad de hacer una doble carga inicial.
		startSheetsPolling();
		console.log('Monitoreo de Google Sheets (Polling) iniciado.');

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
