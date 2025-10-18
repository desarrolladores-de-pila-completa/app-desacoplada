import { Request, Response } from "express";
import { z } from 'zod';
import winston from '../utils/logger';
import { MulterFile, AppError } from '../types/interfaces';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { getService } from '../utils/servicesConfig';
import { getAuthCookieOptions, getRefreshTokenCookieOptions, getSlidingSessionCookieOptions, clearAuthCookies } from '../utils/cookieConfig';

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
    res.cookie("token", result.accessToken, getAuthCookieOptions());
    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());
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
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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
    res.cookie("token", result.accessToken, getAuthCookieOptions());
    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());
    res.json({
      message: "Login exitoso",
      id: result.user.id,
      username: result.user.username,
      display_name: result.user.display_name,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
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
  clearAuthCookies(res);
  res.json({ message: "Sesión cerrada y tokens eliminados" });
}

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
 * /api/auth/:username:
 *   get:
 *     summary: Obtener datos públicos del usuario por username
 *     tags: [Auth]
 */
export async function getUserByUsername(req: Request, res: Response): Promise<void> {
   const { username } = req.params;

   if (!username) {
     res.status(400).json({ error: 'Username es requerido' });
     return;
   }

   console.log('🔍 Buscando usuario por username:', username);

   try {
     // Buscar directamente en la base de datos usando el pool
     const { pool } = require('../middlewares/db');
     const [rows]: any = await pool.query(
       "SELECT username, display_name, foto_perfil FROM users WHERE username = ?",
       [username]
     );

     console.log('📊 Resultado de búsqueda:', {
       username,
       found: rows && rows.length > 0,
       hasFotoPerfil: rows && rows.length > 0 && !!rows[0].foto_perfil
     });

     if (!rows || rows.length === 0) {
       console.log('❌ Usuario no encontrado en la base de datos');
       res.status(404).json({ error: 'Usuario no encontrado' });
       return;
     }

     const user = rows[0];
     console.log('✅ Usuario encontrado:', {
       username: user.username,
       display_name: user.display_name,
       hasFotoPerfil: !!user.foto_perfil
     });

     res.json({
       username: user.username,
       display_name: user.display_name,
       foto_perfil: user.foto_perfil || null
     });
   } catch (error) {
     console.error('❌ Error al buscar usuario por username:', error);
     res.status(500).json({ error: 'Error interno del servidor' });
   }
 }

/**
 * @swagger
 * /api/auth/extend-session:
 *   post:
 *     summary: Extender sesión automáticamente (sliding sessions)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
export async function extendSession(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;

  if (!userId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  try {
    // Actualizar timestamp de actividad
    await authService.updateLastActivity(userId);

    // Extender sesión
    const result = await authService.extendSession(userId);

    // Establecer nuevas cookies con configuración de sliding session
    res.cookie("token", result.accessToken, getSlidingSessionCookieOptions(true));
    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());

    // Marcar extensión en cookie separada para el frontend
    res.cookie("sessionExtended", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300000, // 5 minutos
      path: '/'
    });

    res.json({
      message: "Sesión extendida exitosamente",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      extended: result.extended
    });
  } catch (error) {
    winston.error('Error al extender sesión', { error, userId });
    if (error instanceof AppError) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar tokens de acceso
 *     tags: [Auth]
 */
export async function refreshTokens(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: "Refresh token no proporcionado" });
    return;
  }

  try {
    const result = await authService.refreshTokens(refreshToken);

    // Establecer nuevas cookies
    res.cookie("token", result.accessToken, getAuthCookieOptions());
    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());

    res.json({
      message: "Tokens refrescados exitosamente",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    winston.error('Error al refrescar tokens', { error });
    if (error instanceof AppError) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
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
