import { Router } from 'express';
import { deviceStatusManager } from '../managers/DeviceStatusManager.js';
// import { getRegisteredDevicesList } from '../controllers/inventory.controller.js';

const router = Router();

// Ruta protegida para que la App Web obtenga la lista de destinos
// router.get('/devices', getRegisteredDevicesList);


/**
 * GET /api/devices
 * Obtiene todos los dispositivos con su estado en tiempo real
 */
router.get('/devices', (req, res) => {
  try {
    const devicesWithStatus = deviceStatusManager.getAllDevicesWithStatus();

    // Transformar al formato que espera el frontend
    const devicesList = devicesWithStatus.map((device) => ({
      id: device.androidId ?? `index-${device.index}`,
      androidId: device.androidId,
      equipo: device.equipo,
      modelo: device.modelo,
      usuario: device.usuario,
      correo: device.correo,
      aliasUsuario: device.aliasUsuario,
      ipAddress: device.ip,
      macAddress: device.macAddress,
      // ✅ Estado en tiempo real ya viene incluido
      online: device.online,
      battery: device.battery,
      charging: device.charging,
      lastSeen: device.lastSeen,
      timeSinceLastSeen: device.timeSinceLastSeen,
    }));

    res.json({
      success: true,
      data: devicesList,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API] Error fetching devices:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener dispositivos',
    });
  }
});

/**
 * GET /api/devices/:androidId
 * Obtiene un dispositivo específico con su estado
 */
router.get('/devices/:androidId', (req, res) => {
  try {
    const { androidId } = req.params;
    const device = deviceStatusManager.getDeviceStatusByAndroidId(androidId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Dispositivo no encontrado',
      });
    }

    res.json({
      success: true,
      data: {
        id: device.androidId ?? `index-${device.index}`,
        androidId: device.androidId,
        equipo: device.equipo,
        modelo: device.modelo,
        usuario: device.usuario,
        correo: device.correo,
        aliasUsuario: device.aliasUsuario,
        ipAddress: device.ip,
        macAddress: device.macAddress,
        online: device.online,
        battery: device.battery,
        charging: device.charging,
        lastSeen: device.lastSeen,
        timeSinceLastSeen: device.timeSinceLastSeen,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API] Error fetching device:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener dispositivo',
    });
  }
});

export default router;
