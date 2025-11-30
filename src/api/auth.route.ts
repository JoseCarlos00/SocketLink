import { Router } from 'express';
import { login, refreshToken, logout } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación de usuarios
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Auth]
 *     description: Autentica a un usuario con su email y contraseña, y devuelve un token de acceso y uno de refresco.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario.
 *                 example: usuario@ejemplo.com
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario.
 *                 format: password
 *                 example: claveSegura123
 *     responses:
 *       '200':
 *         description: Autenticación exitosa. Devuelve los tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Token de acceso JWT.
 *                 refreshToken:
 *                   type: string
 *                   description: Token de refresco para generar nuevos tokens de acceso.
 *       '400':
 *         description: Solicitud incorrecta, faltan el email o la contraseña.
 *       '401':
 *         description: Credenciales inválidas.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/login', login);

/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Refrescar el token de acceso
 *     tags: [Auth]
 *     description: Genera un nuevo token de acceso utilizando un token de refresco válido.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: El token de refresco obtenido durante el inicio de sesión.
 *     responses:
 *       '200':
 *         description: Token de acceso refrescado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Nuevo token de acceso JWT.
 *       '401':
 *         description: No autorizado, el token de refresco es inválido o ha expirado.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Cerrar sesión de usuario
 *     tags: [Auth]
 *     description: Invalida el token de refresco del usuario para cerrar la sesión de forma segura.
 *     responses:
 *       '204':
 *         description: Sesión cerrada exitosamente. No se devuelve contenido.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/logout', logout);

export default router;
