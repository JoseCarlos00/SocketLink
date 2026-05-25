// src/routes/reports.ts
import { Router } from 'express';
import { metricsManager } from '../managers/metricsManager.js';
import Logger from '../services/logger.js';

const router = Router();

/**
 * GET /api/reports/devices?days=30
 * Reporte de dispositivos perdidos y frecuencia de alarmas
 */
router.get('/devices', (req, res) => {
	try {
		const days = parseInt(req.query.days as string) || 30;
		const report = metricsManager.getDeviceLossReport(days);

		if (!report) {
			return res.status(500).json({
				success: false,
				error: 'Error generando reporte de dispositivos',
			});
		}

		res.json({
			success: true,
			data: report,
		});
	} catch (error) {
		Logger.error(`[API] Error en /devices: ${error}`);
		res.status(500).json({
			success: false,
			error: 'Error generando reporte de dispositivos',
		});
	}
});


/**
 * GET /api/reports/summary
 * Resumen general de todas las métricas
 */
router.get('/summary', (req, res) => {
	try {
		const deviceReport = metricsManager.getDeviceLossReport(30);

		if (!deviceReport) {
			return res.status(500).json({
				success: false,
				error: 'Error generando resumen',
			});
		}

		res.json({
			success: true,
			data: {
				devices: {
					total: deviceReport.devicesAffected,
					totalAlarms: deviceReport.totalAlarms,
					averagePerDay: deviceReport.averageAlarmsPerDay.toFixed(2),
				},
			},
		});
	} catch (error) {
		Logger.error(`[API] Error en /summary: ${error}`);
		res.status(500).json({
			success: false,
			error: 'Error generando resumen',
		});
	}
});


/**E
 * POST /api/reports/cleanup
 * Limpia datos antiguos
 */
router.post('/cleanup', (req, res) => {
	try {
		const daysToKeep = parseInt(req.body.daysToKeep) || 90;
		metricsManager.cleanOldData(daysToKeep);

		res.json({
			success: true,
			message: `Datos anteriores a ${daysToKeep} días eliminados`,
		});
	} catch (error) {
		Logger.error(`[API] Error en /cleanup: ${error}`);
		res.status(500).json({
			success: false,
			error: 'Error limpiando datos antiguos',
		});
	}
});

export default router;
