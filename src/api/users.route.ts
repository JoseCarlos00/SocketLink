import { Router } from 'express';
import {
	registerUser,
	deleteUser,
	updateUser,
	updatePassword,
	getAllUsers,
	getUserById,
} from '../controllers/users.controller.js';

// Root: /api/admin/users
const router = Router();

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', registerUser);
router.put('/:id', updatePassword)
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
