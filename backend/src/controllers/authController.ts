import { Request, Response } from "express";
import { z } from 'zod';
import winston from '../utils/logger';
import { MulterFile, AppError } from '../types/interfaces';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { UsernameUpdateService, usernameUpdateService } from '../services/UsernameUpdateService';
import { getService } from '../utils/servicesConfig';
import { getAuthCookieOptions, getRefreshTokenCookieOptions, getSlidingSessionCookieOptions, clearAuthCookies } from '../utils/cookieConfig';
import passport from 'passport';

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

    // Autenticar manualmente con Passport
    req.logIn(result.user, (err) => {
      if (err) {
        winston.error('Error al iniciar sesión después de registro', { error: err });
        return res.status(500).json({ error: "Error al iniciar sesión" });
      }

      res.json({
        message: "Usuario creado y página personal en línea",
        id: result.user.id,
        username: result.user.username,
        display_name: result.user.display_name,
        paginaPersonal: null
      });
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

    // Usar Passport para autenticar
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        winston.error('Error en autenticación Passport', { error: err });
        return res.status(500).json({ error: "Error en autenticación" });
      }
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Iniciar sesión con Passport
      req.logIn(user, (err) => {
        if (err) {
          winston.error('Error al iniciar sesión', { error: err });
          return res.status(500).json({ error: "Error al iniciar sesión" });
        }

        res.json({
          message: "Login exitoso",
          id: user.id,
          username: user.username,
          display_name: user.display_name
        });
      });
    })(req, res);
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
  req.logout((err) => {
    if (err) {
      winston.error('Error al cerrar sesión', { error: err });
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }
    res.json({ message: "Sesión cerrada exitosamente" });
  });
}


/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Obtener lista de todos los usuarios
 *     tags: [Auth]
 */
