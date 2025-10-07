"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedService = void 0;
const { getPool } = require("../middlewares/db");
class FeedService {
    /**
     * Obtener feed completo con paginación
     */
    async getFeed(limit = 20, offset = 0) {
        const [rows] = await getPool().query(`SELECT f.*, u.username, u.foto_perfil
       FROM feed f 
       INNER JOIN users u ON f.user_id = u.id 
       INNER JOIN paginas p ON f.pagina_id = p.id 
       WHERE p.descripcion = 'visible'
       ORDER BY f.actualizado_en DESC, f.creado_en DESC 
       LIMIT ? OFFSET ?`, [limit, offset]);
        // Enriquecer con imágenes
        return await this.enrichFeedWithImages(rows);
    }
    /**
     * Obtener feed de un usuario específico
     */
    async getUserFeed(userId, limit = 20, offset = 0) {
        const [rows] = await getPool().query(`SELECT f.*, u.username, u.foto_perfil
       FROM feed f 
       INNER JOIN users u ON f.user_id = u.id 
       WHERE f.user_id = ?
       ORDER BY f.actualizado_en DESC, f.creado_en DESC 
       LIMIT ? OFFSET ?`, [userId, limit, offset]);
        return await this.enrichFeedWithImages(rows);
    }
    /**
     * Obtener entrada específica del feed
     */
    async getFeedEntry(feedId) {
        const [rows] = await getPool().query(`SELECT f.*, u.username, u.foto_perfil
       FROM feed f 
       INNER JOIN users u ON f.user_id = u.id 
       WHERE f.id = ?`, [feedId]);
        if (rows.length === 0)
            return null;
        const enrichedEntries = await this.enrichFeedWithImages(rows);
        return enrichedEntries[0] ?? null;
    }
    /**
     * Crear entrada en el feed cuando se crea una página
     */
    async createFeedEntry(userId, pageId, titulo, contenido) {
        const [result] = await getPool().query("INSERT INTO feed (user_id, pagina_id, titulo, contenido) VALUES (?, ?, ?, ?)", [userId, pageId, titulo, contenido]);
        return result.insertId;
    }
    /**
     * Actualizar entrada del feed cuando se modifica una página
     */
    async updateFeedEntry(pageId, titulo, contenido) {
        await getPool().query("UPDATE feed SET titulo = ?, contenido = ?, actualizado_en = NOW() WHERE pagina_id = ?", [titulo, contenido, pageId]);
    }
    /**
     * Eliminar entrada del feed
     */
    async deleteFeedEntry(pageId) {
        await getPool().query("DELETE FROM feed WHERE pagina_id = ?", [pageId]);
    }
    /**
     * Eliminar todas las entradas de un usuario
     */
    async deleteUserFeedEntries(userId) {
        await getPool().query("DELETE FROM feed WHERE user_id = ?", [userId]);
    }
    /**
     * Buscar en el feed
     */
    async searchFeed(searchTerm, limit = 20, offset = 0) {
        const searchPattern = `%${searchTerm}%`;
        const [rows] = await getPool().query(`SELECT f.*, u.username, u.foto_perfil
       FROM feed f 
       INNER JOIN users u ON f.user_id = u.id 
       INNER JOIN paginas p ON f.pagina_id = p.id 
       WHERE (f.titulo LIKE ? OR f.contenido LIKE ?) 
       AND p.descripcion = 'visible'
       ORDER BY f.actualizado_en DESC, f.creado_en DESC 
       LIMIT ? OFFSET ?`, [searchPattern, searchPattern, limit, offset]);
        return await this.enrichFeedWithImages(rows);
    }
    /**
     * Obtener estadísticas del feed
     */
    async getFeedStats() {
        // Total de entradas
        const [totalRows] = await getPool().query("SELECT COUNT(*) as count FROM feed");
        // Total de usuarios únicos
        const [usersRows] = await getPool().query("SELECT COUNT(DISTINCT user_id) as count FROM feed");
        // Entradas últimas 24 horas
        const [recentRows] = await getPool().query("SELECT COUNT(*) as count FROM feed WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
        // Usuario más activo
        const [activeUserRows] = await getPool().query(`SELECT u.username, COUNT(*) as entries 
       FROM feed f 
       INNER JOIN users u ON f.user_id = u.id 
       GROUP BY f.user_id, u.username 
       ORDER BY entries DESC 
       LIMIT 1`);
        return {
            totalEntries: totalRows[0]?.count ?? 0,
            totalUsers: usersRows[0]?.count ?? 0,
            entriesLast24h: recentRows[0]?.count ?? 0,
            mostActiveUser: activeUserRows.length > 0 ? (activeUserRows[0] ?? null) : null
        };
    }
    /**
     * Sincronizar feed con páginas existentes
     * Útil para migración o corrección de datos
     */
    async syncFeedWithPages() {
        let created = 0;
        let updated = 0;
        // Obtener todas las páginas visibles
        const [pages] = await getPool().query("SELECT * FROM paginas WHERE descripcion = 'visible'");
        for (const page of pages) {
            // Verificar si ya existe en el feed
            const [existing] = await getPool().query("SELECT id FROM feed WHERE pagina_id = ?", [page.id]);
            if (existing.length > 0) {
                // Actualizar entrada existente
                await this.updateFeedEntry(page.id, page.titulo, page.contenido);
                updated++;
            }
            else {
                // Crear nueva entrada
                await this.createFeedEntry(page.user_id, page.id, page.titulo, page.contenido);
                created++;
            }
        }
        return { created, updated };
    }
    /**
     * Enriquecer entradas del feed con imágenes
     */
    async enrichFeedWithImages(feedEntries) {
        const enriched = [];
        for (const entry of feedEntries) {
            // Obtener imágenes de la página
            const [images] = await getPool().query("SELECT * FROM imagenes WHERE pagina_id = ? ORDER BY creado_en DESC LIMIT 5", [entry.pagina_id]);
            enriched.push({
                id: entry.id,
                user_id: entry.user_id,
                pagina_id: entry.pagina_id,
                titulo: entry.titulo,
                contenido: entry.contenido,
                creado_en: entry.creado_en,
                actualizado_en: entry.actualizado_en,
                username: entry.username,
                imagenes: images,
                // Convertir Buffer a base64 para el frontend
                foto_perfil_url: entry.foto_perfil ?
                    `data:image/jpeg;base64,${entry.foto_perfil.toString('base64')}` :
                    null
            });
        }
        return enriched;
    }
    /**
     * Limpiar entradas huérfanas del feed
     */
    async cleanOrphanedEntries() {
        const [result] = await getPool().query(`DELETE f FROM feed f 
       LEFT JOIN paginas p ON f.pagina_id = p.id 
       WHERE p.id IS NULL`);
        return result.affectedRows;
    }
    /**
     * Obtener feed de páginas seguidas por un usuario
     * TODO: Implementar sistema de follows
     */
    async getFollowingFeed(userId, limit = 20, offset = 0) {
        // Por ahora retorna feed general, en el futuro implementar follows
        return this.getFeed(limit, offset);
    }
}
exports.FeedService = FeedService;
//# sourceMappingURL=FeedService.js.map