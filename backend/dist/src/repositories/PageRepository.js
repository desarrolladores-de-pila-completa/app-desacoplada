"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageRepository = void 0;
const db_1 = require("../middlewares/db");
class PageRepository {
    async create(userId, pageData) {
        const { usuario } = pageData;
        const [result] = await db_1.pool.query("INSERT INTO paginas (user_id, propietario, usuario) VALUES (?, 1, ?)", [userId, usuario]);
        return result.insertId;
    }
    async findById(pageId) {
        const [rows] = await db_1.pool.query("SELECT * FROM paginas WHERE id = ?", [pageId]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    async findWithImages(pageId) {
        // Obtener datos de la página
        const [pageRows] = await db_1.pool.query("SELECT * FROM paginas WHERE id = ?", [pageId]);
        if (pageRows.length === 0)
            return null;
        const pagina = pageRows[0];
        // Obtener imágenes de la página
        const [imageRows] = await db_1.pool.query("SELECT * FROM imagenes WHERE pagina_id = ? ORDER BY creado_en DESC", [pageId]);
        return {
            ...pagina,
            imagenes: imageRows
        };
    }
    async findByUsername(username) {
        const [rows] = await db_1.pool.query(`SELECT p.* FROM paginas p
       INNER JOIN users u ON p.user_id = u.id
       WHERE u.username = ?
       ORDER BY p.id DESC LIMIT 1`, [username]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    async findByUsernameAndPageNumber(username, pageNumber) {
        // Obtener el user_id del username
        const [userRows] = await db_1.pool.query("SELECT id FROM users WHERE username = ?", [username]);
        if (userRows.length === 0)
            return null;
        const userId = userRows[0]?.id;
        if (!userId)
            return null;
        // Obtener la página número pageNumber del usuario, ordenada por id ASC
        const [rows] = await db_1.pool.query(`SELECT * FROM paginas
       WHERE user_id = ?
       ORDER BY id ASC
       LIMIT 1 OFFSET ?`, [userId, pageNumber - 1] // OFFSET 0 para página 1, 1 para página 2, etc.
        );
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    async findPublic(limit = 20, offset = 0) {
        const [rows] = await db_1.pool.query("SELECT * FROM paginas WHERE descripcion = 'visible' ORDER BY creado_en DESC LIMIT ? OFFSET ?", [limit, offset]);
        return rows;
    }
    async update(pageId, updateData) {
        // En la nueva estructura simplificada, no hay campos para actualizar
        // Esta función se mantiene por compatibilidad pero no hace nada
        return;
    }
    async delete(pageId) {
        // Eliminar imágenes primero (foreign key)
        await db_1.pool.query("DELETE FROM imagenes WHERE pagina_id = ?", [pageId]);
        // Eliminar comentarios de la página
        await db_1.pool.query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
        // Eliminar página
        await db_1.pool.query("DELETE FROM paginas WHERE id = ?", [pageId]);
    }
    async exists(pageId) {
        const [rows] = await db_1.pool.query("SELECT COUNT(*) as count FROM paginas WHERE id = ?", [pageId]);
        return (rows[0]?.count ?? 0) > 0;
    }
    async getOwner(pageId) {
        const [rows] = await db_1.pool.query("SELECT user_id FROM paginas WHERE id = ?", [pageId]);
        return rows.length > 0 ? (rows[0]?.user_id ?? null) : null;
    }
    async toggleVisibility(pageId) {
        const [rows] = await db_1.pool.query("SELECT descripcion FROM paginas WHERE id = ?", [pageId]);
        if (rows.length === 0) {
            throw new Error("Página no encontrada");
        }
        const currentVisibility = rows[0]?.descripcion ?? 'visible';
        const newVisibility = currentVisibility === 'visible' ? 'oculta' : 'visible';
        await db_1.pool.query("UPDATE paginas SET descripcion = ? WHERE id = ?", [newVisibility, pageId]);
        return newVisibility;
    }
    async addImage(pageId, imageBuffer, mimeType) {
        const [result] = await db_1.pool.query("INSERT INTO imagenes (pagina_id, imagen_buffer, mime_type) VALUES (?, ?, ?)", [pageId, imageBuffer, mimeType]);
        return result.insertId;
    }
    async removeImage(imageId, pageId) {
        await db_1.pool.query("DELETE FROM imagenes WHERE id = ? AND pagina_id = ?", [imageId, pageId]);
    }
    async getStats(pageId) {
        const [comentariosRows] = await db_1.pool.query("SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?", [pageId]);
        const [imagenesRows] = await db_1.pool.query("SELECT COUNT(*) as count FROM imagenes WHERE pagina_id = ?", [pageId]);
        return {
            comentarios: comentariosRows[0]?.count ?? 0,
            imagenes: imagenesRows[0]?.count ?? 0,
            visitas: 0 // TODO: Implementar contador de visitas
        };
    }
    async getPageNumber(pageId) {
        // Obtener el user_id de la página
        const [pageRows] = await db_1.pool.query("SELECT user_id FROM paginas WHERE id = ?", [pageId]);
        if (pageRows.length === 0)
            return null;
        const userId = pageRows[0]?.user_id;
        if (!userId)
            return null;
        // Contar cuántas páginas tiene el usuario con id <= pageId, ordenadas por id ASC
        const [countRows] = await db_1.pool.query(`SELECT COUNT(*) as count FROM paginas
       WHERE user_id = ? AND id <= ?
       ORDER BY id ASC`, [userId, pageId]);
        return countRows[0]?.count ?? null;
    }
}
exports.PageRepository = PageRepository;
//# sourceMappingURL=PageRepository.js.map