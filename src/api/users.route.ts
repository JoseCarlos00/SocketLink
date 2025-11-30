import { Router } from 'express';
import { User as UserModel } from '../models/user.model.js';
import { registerUser, deleteUser, updatePassword, updateUser, getAllUsers } from '../controllers/users.controller.js';

// Root: /api/admin/users
const router = Router();

router.get('/', getAllUsers);
router.post('/', registerUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

// GET /api/admin/users/:id - Obtener un usuario por ID
router.get('/:id', (req, res) => {
	try {
		const user = UserModel.findById(Number(req.params.id));
		if (user) {
			res.json(user);
		} else {
			res.status(404).json({ message: 'Usuario no encontrado' });
		}
	} catch (error) {
		res.status(500).json({ message: 'Error interno del servidor' });
	}
});


export default router;
