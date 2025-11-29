import { Router } from 'express';
import { login, refreshToken, logout, registerUser } from '../controllers/auth.controller.js';
import { User } from '../models/user.model.js';
import { checkAdminRole } from '../middlewares/auth.middleware.js'

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/register', checkAdminRole, registerUser);

router.get('/users', async (req, res) => {
	const users = await User.getAllUsers();
	res.json(users);
});

export default router;
