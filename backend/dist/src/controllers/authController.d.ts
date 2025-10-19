import { Request, Response } from "express";
import { MulterFile } from '../types/interfaces';
interface RequestWithFile extends Request {
    file?: MulterFile;
    validatedData?: any;
}
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 */
export declare function register(req: RequestWithFile, res: Response): Promise<void>;
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 */
export declare function login(req: RequestWithFile, res: Response): Promise<void>;
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 */
export declare function logout(req: Request, res: Response): Promise<void>;
export declare function me(req: Request, res: Response): Promise<void>;
/**
 * @swagger
 * /api/auth/:username:
 *   get:
 *     summary: Obtener datos públicos del usuario por username
 *     tags: [Auth]
 */
export declare function getUserByUsername(req: Request, res: Response): Promise<void>;
/**
 * @swagger
 * /api/auth/extend-session:
 *   post:
 *     summary: Extender sesión automáticamente (sliding sessions)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
export declare function extendSession(req: Request, res: Response): Promise<void>;
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar tokens de acceso
 *     tags: [Auth]
 */
export declare function refreshTokens(req: Request, res: Response): Promise<void>;
/**
 * @swagger
 * /api/auth/profile-photo:
 *   post:
 *     summary: Actualizar foto de perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen para foto de perfil
 */
export declare function updateProfilePhoto(req: RequestWithFile, res: Response): Promise<void>;
/**
 * @swagger
 * /api/auth/user/:id/foto:
 *   get:
 *     summary: Obtener foto de perfil de usuario específico
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Foto de perfil del usuario
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Usuario no encontrado o sin foto de perfil
 *       500:
 *         description: Error interno del servidor
 */
export declare function getUserProfilePhoto(req: Request, res: Response): Promise<void>;
/**
 * @swagger
 * /api/auth/users/{userId}/username:
 *   put:
 *     summary: Actualizar nombre de usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario cuyo username se va a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               - username:
 *                   type: string
 *                   minLength: 3
 *                   maxLength: 20
 *                   pattern: '^[a-zA-Z0-9_\\sáéíóúÁÉÍÓÚñÑ-]+$'
 *                   description: Nuevo nombre de usuario
 *               - dryRun:
 *                   type: boolean
 *                   default: false
 *                   description: Si es true, solo previsualiza los cambios sin aplicarlos
 *     responses:
 *       200:
 *         description: Username actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 oldUsername:
 *                   type: string
 *                 newUsername:
 *                   type: string
 *                 contentUpdate:
 *                   type: object
 *                   properties:
 *                     totalReferences:
 *                       type: number
 *                     updatedReferences:
 *                       type: number
 *                 cacheInvalidation:
 *                   type: object
 *                   properties:
 *                     invalidatedKeys:
 *                       type: array
 *                       items:
 *                         type: string
 *                 redirectsCreated:
 *                   type: number
 *                 executionTimeMs:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Datos inválidos o username ya en uso
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado para actualizar este usuario
 *       404:
 *         description: Usuario no encontrado
 *       429:
 *         description: Demasiadas solicitudes de cambio de username
 *       500:
 *         description: Error interno del servidor
 */
export declare function updateUsername(req: Request, res: Response): Promise<void>;
/**
 * @swagger
 * /api/auth/eliminar:
 *   delete:
 *     summary: Eliminar usuario y su página
 *     tags: [Auth]
 */
export declare function eliminarUsuario(req: Request, res: Response): Promise<void>;
export {};
//# sourceMappingURL=authController.d.ts.map