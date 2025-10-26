"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerPaginaPorUserId = obtenerPaginaPorUserId;
exports.paginaUnificadaPorUsername = paginaUnificadaPorUsername;
exports.obtenerPaginaPorUsername = obtenerPaginaPorUsername;
exports.obtenerPaginasPublicasPorUsuario = obtenerPaginasPublicasPorUsuario;
exports.obtenerPaginaPorUsernameYNumero = obtenerPaginaPorUsernameYNumero;
exports.consultarUsuarioPagina = consultarUsuarioPagina;
exports.actualizarUsuarioPagina = actualizarUsuarioPagina;
exports.actualizarFotoPorUsername = actualizarFotoPorUsername;
exports.actualizarNombrePorUsername = actualizarNombrePorUsername;
exports.paginasPublicas = paginasPublicas;
exports.guardarComentario = guardarComentario;
exports.eliminarComentario = eliminarComentario;
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("../middlewares/db");
const servicesConfig_1 = require("../utils/servicesConfig");
// Obtener página por user_id (UUID sin guiones)
/**
 * @swagger
 * /api/pagina/user/{user_id}:
 *   get:
 *     summary: Obtener página por user_id
 *     tags: [Pagina]
 */
// Obtener página por user_id (UUID sin guiones)
/**
 * @swagger
 * /api/pagina/user/{user_id}:
 *   get:
 *     summary: Obtener página por user_id
 *     tags: [Pagina]
 */
async function obtenerPaginaPorUserId(req, res) {
    const userId = req.params.user_id;
    try {
        const [pages] = await db_1.pool.query("SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY id DESC LIMIT 1", [userId]);
        if (!pages || pages.length === 0)
            return res.status(404).json({ error: "Página no encontrada" });
        res.json(pages[0]);
    }
    catch (err) {
        logger_1.default.error('Error al obtener página por user_id', { error: err });
        res.status(500).json({ error: "Error al obtener página por user_id" });
    }
}
// Función unificada para manejar todas las operaciones de páginas por username
/**
 * @swagger
 * /api/pagina/{username}:
 *   get:
 *     summary: Obtener información de página por username con soporte para diferentes acciones
 *     tags: [Pagina]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [info, publicaciones, galeria, comentarios, lista]
 *         description: Tipo de acción a realizar
 *       - in: query
 *         name: publicacionId
 *         schema:
 *           type: integer
 *         description: ID específico de publicación (para action=publicacion)
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *         description: Número de página específico (para action=lista)
 */
