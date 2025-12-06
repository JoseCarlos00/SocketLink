import winston from 'winston';
import { config } from '../config.js';
import DailyRotateFile from 'winston-daily-rotate-file';

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
	// Transporte para la consola.
	new winston.transports.Console(),
	
	// Transporte para rotar los logs de errores.
	new DailyRotateFile({
		level: 'error',
		filename: 'logs/error-%DATE%.log', // Patrón del nombre de archivo. %DATE% será reemplazado.
		datePattern: 'YYYY-MM-DD', // El formato de la fecha.
		zippedArchive: true, // Comprime los archivos de log antiguos.
		maxSize: '20m', // Rota el archivo si alcanza los 20MB.
		maxFiles: '14d', // Elimina los logs después de 14 días.
		format: winston.format.uncolorize(), // Guarda en el archivo sin colores.
	}),
	// Transporte para rotar todos los logs (desde el nivel configurado hacia arriba).
	new DailyRotateFile({
		filename: 'logs/combined-%DATE%.log',
		datePattern: 'YYYY-MM-DD',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		format: winston.format.uncolorize(), // Guarda en el archivo sin colores.
	}),
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
