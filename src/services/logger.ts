import winston from 'winston';
import { config } from '../config.js';

// Define los niveles de severidad de los logs.
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determina el nivel de logging según el entorno.
const level = () => {
  const env = config.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// Define los colores para cada nivel (útil en la consola).
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Define el formato de los logs.
const format = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
	// El formato para la consola incluye colores.
	winston.format.colorize({ all: true }),
	winston.format.printf(
		(info) => `${info.timestamp} [${info.module || 'SYSTEM'}] ${info.level}: ${info.message}`
	)
);

// Define los "transportes" (dónde se guardarán los logs).
const transports = [
  // Guardar los errores en un archivo separado.
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // Guardar todos los logs (desde info hacia arriba) en otro archivo.
  new winston.transports.File({ filename: 'logs/combined.log' }),
];

// Crea y exporta la instancia del logger.
const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});


// Loggers específicos
export const adminLogger = Logger.child({ module: 'ADMIN_API' });
export const socketLogger = Logger.child({ module: 'SOCKET' });
export const androidLogger = Logger.child({ module: 'ANDROID_APP' });
export const webLogger = Logger.child({ module: 'WEB_APP' });
export const googleSheetLogger = Logger.child({ module: 'GOOGLE_SHEETS' });
export const cacheLogger = Logger.child({ module: 'CACHE' });
export const inventoryLogger = Logger.child({ module: 'INVENTORY_API' });

export default Logger;
