import { Router } from 'express';
import { metricsManager } from './../managers/metricsManager.js';

const router = Router();

/**
 * GET /api/reports/devices
 * Reporte de dispositivos perdidos y frecuencia de alarmas
 */
router.get('/devices', (req, res) => {
	try {
		const days = parseInt(req.query.days as string) || 30;
		const report = metricsManager.getDeviceLossReport(days);

		res.json({
			success: true,
			data: report,
		});
	} catch (error) {
		console.error('[API] Error en /devices:', error);
		res.status(500).json({
			success: false,
			error: 'Error generando reporte de dispositivos',
		});
	}
});

/**
 * GET /api/reports/battery
 * Reporte de dispositivos con problemas de batería
 */
router.get('/battery', (req, res) => {
	try {
		const report = metricsManager.getBatteryReport();

		res.json({
			success: true,
			data: report,
		});
	} catch (error) {
		console.error('[API] Error en /battery:', error);
		res.status(500).json({
			success: false,
			error: 'Error generando reporte de batería',
		});
	}
});

/**
 * GET /api/reports/daily
 * Estadísticas diarias
 */
router.get('/daily', (req, res) => {
	try {
		const days = parseInt(req.query.days as string) || 7;
		const report = metricsManager.getDailyReport(days);

		res.json({
			success: true,
			data: report,
		});
	} catch (error) {
		console.error('[API] Error en /daily:', error);
		res.status(500).json({
			success: false,
			error: 'Error generando reporte diario',
		});
	}
});

/**
 * GET /api/reports/status
 * Estado actual de todos los dispositivos
 */
router.get('/status', (req, res) => {
	try {
		const devices = metricsManager.getCurrentDeviceStates();

		res.json({
			success: true,
			data: {
				total: devices.length,
				online: devices.filter((d) => d.online).length,
				offline: devices.filter((d) => !d.online).length,
				lowBattery: devices.filter((d) => d.battery < 20 && !d.charging).length,
				devices,
			},
		});
	} catch (error) {
		console.error('[API] Error en /status:', error);
		res.status(500).json({
			success: false,
			error: 'Error obteniendo estado de dispositivos',
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
		const batteryReport = metricsManager.getBatteryReport();
		const dailyReport = metricsManager.getDailyReport(7);
		const statusReport = metricsManager.getCurrentDeviceStates();

		res.json({
			success: true,
			data: {
				devices: {
					total: deviceReport.devicesAffected,
					totalAlarms: deviceReport.totalAlarms,
					averagePerDay: deviceReport.averageAlarmsPerDay.toFixed(2),
				},
				battery: {
					devicesWithIssues: batteryReport.devicesWithIssues,
					totalAlerts: batteryReport.totalAlerts,
				},
				status: {
					online: statusReport.filter((d) => d.online).length,
					offline: statusReport.filter((d) => !d.online).length,
					lowBattery: statusReport.filter((d) => d.battery < 20).length,
				},
				weeklyTrend: dailyReport,
			},
		});
	} catch (error) {
		console.error('[API] Error en /summary:', error);
		res.status(500).json({
			success: false,
			error: 'Error generando resumen',
		});
	}
});

export default router;
