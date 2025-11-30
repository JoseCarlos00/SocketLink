import { Router } from 'express';
import { login, refreshToken, logout } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;
