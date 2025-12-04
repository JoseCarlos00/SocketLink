import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express'
import cors from 'cors';

import Logger from './src/services/logger.js';
import swaggerSpec  from './src/swagger.js';
import { config } from './src/config.js';
import { startSheetsPolling } from './src/socket/state.js';
import { initializeDatabase } from './src/models/db.js'
import { initializeSocketLogic } from './src/socket/connection.js';

import type { ClientToServerEvents, ServerToClientEvents } from './src/types/serverEvents.js';

// Import Middlewares
import { socketAuthMiddleware } from './src/middlewares/socket.auth.middleware.js';
import { checkSuperAdminRole } from "./src/middlewares/auth.middleware.js";
import { verifyToken } from './src/middlewares/verifyToken.js';

// Import Routes
import socketApiRoutes from './src/api/socket.route.js';
import authApiRoutes from './src/api/auth.route.js';
import usersApiRoutes from './src/api/users.route.js';
import inventoryApiRoutes from './src/api/inventory.route.js';

// 1. Inicializar la base de datos
initializeDatabase();

/**
 * Configura y devuelve una instancia de la aplicación Express.
 * @returns {express.Application} La aplicación Express configurada.
 */
function configureApp(): express.Application {
	const app = express();
	// Configura el middleware de CORS para todas las rutas HTTP
	app.use(
		cors({
			origin: config.CORS_ORIGIN, // Reutiliza la configuración de origen de CORS
			credentials: true, // Permite el envío de cookies (útil para /auth/refresh)
		})
	);
	app.use(express.json());

	app.use((req, res, next) => {
		Logger.http(`Request: ${req.method} ${req.originalUrl}`, { ip: req.ip });
		next();
	});

	return app;
}

/**
 * Inicializa y configura Socket.IO en el servidor HTTP.
 * @param {http.Server} server El servidor HTTP.
 * @returns {SocketIOServer} La instancia de Socket.IO configurada.
 */
function configureSocketIO(server: http.Server): SocketIOServer {
	// Establece un timeout global para los acknowledgements.
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
app.use('/api/inventory', verifyToken, inventoryApiRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

initializeSocketLogic(io);

async function startServer() {
	try {
		startSheetsPolling(io);
		Logger.info('Monitoreo de Google Sheets (Polling) iniciado.');

		server.listen(config.PORT, () => {
			Logger.info(`Servidor Socket.IO/Express escuchando en el puerto ${config.PORT}`);
		});
	} catch (error) {
		Logger.error(`Error fatal al iniciar el servidor: ${error instanceof Error ? error.message : error}`);
		process.exit(1);
	}
}

// Inicia el servidor
startServer();
