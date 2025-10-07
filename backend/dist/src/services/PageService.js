"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageService = void 0;
const { getPool } = require("../middlewares/db");
class PageService {
    /**
     * Obtener página por ID con imágenes
     */
    async getPageWithImages(pageId) {
        // Obtener datos de la página
        const [pageRows] = await getPool().query("SELECT * FROM paginas WHERE id = ?", [pageId]);
        if (pageRows.length === 0)
            return null;
        const pagina = pageRows[0];
        // Obtener imágenes de la página
        const [imageRows] = await getPool().query("SELECT * FROM imagenes WHERE pagina_id = ? ORDER BY creado_en DESC", [pageId]);
        return {
            ...pagina,
            imagenes: imageRows
        };
    }
    /**
     * Obtener página por usuario (username)
     */
    async getPageByUsername(username) {
        const [rows] = await getPool().query(`SELECT p.* FROM paginas p 
       INNER JOIN users u ON p.user_id = u.id 
       WHERE u.username = ?`, [username]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    /**
     * Obtener todas las páginas públicas con paginación
     */
    async getPublicPages(limit = 20, offset = 0) {
        const [rows] = await getPool().query("SELECT * FROM paginas WHERE descripcion = 'visible' ORDER BY creado_en DESC LIMIT ? OFFSET ?", [limit, offset]);
        return rows;
    }
    /**
     * Crear nueva página
     */
    async createPage(userId, pageData) {
        const { titulo, contenido, descripcion, usuario, comentarios } = pageData;
        const [result] = await getPool().query("INSERT INTO paginas (user_id, propietario, titulo, contenido, descripcion, usuario, comentarios) VALUES (?, 1, ?, ?, ?, ?, ?)", [userId, titulo, contenido, descripcion || 'visible', usuario, comentarios || '']);
        return result.insertId;
    }
    /**
     * Actualizar página existente
     */
    async updatePage(pageId, updateData) {
        const fields = [];
        const values = [];
        // Construir query dinámicamente
        if (updateData.titulo !== undefined) {
            fields.push('titulo = ?');
            values.push(updateData.titulo);
        }
        if (updateData.contenido !== undefined) {
            fields.push('contenido = ?');
            values.push(updateData.contenido);
        }
        if (updateData.descripcion !== undefined) {
            fields.push('descripcion = ?');
            values.push(updateData.descripcion);
        }
        if (updateData.comentarios !== undefined) {
            fields.push('comentarios = ?');
            values.push(updateData.comentarios);
        }
        if (fields.length === 0) {
            throw new Error("No hay campos para actualizar");
        }
        values.push(pageId);
        await getPool().query(`UPDATE paginas SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    /**
     * Eliminar página y todas sus imágenes
     */
    async deletePage(pageId) {
        // Eliminar imágenes primero (foreign key)
        await getPool().query("DELETE FROM imagenes WHERE pagina_id = ?", [pageId]);
        // Eliminar comentarios de la página
        await getPool().query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
        // Eliminar entrada del feed
        await getPool().query("DELETE FROM feed WHERE pagina_id = ?", [pageId]);
        // Eliminar página
        await getPool().query("DELETE FROM paginas WHERE id = ?", [pageId]);
    }
    /**
     * Agregar imagen a una página
     */
    async addImageToPage(pageId, imageBuffer, mimeType) {
        const [result] = await getPool().query("INSERT INTO imagenes (pagina_id, imagen_buffer, mime_type) VALUES (?, ?, ?)", [pageId, imageBuffer, mimeType]);
        const imageId = result.insertId;
        // Actualizar el feed si es necesario
        await this.updatePageInFeed(pageId);
        return imageId;
    }
    /**
     * Eliminar imagen específica
     */
    async removeImage(imageId, pageId) {
        await getPool().query("DELETE FROM imagenes WHERE id = ? AND pagina_id = ?", [imageId, pageId]);
        // Actualizar el feed
        await this.updatePageInFeed(pageId);
    }
    /**
     * Verificar si una página existe
     */
    async pageExists(pageId) {
        const [rows] = await getPool().query("SELECT COUNT(*) as count FROM paginas WHERE id = ?", [pageId]);
        return (rows[0]?.count ?? 0) > 0;
    }
    /**
     * Obtener el propietario de una página
     */
    async getPageOwner(pageId) {
        const [rows] = await getPool().query("SELECT user_id FROM paginas WHERE id = ?", [pageId]);
        return rows.length > 0 ? (rows[0]?.user_id ?? null) : null;
    }
    /**
     * Actualizar página en el feed (privado)
     */
    async updatePageInFeed(pageId) {
        // Obtener datos de la página
        const [pageRows] = await getPool().query("SELECT * FROM paginas WHERE id = ?", [pageId]);
        if (pageRows.length === 0)
            return;
        const pagina = pageRows[0];
        // Verificar si ya existe en el feed
        const [feedRows] = await getPool().query("SELECT id FROM feed WHERE pagina_id = ?", [pageId]);
        if (feedRows.length > 0) {
            // Actualizar entrada existente
            await getPool().query("UPDATE feed SET titulo = ?, contenido = ?, actualizado_en = NOW() WHERE pagina_id = ?", [pagina?.titulo, pagina?.contenido, pageId]);
        }
        else {
            // Crear nueva entrada en el feed
            await getPool().query("INSERT INTO feed (user_id, pagina_id, titulo, contenido) VALUES (?, ?, ?, ?)", [pagina?.user_id, pageId, pagina?.titulo, pagina?.contenido]);
        }
    }
    /**
     * Cambiar visibilidad de página
     */
    async togglePageVisibility(pageId) {
        const [rows] = await getPool().query("SELECT descripcion FROM paginas WHERE id = ?", [pageId]);
        if (rows.length === 0) {
            throw new Error("Página no encontrada");
        }
        const currentVisibility = rows[0]?.descripcion ?? 'visible';
        const newVisibility = currentVisibility === 'visible' ? 'oculta' : 'visible';
        await getPool().query("UPDATE paginas SET descripcion = ? WHERE id = ?", [newVisibility, pageId]);
        return newVisibility;
    }
    /**
     * Obtener estadísticas de página
     */
    async getPageStats(pageId) {
        const [comentariosRows] = await getPool().query("SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?", [pageId]);
        const [imagenesRows] = await getPool().query("SELECT COUNT(*) as count FROM imagenes WHERE pagina_id = ?", [pageId]);
        return {
            comentarios: comentariosRows[0]?.count ?? 0,
            imagenes: imagenesRows[0]?.count ?? 0,
            visitas: 0 // TODO: Implementar contador de visitas
        };
    }
}
exports.PageService = PageService;
//# sourceMappingURL=PageService.js.map