import { Router } from 'express';
import { User as UserModel } from '../models/user.model.js';
import { registerUser } from '../controllers/auth.controller.js';

// Root: /api/admin/users
const router = Router();


// POST /api/admin/users - Crea un nuevo usuario (movido desde auth.route)
router.post('/', registerUser);

// GET /api/admin/users - Obtiene todos los usuarios
router.get('/', async (_req, res) => {
	try {
    const users = await UserModel.getAllUsers();
    
    if (users) {
			res.json(users);
    } else {
      res.status(404).json({ message: 'No se encontraron usuarios.' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- Rutas futuras para CRUD ---

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

// PUT /api/admin/users/:id - Actualizar un usuario por ID
router.put('/:id', (req, res) => {
	res.status(501).json({ message: 'Funcionalidad no implementada todavía.', id: req.params.id });
});

// DELETE /api/admin/users/:id - Borrar un usuario por ID
router.delete('/:id', (req, res) => {
	res.status(501).json({ message: 'Funcionalidad no implementada todavía.', id: req.params.id });
});

export default router;
