import { Router } from 'express';
import { login, refreshToken, logout, getProfile } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.get('/me', verifyToken, getProfile)
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;
