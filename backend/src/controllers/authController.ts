import { Request, Response } from "express";
import { z } from 'zod';
import winston from '../utils/logger';
import { MulterFile, AppError } from '../types/interfaces';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { getService } from '../utils/servicesConfig';
import { getAuthCookieOptions } from '../utils/cookieConfig';

const authService = getService<AuthService>('AuthService');
const userServiceAuth = getService<UserService>('UserService');

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
export async function register(req: RequestWithFile, res: Response): Promise<void> {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      winston.warn('Validación fallida en registro', { issues: parsed.error.issues });
      throw new AppError(400, 'Datos inválidos');
    }
    const { email, password } = parsed.data;
    const file = req.file;
    const userData = { email, password, file };
    const result = await authService.register(userData);
    res.cookie("token", result.token, getAuthCookieOptions());
    const { pool } = require('../middlewares/db');
    const mensaje = `Nuevo usuario registrado: <a href="/pagina/${result.username}">${result.username}</a>`;
    await pool.query(
      "INSERT INTO feed (user_id, mensaje) VALUES (?, ?)",
      [result.user.id, mensaje]
    );
    res.json({
      message: "Usuario creado y página personal en línea",
      id: result.user.id,
      username: result.user.username,
      display_name: result.user.display_name,
      paginaPersonal: null
    });
  } catch (error) {
    winston.error('Error en register', { error });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Error al registrar usuario");
  }
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 */
export async function login(req: RequestWithFile, res: Response): Promise<void> {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      winston.warn('Validación fallida en login', { issues: parsed.error.issues });
      throw new AppError(400, 'Datos inválidos');
    }
    const { email, password } = parsed.data;
    const result = await authService.login(email, password);
    res.cookie("token", result.token, getAuthCookieOptions());
    res.json({
      message: "Login exitoso",
      id: result.user.id,
      username: result.user.username,
      display_name: result.user.display_name,
      token: result.token
    });
  } catch (error) {
    winston.error('Error en login', { error });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Error al iniciar sesión");
  }
}

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 */
export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie("token", getAuthCookieOptions());
  res.json({ message: "Sesión cerrada y token eliminado" });
}

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener datos del usuario autenticado
 *     tags: [Auth]
 */
export async function me(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  const user = await userServiceAuth.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    email: user.email
  });
}

/**
 * @swagger
 * /api/auth/eliminar:
 *   delete:
 *     summary: Eliminar usuario y su página
 *     tags: [Auth]
 */
export async function eliminarUsuario(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new AppError(400, "Falta el id de usuario");
    }
    await userServiceAuth.deleteUserCompletely(userId);
    res.json({ message: "Usuario, perfil, comentarios e imágenes eliminados correctamente" });
  } catch (error) {
    winston.error('Error al eliminar usuario', { error });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Error al eliminar usuario");
  }
}
