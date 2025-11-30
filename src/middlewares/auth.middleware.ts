import { Request, Response, NextFunction } from 'express';

export const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
	const user = req.currentUser;
	const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];

	if (!user || !allowedRoles.includes(user.role)) {
		return res.status(403).json({ message: 'Acceso denegado: solo para administradores.' });
	}

	next();
};

export const checkSuperAdminRole = (req: Request, res: Response, next: NextFunction) => {
	const user = req.currentUser;

	if (!user || user.role !== 'SUPER_ADMIN') {
		return res.status(403).json({ message: 'Acceso denegado: solo para super administradores.' });
	}

	next();
}
