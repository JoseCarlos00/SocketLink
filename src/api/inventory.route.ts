import { Router } from 'express';
import { getAllDeviceList, getDeviceById } from '../controllers/inventory.controller.js';

const router = Router();

router.get('/devices', getAllDeviceList);
router.get('/devices/:androidId', getDeviceById);

export default router;