export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await userServiceAuth.getAllUsers();
    res.json(users);
  } catch (error) {
    winston.error('Error al obtener usuarios', { error });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
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
       username: rows && rows.length > 0 ? rows.map((row: any) => ({
         display_name: row.display_name,
         foto_perfil: row.foto_perfil,
         creado_en: row.creado_en
       })) : [],
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
export async function updateProfilePhoto(req: RequestWithFile, res: Response): Promise<void> {
  const userId = (req as any).userId;

  if (!userId) {
    throw new AppError(401, "No autenticado");
  }

  try {
    const file = req.file;

    if (!file) {
      throw new AppError(400, "No se proporcionó ningún archivo");
    }

    if (!file.buffer) {
      throw new AppError(400, "Archivo inválido");
    }

    // Validar tipo de archivo (solo imágenes)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError(400, "Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG, GIF y WebP");
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new AppError(400, "El archivo es demasiado grande. Máximo 5MB permitido");
    }

    winston.info('Actualizando foto de perfil', { userId, fileSize: file.size, mimeType: file.mimetype });

    // Usar el servicio de usuario para actualizar la foto
    await userServiceAuth.updateProfilePhoto(userId, file.buffer);

    res.json({
      message: "Foto de perfil actualizada exitosamente",
      fileSize: file.size,
      mimeType: file.mimetype
    });

  } catch (error) {
    winston.error('Error al actualizar foto de perfil', { error, userId });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Error al actualizar foto de perfil");
  }
}

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
export async function getUserProfilePhoto(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: 'ID de usuario es requerido' });
    return;
  }

  try {
    // Buscar usuario por ID directamente en la base de datos
    const { pool } = require('../middlewares/db');
    const [rows]: any = await pool.query(
      "SELECT foto_perfil FROM users WHERE id = ?",
      [id]
    );

    if (!rows || rows.length === 0) {
      winston.warn('Usuario no encontrado al obtener foto de perfil', { userId: id });
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const user = rows[0];

    if (!user.foto_perfil) {
      winston.info('Usuario sin foto de perfil', { userId: id });
      res.status(404).json({ error: 'Usuario no tiene foto de perfil' });
      return;
    }

    // Determinar el tipo de imagen basado en los primeros bytes del buffer
    const buffer = user.foto_perfil;
    let contentType = 'image/jpeg'; // default

    if (buffer && buffer.length > 0) {
      // Detectar tipo de imagen por magic numbers
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        contentType = 'image/jpeg';
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        contentType = 'image/png';
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        contentType = 'image/gif';
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        contentType = 'image/webp';
      }
    }

    // Configurar headers para la imagen
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache por 5 minutos para permitir actualizaciones más frecuentes
    res.setHeader('Content-Length', buffer.length);

    // Enviar el buffer de la imagen
    res.send(buffer);

    winston.info('Foto de perfil servida exitosamente', {
      userId: id,
      contentType,
      size: buffer.length
    });

  } catch (error) {
    winston.error('Error al obtener foto de perfil', { error, userId: id });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function updateUsername(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId;
  const authenticatedUserId = (req as any).userId;

  if (!userId) {
    throw new AppError(400, "ID de usuario es requerido");
  }

  if (!authenticatedUserId) {
    throw new AppError(401, "No autenticado");
  }

  // Verificar que el usuario autenticado solo pueda actualizar su propio username
  if (authenticatedUserId !== userId) {
    throw new AppError(403, "No autorizado para actualizar este usuario");
  }

  try {
    const { username, dryRun = false } = req.body;

    if (!username) {
      throw new AppError(400, "Nuevo username es requerido");
    }

    winston.info('Iniciando actualización de username', {
      userId,
      oldUsername: (req as any).user?.username,
      newUsername: username,
      dryRun,
      context: 'username-update-request'
    });

    // Usar el servicio de actualización de username
    const updateResult = await usernameUpdateService.updateUsername({
      userId,
      newUsername: username,
      dryRun: Boolean(dryRun)
    });

    // Log detallado de la operación para auditoría
    winston.info('Username actualizado exitosamente', {
      userId,
      oldUsername: updateResult.oldUsername,
      newUsername: updateResult.newUsername,
      redirectsCreated: updateResult.redirectsCreated,
      executionTimeMs: updateResult.executionTimeMs,
      contentReferencesUpdated: updateResult.contentUpdate?.updatedReferences || 0,
      cacheKeysInvalidated: updateResult.cacheInvalidation?.invalidatedKeys.length || 0,
      context: 'username-update-success'
    });

    // Si hubo errores, loggearlos pero no fallar completamente
    if (updateResult.errors.length > 0) {
      winston.warn('Username actualizado con errores menores', {
        userId,
        errors: updateResult.errors,
        warnings: updateResult.warnings,
        context: 'username-update-with-warnings'
      });
    }

    // Preparar respuesta informativa
    const response: any = {
      message: dryRun
        ? "Previsualización completada exitosamente"
        : "Username actualizado exitosamente",
      oldUsername: updateResult.oldUsername,
      newUsername: updateResult.newUsername,
      redirectsCreated: updateResult.redirectsCreated,
      executionTimeMs: updateResult.executionTimeMs,
      timestamp: updateResult.timestamp
    };

    // Incluir estadísticas detalladas si están disponibles
    if (updateResult.contentUpdate) {
      response.contentUpdate = {
        totalReferences: updateResult.contentUpdate.totalReferences,
        updatedReferences: updateResult.contentUpdate.updatedReferences,
        commentsFound: updateResult.contentUpdate.details.comments.found,
        commentsUpdated: updateResult.contentUpdate.details.comments.updated,
        privateMessagesFound: updateResult.contentUpdate.details.privateMessages.found,
        privateMessagesUpdated: updateResult.contentUpdate.details.privateMessages.updated,
        publicationsFound: updateResult.contentUpdate.details.publications.found,
        publicationsUpdated: updateResult.contentUpdate.details.publications.updated
      };
    }

    if (updateResult.cacheInvalidation) {
      response.cacheInvalidation = {
        invalidatedKeys: updateResult.cacheInvalidation.invalidatedKeys,
        success: updateResult.cacheInvalidation.success,
        errors: updateResult.cacheInvalidation.errors
      };
    }

    // Incluir warnings si los hay
    if (updateResult.warnings.length > 0) {
      response.warnings = updateResult.warnings;
    }

    // Incluir errores menores si los hay (pero la operación fue exitosa)
    if (updateResult.errors.length > 0 && updateResult.success) {
      response.errors = updateResult.errors;
      response.message += " (con errores menores)";
    }

    res.json(response);

  } catch (error) {
    winston.error('Error al actualizar username', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'username-update-error'
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(500, "Error interno al actualizar username");
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
