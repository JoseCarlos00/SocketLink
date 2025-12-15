import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express'
import cors from 'cors';
import cookieParser from 'cookie-parser';

import Logger from './src/services/logger.js';
import swaggerSpec  from './src/swagger.js';
import { config } from './src/config.js'; 
import { loadAndSetCache, startSheetsPolling } from './src/socket/state.js';
import { initializeDatabase } from './src/database/connection.js'
import { initializeSocketLogic } from './src/socket/connection.js';
import { deviceStatusManager } from './src/managers/DeviceStatusManager.js';

import type { ClientToServerEvents, ServerToClientEvents } from './src/types/serverEvents.js';

// Import Middlewares
import { socketAuthMiddleware } from './src/middlewares/socket.auth.middleware.js';
import { checkSuperAdminRole } from "./src/middlewares/auth.middleware.js";
import { verifyToken } from './src/middlewares/verifyToken.js';

// Import Routes
import authApiRoutes from './src/api/auth.route.js';
import usersApiRoutes from './src/api/users.route.js';
import inventoryApiRoutes from './src/api/inventory.route.js';
import reportsRoutes from './src/api/reports.route.js';

import { getProfile } from './src/controllers/auth.controller.js'

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
		cors({ // Ahora usa la configuración centralizada
			origin: config.CORS_ORIGIN,
			credentials: true, // Permite el envío de cookies (útil para /auth/refresh)
		})
	);

	app.use(express.json());
	app.use(cookieParser());

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
			credentials: true,
			methods: ['GET', 'POST'],
		},
		// Aumentar los timeouts (valores en ms)
		pingTimeout: 30000, // 30 segundos (default es 20000)
		pingInterval: 15000, // 15 segundos (default es 25000)
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
deviceStatusManager.setIO(io);

// Aplicar middleware de autenticación a todas las conexiones de Socket.IO
io.use(socketAuthMiddleware);

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ 
    service: 'AlertScannerService API', 
    status: 'Running',
    version: '1.0'
  });
});

app.use('/status', ((_, res) => {
	res.status(200).json({ status: 'ACTIVE' });
}))
app.use('/api/auth', authApiRoutes);
app.use('/api/users/me', verifyToken, getProfile); // Asumiendo que getProfile está en auth.controller
app.use('/api/inventory', verifyToken, inventoryApiRoutes);
app.use('/api/reports',verifyToken, checkSuperAdminRole, reportsRoutes);
app.use('/api/admin/users', verifyToken, usersApiRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

initializeSocketLogic(io);

async function startServer() {
	try {
		// 1. Cargar la caché de forma síncrona antes de iniciar el servidor.
		// Si esto falla, el servidor no se iniciará gracias al 'throw' en loadAndSetCache.
		await loadAndSetCache();

		// 2. Iniciar el servidor para que comience a aceptar conexiones.
		server.listen(config.PORT, () => {
			Logger.info(`Servidor Socket.IO/Express escuchando en el puerto ${config.PORT}`);
			// 3. Una vez que el servidor está escuchando, iniciar el polling para futuras actualizaciones.
			startSheetsPolling(io);
			Logger.info('Monitoreo de Google Sheets (Polling) iniciado para detectar futuras actualizaciones.');
		});
	} catch (error) {
		Logger.error(`Error fatal al iniciar el servidor: ${error instanceof Error ? error.message : error}`);
		process.exit(1);
	}
}

// Inicia el servidor
startServer();