// Función unificada para manejar todas las operaciones de páginas por username
async function paginaUnificadaPorUsername(req, res) {
    const username = req.params.username;
    const { action = 'info', publicacionId, pageNumber } = req.query;
    console.log('=== UNIFIED PAGE REQUEST DEBUG ===', {
        username,
        action,
        publicacionId,
        pageNumber,
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        context: 'unified-page-debug'
    });
    try {
        // Obtener información del usuario primero
        const [users] = await db_1.pool.query("SELECT id, username, display_name, foto_perfil FROM users WHERE username = ?", [username]);
        console.log('=== UNIFIED PAGE DB USER LOOKUP ===', {
            username,
            usersFound: users.length,
            context: 'unified-page-debug'
        });
        if (!users || users.length === 0) {
            console.log('=== UNIFIED PAGE USER NOT FOUND ===', {
                username,
                statusCode: 404,
                context: 'unified-page-debug'
            });
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const user = users[0];
        const userId = user.id;
        switch (action) {
            case 'info':
                // Información completa del usuario y página principal
                return await obtenerInformacionCompletaUsuario(user, res);
            case 'publicaciones':
                // Lista de publicaciones del usuario
                return await obtenerPublicacionesUsuario(userId, res);
            case 'publicacion':
                // Publicación específica
                if (!publicacionId) {
                    return res.status(400).json({ error: "Se requiere publicacionId para obtener publicación específica" });
                }
                return await obtenerPublicacionEspecifica(userId, publicacionId, res);
            case 'galeria':
                // Galería de imágenes del usuario
                return await obtenerGaleriaUsuario(userId, res);
            case 'comentarios':
                // Comentarios de la página principal del usuario
                return await obtenerComentariosUsuario(userId, res);
            case 'lista':
                // Lista de páginas públicas del usuario (compatible con estructura antigua)
                if (pageNumber) {
                    return await obtenerPaginaPorNumero(userId, parseInt(pageNumber), res);
                }
                return await obtenerListaPaginasUsuario(userId, res);
            default:
                return res.status(400).json({ error: `Acción no válida: ${action}` });
        }
    }
    catch (err) {
        logger_1.default.error('Error en operación unificada de página', { error: err, username, action });
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
// Función auxiliar para obtener información completa del usuario
async function obtenerInformacionCompletaUsuario(user, res) {
    // Obtener la primera página del usuario (página principal)
    const [pages] = await db_1.pool.query("SELECT * FROM paginas WHERE user_id = ? ORDER BY id ASC LIMIT 1", [user.id]);
    let pagina = null;
    if (pages && pages.length > 0) {
        pagina = pages[0];
    }
    // Obtener imágenes de la galería si existe la página
    let imagenes = [];
    if (pagina) {
        const [imagenesRows] = await db_1.pool.query("SELECT idx, imagen FROM imagenes WHERE pagina_id = ? ORDER BY idx ASC", [pagina.id]);
        imagenes = imagenesRows.map((row) => ({
            idx: row.idx,
            src: `data:image/jpeg;base64,${Buffer.from(row.imagen).toString('base64')}`
        }));
    }
    // Obtener comentarios de la página si existe
    let comentarios = [];
    if (pagina) {
        const [comentariosRows] = await db_1.pool.query(`SELECT c.*, u.username FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.pagina_id = ? ORDER BY c.creado_en DESC`, [pagina.id]);
        comentarios = comentariosRows;
    }
    // Construir respuesta completa
    const respuesta = {
        usuario: {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            foto_perfil: user.foto_perfil ? `data:image/jpeg;base64,${Buffer.from(user.foto_perfil).toString('base64')}` : null
        },
        pagina: pagina,
        galeria: imagenes,
        comentarios: comentarios
    };
    res.json(respuesta);
}
// Función auxiliar para obtener publicaciones del usuario
async function obtenerPublicacionesUsuario(userId, res) {
    const [rows] = await db_1.pool.query("SELECT id, titulo, contenido, created_at FROM publicaciones WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    res.json({ publicaciones: rows });
}
// Función auxiliar para obtener publicación específica
async function obtenerPublicacionEspecifica(userId, publicacionId, res) {
    const [rows] = await db_1.pool.query("SELECT id, titulo, contenido, created_at FROM publicaciones WHERE id = ? AND user_id = ?", [publicacionId, userId]);
    if (rows.length === 0) {
        return res.status(404).json({ error: "Publicación no encontrada" });
    }
    res.json({ publicacion: rows[0] });
}
// Función auxiliar para obtener galería del usuario
async function obtenerGaleriaUsuario(userId, res) {
    // Obtener primera página para obtener galería
    const [pages] = await db_1.pool.query("SELECT id FROM paginas WHERE user_id = ? ORDER BY id ASC LIMIT 1", [userId]);
    if (!pages || pages.length === 0) {
        return res.json({ galeria: [] });
    }
    const [imagenesRows] = await db_1.pool.query("SELECT idx, imagen FROM imagenes WHERE pagina_id = ? ORDER BY idx ASC", [pages[0].id]);
    const imagenes = imagenesRows.map((row) => ({
        idx: row.idx,
        src: `data:image/jpeg;base64,${Buffer.from(row.imagen).toString('base64')}`
    }));
    res.json({ galeria: imagenes });
}
// Función auxiliar para obtener comentarios del usuario
async function obtenerComentariosUsuario(userId, res) {
    // Obtener primera página para obtener comentarios
    const [pages] = await db_1.pool.query("SELECT id FROM paginas WHERE user_id = ? ORDER BY id ASC LIMIT 1", [userId]);
    if (!pages || pages.length === 0) {
        return res.json({ comentarios: [] });
    }
    const [comentariosRows] = await db_1.pool.query(`SELECT c.*, u.username FROM comentarios c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.pagina_id = ? ORDER BY c.creado_en DESC`, [pages[0].id]);
    res.json({ comentarios: comentariosRows });
}
// Función auxiliar para obtener página por número
async function obtenerPaginaPorNumero(userId, pageNumber, res) {
    const [pages] = await db_1.pool.query("SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.id ASC LIMIT 1 OFFSET ?", [userId, pageNumber - 1]);
    if (!pages || pages.length === 0) {
        return res.status(404).json({ error: "Página no encontrada" });
    }
    res.json(pages[0]);
}
// Función auxiliar para obtener lista de páginas del usuario
async function obtenerListaPaginasUsuario(userId, res) {
    const [pages] = await db_1.pool.query("SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.id ASC", [userId]);
    res.json(pages);
}
// Función legacy mantenida para compatibilidad
async function obtenerPaginaPorUsername(req, res) {
    return paginaUnificadaPorUsername(req, res);
}
// Obtener página por username y número de página
// Obtener lista de páginas públicas de un usuario
/**
 * @swagger
 * /api/pagina/publicas/{username}:
 *   get:
 *     summary: Obtener páginas públicas de un usuario
 *     tags: [Pagina]
 */
async function obtenerPaginasPublicasPorUsuario(req, res) {
    const username = req.params.username;
    try {
        const [users] = await db_1.pool.query("SELECT id FROM users WHERE username = ?", [username]);
        if (!users || users.length === 0)
            return res.status(404).json({ error: "Usuario no encontrado" });
        const userId = users[0].id;
        const [pages] = await db_1.pool.query("SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.id ASC", [userId]);
        res.json(pages);
    }
    catch (err) {
        logger_1.default.error('Error al obtener páginas públicas del usuario', { error: err });
        res.status(500).json({ error: "Error al obtener páginas públicas del usuario" });
    }
}
/**
 * @swagger
 * /api/pagina/username/{username}/numero/{pageNumber}:
 *   get:
 *     summary: Obtener página por username y número de página
 *     tags: [Pagina]
 */
async function obtenerPaginaPorUsernameYNumero(req, res) {
    const { username, pageNumber } = req.params;
    if (!pageNumber)
        return res.status(400).json({ error: "Número de página requerido" });
    const pageNum = parseInt(pageNumber, 10);
    if (isNaN(pageNum) || pageNum < 1)
        return res.status(400).json({ error: "Número de página inválido" });
    try {
        const [users] = await db_1.pool.query("SELECT id FROM users WHERE username = ?", [username]);
        if (!users || users.length === 0)
            return res.status(404).json({ error: "Usuario no encontrado" });
        const userId = users[0].id;
        const [pages] = await db_1.pool.query("SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.id ASC LIMIT 1 OFFSET ?", [userId, pageNum - 1]);
        if (!pages || pages.length === 0)
            return res.status(404).json({ error: "Página no encontrada" });
        res.json(pages[0]);
    }
    catch (err) {
        logger_1.default.error('Error al obtener página por usuario y número', { error: err });
        res.status(500).json({ error: "Error al obtener página por usuario y número" });
    }
}
// Función eliminada: consultarPropietario (campo propietario eliminado)
// Función eliminada: consultarDescripcion (campo eliminado)
// Consultar usuario
/**
 * @swagger
 * /api/pagina/usuario/{id}:
 *   get:
 *     summary: Consultar usuario de página
 *     tags: [Pagina]
 */
async function consultarUsuarioPagina(req, res) {
    const paginaId = req.params.id;
    try {
        const [rows] = await db_1.pool.query("SELECT usuario FROM paginas WHERE id = ?", [paginaId]);
        if (!rows || rows.length === 0)
            return res.status(404).json({ error: "Página no encontrada" });
        res.json({ usuario: rows[0].usuario });
    }
    catch (err) {
        logger_1.default.error('Error al consultar usuario de página', { error: err });
        res.status(500).json({ error: "Error al consultar usuario de página" });
    }
}
// Función eliminada: actualizarPropietario (campo propietario eliminado)
// Función eliminada: actualizarDescripcion (campo eliminado)
// Actualizar usuario
/**
 * @swagger
 * /api/pagina/actualizar-usuario/{id}:
 *   put:
 *     summary: Actualizar usuario de página
 *     tags: [Pagina]
 */
async function actualizarUsuarioPagina(req, res) {
    const paginaId = req.params.id;
    const { username } = req.validatedData;
    const userId = req.userId;
    try {
        const [rows] = await db_1.pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
        if (!rows || rows.length === 0)
            return res.status(404).json({ error: "Página no encontrada" });
        if (String(rows[0].user_id) !== String(userId))
            return res.status(403).json({ error: "No autorizado" });
        const usuario = username.getValue();
        // Sanitizar username para la URL (sin espacios, solo guiones)
        const usernameSanitizado = usuario.replace(/\s+/g, '-');
        await db_1.pool.query("UPDATE paginas SET usuario = ? WHERE id = ?", [usernameSanitizado, paginaId]);
        await db_1.pool.query("UPDATE users SET username = ?, display_name = ? WHERE id = ?", [usernameSanitizado, usuario, rows[0].user_id]);
        res.json({ message: "Usuario de página actualizado" });
    }
    catch (err) {
        logger_1.default.error('Error al actualizar usuario de página', { error: err });
        res.status(500).json({ error: "Error al actualizar usuario de página" });
    }
}
// Funciones eliminadas: actualizarVisibilidad, consultarVisibilidad (campo oculto eliminado)
// Actualizar foto por username
/**
 * @swagger
 * /api/pagina/{username}/foto:
 *   put:
 *     summary: Actualizar foto de perfil por username
 *     tags: [Pagina]
 */
async function actualizarFotoPorUsername(req, res) {
    const username = req.params.username;
    const file = req.file;
    const userId = req.userId;
    if (!file) {
        return res.status(400).json({ error: "No se recibió imagen" });
    }
    try {
        // Obtener el userId por username
        const [users] = await db_1.pool.query("SELECT id FROM users WHERE username = ?", [username]);
        if (!users || users.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const targetUserId = users[0].id;
        // Verificar que el usuario autenticado es el propietario
        if (String(targetUserId) !== String(userId)) {
            return res.status(403).json({ error: "No autorizado" });
        }
        // Actualizar foto_perfil en users
        await db_1.pool.query("UPDATE users SET foto_perfil = ? WHERE id = ?", [file.buffer, targetUserId]);
        res.json({ message: "Foto actualizada correctamente" });
    }
    catch (err) {
        logger_1.default.error('Error al actualizar foto por username', { error: err });
        res.status(500).json({ error: "Error al actualizar foto" });
    }
}
// Actualizar nombre por username
/**
 * @swagger
 * /api/pagina/{username}/nombre:
 *   put:
 *     summary: Actualizar nombre de usuario por username
 *     tags: [Pagina]
 */
async function actualizarNombrePorUsername(req, res) {
    const username = req.params.username;
    const { username: newUsername } = req.validatedData;
    const userId = req.userId;
    try {
        // Obtener el userId por username
        const [users] = await db_1.pool.query("SELECT id, username FROM users WHERE username = ?", [username]);
        if (!users || users.length === 0) {
            logger_1.default.error('Usuario no encontrado en actualizarNombrePorUsername', { username });
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const targetUserId = users[0].id;
        // Verificar que el usuario autenticado es el propietario
        if (String(targetUserId) !== String(userId)) {
            logger_1.default.warn('Usuario no autorizado para actualizar nombre', { targetUserId, userId });
            return res.status(403).json({ error: "No autorizado" });
        }
        const usernameValue = newUsername.getValue();
        logger_1.default.info('Actualizando display_name', { targetUserId, oldUsername: username, newDisplayName: usernameValue });
        // Actualizar display_name en users
        await db_1.pool.query("UPDATE users SET display_name = ? WHERE id = ?", [usernameValue, targetUserId]);
        // Obtener el usuario actualizado para el response
        const [updatedUsers] = await db_1.pool.query("SELECT id, username, display_name, foto_perfil FROM users WHERE id = ?", [targetUserId]);
        const updatedUser = updatedUsers[0];
        logger_1.default.info('Nombre actualizado exitosamente', { targetUserId, newDisplayName: updatedUser.display_name });
        res.json({
            message: "Nombre actualizado correctamente",
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                display_name: updatedUser.display_name,
                foto_perfil: updatedUser.foto_perfil ? `data:image/jpeg;base64,${Buffer.from(updatedUser.foto_perfil).toString('base64')}` : null
            }
        });
    }
    catch (err) {
        logger_1.default.error('Error al actualizar nombre por username', { error: err });
        res.status(500).json({ error: "Error al actualizar nombre" });
    }
}
const userService = (0, servicesConfig_1.getService)('UserService');
/**
 * Envía una respuesta de error con código y mensaje, y loguea el error.
 */
function sendError(res, code, msg) {
    logger_1.default.error('API error', { code, msg });
    return res.status(code).json({ error: msg });
}
/**
 * @swagger
 * /api/pagina/publicas:
 *   get:
 *     summary: Obtener páginas públicas
 *     tags: [Pagina]
 */
async function paginasPublicas(req, res) {
    try {
        const userId = req.query.user_id;
        let query = "SELECT p.id, p.user_id, u.username, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id";
        let params = [];
        if (userId) {
            query += " WHERE p.user_id = ? ORDER BY p.id DESC LIMIT 1";
            params = [userId];
        }
        else {
            query += " ORDER BY p.id DESC";
        }
        const [rows] = await db_1.pool.execute(query, params);
        res.json(rows);
    }
    catch (err) {
        logger_1.default.error('Error al obtener páginas públicas', { error: err });
        sendError(res, 500, "Error al obtener páginas");
    }
}
// Eliminado: función de edición de página
// Guardar comentario en la base de datos
/**
 * @swagger
 * /api/pagina/comentario:
 *   post:
 *     summary: Guardar comentario en la página
 *     tags: [Pagina]
 */
async function guardarComentario(req, res) {
    const { comentario, pageId } = req.validatedData;
    const userId = req.userId;
    if (!userId)
        return sendError(res, 401, "Debes estar autenticado para comentar");
    try {
        const [result] = await db_1.pool.query("INSERT INTO comentarios (pagina_id, user_id, comentario, creado_en) VALUES (?, ?, ?, NOW())", [pageId, userId, comentario.getValue()]);
        const commentId = result.insertId;
        // Asociar imágenes subidas con el comentario
        const imageRegex = /\/api\/comment-images\/(\d+)/g;
        let match;
        while ((match = imageRegex.exec(comentario.getValue())) !== null) {
            const imageId = match[1];
            await db_1.pool.query("UPDATE imagenes_comentarios SET comentario_id = ? WHERE id = ?", [commentId, imageId]);
        }
        res.json({ message: "Comentario guardado" });
    }
    catch (err) {
        logger_1.default.error('Error al guardar comentario', { error: err });
        sendError(res, 500, "Error al guardar comentario");
    }
}
// Eliminar comentario
/**
 * @swagger
 * /api/pagina/comentario/{id}/{commentId}:
 *   delete:
 *     summary: Eliminar comentario de la página
 *     tags: [Pagina]
 */
async function eliminarComentario(req, res) {
    const { id: pageId, commentId } = req.params;
    const userId = req.userId;
    if (!userId)
        return sendError(res, 401, "Debes estar autenticado");
    try {
        // Verificar que el comentario existe y pertenece al usuario
        const [rows] = await db_1.pool.query("SELECT user_id FROM comentarios WHERE id = ? AND pagina_id = ?", [commentId, pageId]);
        if (!rows || rows.length === 0)
            return sendError(res, 404, "Comentario no encontrado");
        if (String(rows[0].user_id) !== String(userId))
            return sendError(res, 403, "No autorizado para eliminar este comentario");
        // Eliminar las imágenes asociadas al comentario primero
        await db_1.pool.query("DELETE FROM imagenes_comentarios WHERE comentario_id = ?", [commentId]);
        // Eliminar el comentario
        await db_1.pool.query("DELETE FROM comentarios WHERE id = ?", [commentId]);
        res.json({ message: "Comentario eliminado" });
    }
    catch (err) {
        logger_1.default.error('Error al eliminar comentario', { error: err });
        sendError(res, 500, "Error al eliminar comentario");
    }
}
//# sourceMappingURL=paginaController.js.map