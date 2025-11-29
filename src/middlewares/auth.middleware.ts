import { Request, Response, NextFunction } from 'express';

export const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
	// 1. Obtener el usuario autenticado (asumiendo que está en el objeto de la petición)
	const user = req.currentUser;

	// 2. Verificar si el usuario existe y si su rol es 'admin'
	if (!user || user.role !== 'admin') {
		return res.status(403).json({ message: 'Acceso denegado: solo para administradores.' });
	}

	// 3. Si la verificación es exitosa, continuar con la siguiente función (el controlador)
	next();
};
