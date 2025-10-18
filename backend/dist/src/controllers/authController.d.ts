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
 * /api/auth/eliminar:
 *   delete:
 *     summary: Eliminar usuario y su página
 *     tags: [Auth]
 */
export declare function eliminarUsuario(req: Request, res: Response): Promise<void>;
export {};
//# sourceMappingURL=authController.d.ts.map