"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const db_1 = require("../middlewares/db");
class CommentRepository {
    async create(commentData) {
        const [result] = await db_1.pool.query("INSERT INTO comentarios (pagina_id, user_id, comentario) VALUES (?, ?, ?)", [commentData.pagina_id, commentData.user_id, commentData.comentario]);
        return result.insertId;
    }
    async findById(commentId) {
        const [rows] = await db_1.pool.query(`SELECT c.*, u.username
       FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`, [commentId]);
        return rows.length > 0 && rows[0] ? rows[0] : null;
    }
    async findByPage(pageId, limit = 50, offset = 0) {
        const [rows] = await db_1.pool.query(`SELECT c.*, u.username
       FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.pagina_id = ?
       ORDER BY c.creado_en DESC
       LIMIT ? OFFSET ?`, [pageId, limit, offset]);
        return rows;
    }
    async findByUser(userId, limit = 20, offset = 0) {
        const [rows] = await db_1.pool.query(`SELECT c.*, u.username, p.titulo as pagina_titulo
       FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN paginas p ON c.pagina_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.creado_en DESC
       LIMIT ? OFFSET ?`, [userId, limit, offset]);
        return rows;
    }
    async update(commentId, userId, newComment) {
        await db_1.pool.query("UPDATE comentarios SET comentario = ? WHERE id = ? AND user_id = ?", [newComment, commentId, userId]);
    }
    async delete(commentId, userId) {
        // Primero eliminar las imágenes asociadas al comentario
        await db_1.pool.query("DELETE FROM imagenes_comentarios WHERE comentario_id = ?", [commentId]);
        // Luego eliminar el comentario
        await db_1.pool.query("DELETE FROM comentarios WHERE id = ? AND user_id = ?", [commentId, userId]);
    }
    async countByPage(pageId) {
        const [rows] = await db_1.pool.query("SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?", [pageId]);
        return rows[0]?.count || 0;
    }
    async deleteAllByPage(pageId) {
        // Primero eliminar las imágenes asociadas a los comentarios de la página
        await db_1.pool.query("DELETE FROM imagenes_comentarios WHERE comentario_id IN (SELECT id FROM comentarios WHERE pagina_id = ?)", [pageId]);
        // Luego eliminar los comentarios
        await db_1.pool.query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
    }
    async isOwner(commentId, userId) {
        const [rows] = await db_1.pool.query("SELECT user_id FROM comentarios WHERE id = ?", [commentId]);
        if (rows.length === 0 || !rows[0])
            return false;
        return rows[0].user_id === userId;
    }
    async canDelete(commentId, userId) {
        const [rows] = await db_1.pool.query(`SELECT c.user_id as comment_user_id, p.user_id as page_user_id
       FROM comentarios c
       INNER JOIN paginas p ON c.pagina_id = p.id
       WHERE c.id = ?`, [commentId]);
        if (rows.length === 0 || !rows[0])
            return false;
        const { comment_user_id, page_user_id } = rows[0];
        // Puede eliminar si es propietario del comentario o propietario de la página
        return comment_user_id === userId || page_user_id === userId;
    }
    async findRecent(limit = 10) {
        const [rows] = await db_1.pool.query(`SELECT c.*, u.username, p.titulo as pagina_titulo, p.id as pagina_id
       FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN paginas p ON c.pagina_id = p.id
       WHERE p.descripcion = 'visible'
       ORDER BY c.creado_en DESC
       LIMIT ?`, [limit]);
        return rows;
    }
    async search(searchTerm, limit = 20, offset = 0) {
        const searchPattern = `%${searchTerm}%`;
        const [rows] = await db_1.pool.query(`SELECT c.*, u.username, p.titulo as pagina_titulo
       FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN paginas p ON c.pagina_id = p.id
       WHERE c.comentario LIKE ? AND p.descripcion = 'visible'
       ORDER BY c.creado_en DESC
       LIMIT ? OFFSET ?`, [searchPattern, limit, offset]);
        return rows;
    }
}
exports.CommentRepository = CommentRepository;
//# sourceMappingURL=CommentRepository.js.map