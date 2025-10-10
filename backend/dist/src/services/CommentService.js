"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const { pool } = require("../middlewares/db");
class CommentService {
    /**
     * Crear un nuevo comentario
     */
    async createComment(userId, pageId, comentario) {
        const [result] = await pool.query("INSERT INTO comentarios (pagina_id, user_id, comentario) VALUES (?, ?, ?)", [pageId, userId, comentario]);
        return result.insertId;
    }
    /**
     * Obtener comentarios de una página con información de usuario
     */
    async getPageComments(pageId, limit = 50, offset = 0) {
        const [rows] = await pool.query(`SELECT c.*, u.username 
       FROM comentarios c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.pagina_id = ? 
       ORDER BY c.creado_en DESC 
       LIMIT ? OFFSET ?`, [pageId, limit, offset]);
        return rows;
    }
    /**
     * Obtener comentario por ID
     */
    async getCommentById(commentId) {
        const [rows] = await pool.query(`SELECT c.*, u.username 
       FROM comentarios c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`, [commentId]);
        return rows.length > 0 && rows[0] ? rows[0] : null;
    }
    /**
     * Actualizar comentario (solo el propietario)
     */
    async updateComment(commentId, userId, nuevoComentario) {
        // Verificar que el usuario es el propietario
        const isOwner = await this.isCommentOwner(commentId, userId);
        if (!isOwner) {
            throw new Error("No tienes permisos para editar este comentario");
        }
        await pool.query("UPDATE comentarios SET comentario = ? WHERE id = ? AND user_id = ?", [nuevoComentario, commentId, userId]);
    }
    /**
     * Eliminar comentario
     */
    async deleteComment(commentId, userId) {
        // Verificar permisos (propietario del comentario o propietario de la página)
        const canDelete = await this.canDeleteComment(commentId, userId);
        if (!canDelete) {
            throw new Error("No tienes permisos para eliminar este comentario");
        }
        await pool.query("DELETE FROM comentarios WHERE id = ?", [commentId]);
    }
    /**
     * Obtener comentarios de un usuario
     */
    async getUserComments(userId, limit = 20, offset = 0) {
        const [rows] = await pool.query(`SELECT c.*, u.username, p.titulo as pagina_titulo 
       FROM comentarios c 
       LEFT JOIN users u ON c.user_id = u.id 
       LEFT JOIN paginas p ON c.pagina_id = p.id 
       WHERE c.user_id = ? 
       ORDER BY c.creado_en DESC 
       LIMIT ? OFFSET ?`, [userId, limit, offset]);
        return rows;
    }
    /**
     * Contar comentarios de una página
     */
    async countPageComments(pageId) {
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?", [pageId]);
        return rows[0]?.count || 0;
    }
    /**
     * Eliminar todos los comentarios de una página
     */
    async deleteAllPageComments(pageId) {
        await pool.query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
    }
    /**
     * Verificar si un usuario es propietario de un comentario
     */
    async isCommentOwner(commentId, userId) {
        const [rows] = await pool.query("SELECT user_id FROM comentarios WHERE id = ?", [commentId]);
        if (rows.length === 0 || !rows[0])
            return false;
        return rows[0].user_id === userId;
    }
    /**
     * Verificar si un usuario puede eliminar un comentario
     * (propietario del comentario o propietario de la página)
     */
    async canDeleteComment(commentId, userId) {
        const [rows] = await pool.query(`SELECT c.user_id as comment_user_id, p.user_id as page_user_id 
       FROM comentarios c 
       INNER JOIN paginas p ON c.pagina_id = p.id 
       WHERE c.id = ?`, [commentId]);
        if (rows.length === 0 || !rows[0])
            return false;
        const { comment_user_id, page_user_id } = rows[0];
        // Puede eliminar si es propietario del comentario o propietario de la página
        return comment_user_id === userId || page_user_id === userId;
    }
    /**
     * Obtener comentarios recientes del sistema
     */
    async getRecentComments(limit = 10) {
        const [rows] = await pool.query(`SELECT c.*, u.username, p.titulo as pagina_titulo, p.id as pagina_id 
       FROM comentarios c 
       LEFT JOIN users u ON c.user_id = u.id 
       LEFT JOIN paginas p ON c.pagina_id = p.id 
       WHERE p.descripcion = 'visible'
       ORDER BY c.creado_en DESC 
       LIMIT ?`, [limit]);
        return rows;
    }
    /**
     * Buscar comentarios por texto
     */
    async searchComments(searchTerm, limit = 20, offset = 0) {
        const searchPattern = `%${searchTerm}%`;
        const [rows] = await pool.query(`SELECT c.*, u.username, p.titulo as pagina_titulo 
       FROM comentarios c 
       LEFT JOIN users u ON c.user_id = u.id 
       LEFT JOIN paginas p ON c.pagina_id = p.id 
       WHERE c.comentario LIKE ? AND p.descripcion = 'visible'
       ORDER BY c.creado_en DESC 
       LIMIT ? OFFSET ?`, [searchPattern, limit, offset]);
        return rows;
    }
}
exports.CommentService = CommentService;
//# sourceMappingURL=CommentService.js.map