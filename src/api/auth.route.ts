import { Router } from 'express';
// import { login, refreshToken, logout, registerUser } from '../controllers/auth.controller';

const router = Router();

// router.post('/login', login);
router.post('/login', (res, req) => {
	console.log('Login:', req);
});
// router.post('/refresh', refreshToken);
// router.post('/logout', logout);
// router.post('/register', registerUser);

export default router;
