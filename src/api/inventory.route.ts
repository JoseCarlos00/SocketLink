import { Router } from 'express';
import { getRegisteredDevicesList } from '../controllers/inventory.controller.js';

const router = Router();

// Ruta protegida para que la App Web obtenga la lista de destinos
router.get('/devices', getRegisteredDevicesList);

export default router;
