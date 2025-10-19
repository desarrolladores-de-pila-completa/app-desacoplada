"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.me = me;
exports.getUserByUsername = getUserByUsername;
exports.extendSession = extendSession;
exports.refreshTokens = refreshTokens;
exports.updateProfilePhoto = updateProfilePhoto;
exports.getUserProfilePhoto = getUserProfilePhoto;
exports.updateUsername = updateUsername;
exports.eliminarUsuario = eliminarUsuario;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
const interfaces_1 = require("../types/interfaces");
const UsernameUpdateService_1 = require("../services/UsernameUpdateService");
const servicesConfig_1 = require("../utils/servicesConfig");
const cookieConfig_1 = require("../utils/cookieConfig");
const authService = (0, servicesConfig_1.getService)('AuthService');
const userServiceAuth = (0, servicesConfig_1.getService)('UserService');
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 */
async function register(req, res) {
    const schema = zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
    });
    try {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            logger_1.default.warn('Validación fallida en registro', { issues: parsed.error.issues });
            throw new interfaces_1.AppError(400, 'Datos inválidos');
        }
        const { email, password } = parsed.data;
        const file = req.file;
        const userData = { email, password, file };
        const result = await authService.register(userData);
        res.cookie("token", result.accessToken, (0, cookieConfig_1.getAuthCookieOptions)());
        res.cookie("refreshToken", result.refreshToken, (0, cookieConfig_1.getRefreshTokenCookieOptions)());
        const { pool } = require('../middlewares/db');
        const mensaje = `Nuevo usuario registrado: <a href="/pagina/${result.username}">${result.username}</a>`;
        await pool.query("INSERT INTO feed (user_id, mensaje) VALUES (?, ?)", [result.user.id, mensaje]);
        res.json({
            message: "Usuario creado y página personal en línea",
            id: result.user.id,
            username: result.user.username,
            display_name: result.user.display_name,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            paginaPersonal: null
        });
    }
    catch (error) {
        logger_1.default.error('Error en register', { error });
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al registrar usuario");
    }
}
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 */
async function login(req, res) {
    const schema = zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
    });
    try {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            logger_1.default.warn('Validación fallida en login', { issues: parsed.error.issues });
            throw new interfaces_1.AppError(400, 'Datos inválidos');
        }
        const { email, password } = parsed.data;
        const result = await authService.login(email, password);
        res.cookie("token", result.accessToken, (0, cookieConfig_1.getAuthCookieOptions)());
        res.cookie("refreshToken", result.refreshToken, (0, cookieConfig_1.getRefreshTokenCookieOptions)());
        res.json({
            message: "Login exitoso",
            id: result.user.id,
            username: result.user.username,
            display_name: result.user.display_name,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
        });
    }
    catch (error) {
        logger_1.default.error('Error en login', { error });
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al iniciar sesión");
    }
}
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 */
async function logout(req, res) {
    (0, cookieConfig_1.clearAuthCookies)(res);
    res.json({ message: "Sesión cerrada y tokens eliminados" });
}
async function me(req, res) {
    const userId = req.userId;
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
async function getUserByUsername(req, res) {
    const { username } = req.params;
    if (!username) {
        res.status(400).json({ error: 'Username es requerido' });
        return;
    }
    console.log('🔍 Buscando usuario por username:', username);
    try {
        // Buscar directamente en la base de datos usando el pool
        const { pool } = require('../middlewares/db');
        const [rows] = await pool.query("SELECT username, display_name, foto_perfil FROM users WHERE username = ?", [username]);
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
    }
    catch (error) {
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
async function extendSession(req, res) {
    const userId = req.userId;
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
        res.cookie("token", result.accessToken, (0, cookieConfig_1.getSlidingSessionCookieOptions)(true));
        res.cookie("refreshToken", result.refreshToken, (0, cookieConfig_1.getRefreshTokenCookieOptions)());
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
    }
    catch (error) {
        logger_1.default.error('Error al extender sesión', { error, userId });
        if (error instanceof interfaces_1.AppError) {
            res.status(401).json({ error: error.message });
        }
        else {
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
async function refreshTokens(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(401).json({ error: "Refresh token no proporcionado" });
        return;
    }
    try {
        const result = await authService.refreshTokens(refreshToken);
        // Establecer nuevas cookies
        res.cookie("token", result.accessToken, (0, cookieConfig_1.getAuthCookieOptions)());
        res.cookie("refreshToken", result.refreshToken, (0, cookieConfig_1.getRefreshTokenCookieOptions)());
        res.json({
            message: "Tokens refrescados exitosamente",
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
        });
    }
    catch (error) {
        logger_1.default.error('Error al refrescar tokens', { error });
        if (error instanceof interfaces_1.AppError) {
            res.status(401).json({ error: error.message });
        }
        else {
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
async function updateProfilePhoto(req, res) {
    const userId = req.userId;
    if (!userId) {
        throw new interfaces_1.AppError(401, "No autenticado");
    }
    try {
        const file = req.file;
        if (!file) {
            throw new interfaces_1.AppError(400, "No se proporcionó ningún archivo");
        }
        if (!file.buffer) {
            throw new interfaces_1.AppError(400, "Archivo inválido");
        }
        // Validar tipo de archivo (solo imágenes)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new interfaces_1.AppError(400, "Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG, GIF y WebP");
        }
        // Validar tamaño del archivo (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new interfaces_1.AppError(400, "El archivo es demasiado grande. Máximo 5MB permitido");
        }
        logger_1.default.info('Actualizando foto de perfil', { userId, fileSize: file.size, mimeType: file.mimetype });
        // Usar el servicio de usuario para actualizar la foto
        await userServiceAuth.updateProfilePhoto(userId, file.buffer);
        res.json({
            message: "Foto de perfil actualizada exitosamente",
            fileSize: file.size,
            mimeType: file.mimetype
        });
    }
    catch (error) {
        logger_1.default.error('Error al actualizar foto de perfil', { error, userId });
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al actualizar foto de perfil");
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
async function getUserProfilePhoto(req, res) {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: 'ID de usuario es requerido' });
        return;
    }
    try {
        // Buscar usuario por ID directamente en la base de datos
        const { pool } = require('../middlewares/db');
        const [rows] = await pool.query("SELECT foto_perfil FROM users WHERE id = ?", [id]);
        if (!rows || rows.length === 0) {
            logger_1.default.warn('Usuario no encontrado al obtener foto de perfil', { userId: id });
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        const user = rows[0];
        if (!user.foto_perfil) {
            logger_1.default.info('Usuario sin foto de perfil', { userId: id });
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
            }
            else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
                contentType = 'image/png';
            }
            else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
                contentType = 'image/gif';
            }
            else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
                contentType = 'image/webp';
            }
        }
        // Configurar headers para la imagen
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=300'); // Cache por 5 minutos para permitir actualizaciones más frecuentes
        res.setHeader('Content-Length', buffer.length);
        // Enviar el buffer de la imagen
        res.send(buffer);
        logger_1.default.info('Foto de perfil servida exitosamente', {
            userId: id,
            contentType,
            size: buffer.length
        });
    }
    catch (error) {
        logger_1.default.error('Error al obtener foto de perfil', { error, userId: id });
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
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
async function updateUsername(req, res) {
    const userId = req.params.userId;
    const authenticatedUserId = req.userId;
    if (!userId) {
        throw new interfaces_1.AppError(400, "ID de usuario es requerido");
    }
    if (!authenticatedUserId) {
        throw new interfaces_1.AppError(401, "No autenticado");
    }
    // Verificar que el usuario autenticado solo pueda actualizar su propio username
    if (authenticatedUserId !== userId) {
        throw new interfaces_1.AppError(403, "No autorizado para actualizar este usuario");
    }
    try {
        const { username, dryRun = false } = req.body;
        if (!username) {
            throw new interfaces_1.AppError(400, "Nuevo username es requerido");
        }
        logger_1.default.info('Iniciando actualización de username', {
            userId,
            oldUsername: req.user?.username,
            newUsername: username,
            dryRun,
            context: 'username-update-request'
        });
        // Usar el servicio de actualización de username
        const updateResult = await UsernameUpdateService_1.usernameUpdateService.updateUsername({
            userId,
            newUsername: username,
            dryRun: Boolean(dryRun)
        });
        // Log detallado de la operación para auditoría
        logger_1.default.info('Username actualizado exitosamente', {
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
            logger_1.default.warn('Username actualizado con errores menores', {
                userId,
                errors: updateResult.errors,
                warnings: updateResult.warnings,
                context: 'username-update-with-warnings'
            });
        }
        // Preparar respuesta informativa
        const response = {
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
                feedFound: updateResult.contentUpdate.details.feed.found,
                feedUpdated: updateResult.contentUpdate.details.feed.updated,
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
    }
    catch (error) {
        logger_1.default.error('Error al actualizar username', {
            userId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            context: 'username-update-error'
        });
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error interno al actualizar username");
    }
}
/**
 * @swagger
 * /api/auth/eliminar:
 *   delete:
 *     summary: Eliminar usuario y su página
 *     tags: [Auth]
 */
async function eliminarUsuario(req, res) {
    try {
        const userId = req.params.id;
        if (!userId) {
            throw new interfaces_1.AppError(400, "Falta el id de usuario");
        }
        await userServiceAuth.deleteUserCompletely(userId);
        res.json({ message: "Usuario, perfil, comentarios e imágenes eliminados correctamente" });
    }
    catch (error) {
        logger_1.default.error('Error al eliminar usuario', { error });
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al eliminar usuario");
    }
}
//# sourceMappingURL=authController.js.map