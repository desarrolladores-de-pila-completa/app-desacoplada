"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const db_1 = require("../middlewares/db");
const logger_1 = __importDefault(require("../utils/logger"));
class CommentRepository {
    /**
     * Crea un nuevo comentario en una página.
     * @param commentData Datos del comentario
     * @returns ID del nuevo comentario
     */
    async create(commentData) {
        try {
            const [result] = await db_1.pool.query("INSERT INTO comentarios (pagina_id, user_id, comentario) VALUES (?, ?, ?)", [commentData.pagina_id, commentData.user_id, commentData.comentario]);
            logger_1.default.info(`Comentario creado en página ${commentData.pagina_id} por usuario ${commentData.user_id}`);
            return result.insertId;
        }
        catch (error) {
            logger_1.default.error(`Error al crear comentario: ${error}`);
            throw error;
        }
    }
    /**
     * Busca un comentario por su ID.
     * @param commentId ID del comentario
     * @returns Comentario encontrado o null
     */
    async findById(commentId) {
        try {
            const [rows] = await db_1.pool.query(`SELECT c.*, u.username
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`, [commentId]);
            logger_1.default.info(`findById ejecutado para comentario ${commentId}`);
            return rows.length > 0 && rows[0] ? rows[0] : null;
        }
        catch (error) {
            logger_1.default.error(`Error en findById: ${error}`);
            throw error;
        }
    }
    /**
     * Busca comentarios de una página con paginación.
     * @param pageId ID de la página
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de comentarios
     */
    async findByPage(pageId, limit = 50, offset = 0) {
        try {
            const [rows] = await db_1.pool.query(`SELECT c.*, u.username
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.pagina_id = ?
         ORDER BY c.creado_en DESC
         LIMIT ? OFFSET ?`, [pageId, limit, offset]);
            logger_1.default.info(`findByPage ejecutado para página ${pageId}`);
            return rows;
        }
        catch (error) {
            logger_1.default.error(`Error en findByPage: ${error}`);
            throw error;
        }
    }
    /**
     * Busca comentarios de un usuario con paginación.
     * @param userId ID del usuario
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de comentarios
     */
    async findByUser(userId, limit = 20, offset = 0) {
        try {
            const [rows] = await db_1.pool.query(`SELECT c.*, u.username, p.titulo as pagina_titulo
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN paginas p ON c.pagina_id = p.id
         WHERE c.user_id = ?
         ORDER BY c.creado_en DESC
         LIMIT ? OFFSET ?`, [userId, limit, offset]);
            logger_1.default.info(`findByUser ejecutado para usuario ${userId}`);
            return rows;
        }
        catch (error) {
            logger_1.default.error(`Error en findByUser: ${error}`);
            throw error;
        }
    }
    /**
     * Actualiza un comentario por su ID y usuario.
     * @param commentId ID del comentario
     * @param userId ID del usuario
     * @param newComment Nuevo texto del comentario
     */
    async update(commentId, userId, newComment) {
        try {
            await db_1.pool.query("UPDATE comentarios SET comentario = ? WHERE id = ? AND user_id = ?", [newComment, commentId, userId]);
            logger_1.default.info(`Comentario ${commentId} actualizado por usuario ${userId}`);
        }
        catch (error) {
            logger_1.default.error(`Error al actualizar comentario: ${error}`);
            throw error;
        }
    }
    /**
     * Elimina un comentario por su ID y usuario.
     * @param commentId ID del comentario
     * @param userId ID del usuario
     */
    async delete(commentId, userId) {
        try {
            await db_1.pool.query("DELETE FROM imagenes_comentarios WHERE comentario_id = ?", [commentId]);
            await db_1.pool.query("DELETE FROM comentarios WHERE id = ? AND user_id = ?", [commentId, userId]);
            logger_1.default.info(`Comentario ${commentId} eliminado por usuario ${userId}`);
        }
        catch (error) {
            logger_1.default.error(`Error al eliminar comentario: ${error}`);
            throw error;
        }
    }
    /**
     * Cuenta el número de comentarios en una página.
     * @param pageId ID de la página
     * @returns Número de comentarios
     */
    async countByPage(pageId) {
        try {
            const [rows] = await db_1.pool.query("SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?", [pageId]);
            logger_1.default.info(`countByPage ejecutado para página ${pageId}`);
            return rows[0]?.count || 0;
        }
        catch (error) {
            logger_1.default.error(`Error en countByPage: ${error}`);
            throw error;
        }
    }
    /**
     * Elimina todos los comentarios de una página.
     * @param pageId ID de la página
     */
    async deleteAllByPage(pageId) {
        try {
            await db_1.pool.query("DELETE FROM imagenes_comentarios WHERE comentario_id IN (SELECT id FROM comentarios WHERE pagina_id = ?)", [pageId]);
            await db_1.pool.query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
            logger_1.default.info(`Todos los comentarios eliminados para página ${pageId}`);
        }
        catch (error) {
            logger_1.default.error(`Error al eliminar todos los comentarios: ${error}`);
            throw error;
        }
    }
    /**
     * Verifica si el usuario es propietario de un comentario.
     * @param commentId ID del comentario
     * @param userId ID del usuario
     * @returns true si es propietario, false si no
     */
    async isOwner(commentId, userId) {
        try {
            const [rows] = await db_1.pool.query("SELECT user_id FROM comentarios WHERE id = ?", [commentId]);
            logger_1.default.info(`isOwner ejecutado para comentario ${commentId} y usuario ${userId}`);
            if (rows.length === 0 || !rows[0])
                return false;
            return rows[0].user_id === userId;
        }
        catch (error) {
            logger_1.default.error(`Error en isOwner: ${error}`);
            throw error;
        }
    }
    /**
     * Verifica si el usuario puede eliminar el comentario (propietario o dueño de la página).
     * @param commentId ID del comentario
     * @param userId ID del usuario
     * @returns true si puede eliminar, false si no
     */
    async canDelete(commentId, userId) {
        try {
            const [rows] = await db_1.pool.query(`SELECT c.user_id as comment_user_id, p.user_id as page_user_id
         FROM comentarios c
         INNER JOIN paginas p ON c.pagina_id = p.id
         WHERE c.id = ?`, [commentId]);
            logger_1.default.info(`canDelete ejecutado para comentario ${commentId} y usuario ${userId}`);
            if (rows.length === 0 || !rows[0])
                return false;
            const { comment_user_id, page_user_id } = rows[0];
            return comment_user_id === userId || page_user_id === userId;
        }
        catch (error) {
            logger_1.default.error(`Error en canDelete: ${error}`);
            throw error;
        }
    }
    /**
     * Busca los comentarios más recientes en páginas visibles.
     * @param limit Límite de resultados
     * @returns Array de comentarios
     */
    async findRecent(limit = 10) {
        try {
            const [rows] = await db_1.pool.query(`SELECT c.*, u.username, p.titulo as pagina_titulo, p.id as pagina_id
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN paginas p ON c.pagina_id = p.id
         ORDER BY c.creado_en DESC
         LIMIT ?`, [limit]);
            logger_1.default.info(`findRecent ejecutado con limit ${limit}`);
            return rows;
        }
        catch (error) {
            logger_1.default.error(`Error en findRecent: ${error}`);
            throw error;
        }
    }
    /**
     * Busca comentarios por término de búsqueda en páginas visibles.
     * @param searchTerm Término de búsqueda
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de comentarios
     */
    async search(searchTerm, limit = 20, offset = 0) {
        try {
            const searchPattern = `%${searchTerm}%`;
            const [rows] = await db_1.pool.query(`SELECT c.*, u.username, p.titulo as pagina_titulo
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN paginas p ON c.pagina_id = p.id
         WHERE c.comentario LIKE ?
         ORDER BY c.creado_en DESC
         LIMIT ? OFFSET ?`, [searchPattern, limit, offset]);
            logger_1.default.info(`search ejecutado con término '${searchTerm}'`);
            return rows;
        }
        catch (error) {
            logger_1.default.error(`Error en search: ${error}`);
            throw error;
        }
    }
}
exports.CommentRepository = CommentRepository;
//# sourceMappingURL=CommentRepository.js.map