"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedRepository = void 0;
const db_1 = require("../middlewares/db");
const logger_1 = __importDefault(require("../utils/logger"));
class FeedRepository {
    /**
     * Obtiene todas las entradas del feed con paginación.
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de entradas de feed enriquecidas
     */
    async findAll(limit = 20, offset = 0) {
        try {
            const [rows] = await db_1.pool.query(`SELECT f.*, u.username, u.display_name, u.foto_perfil
          FROM feed f
          INNER JOIN users u ON f.user_id = u.id
          ORDER BY f.actualizado_en DESC, f.creado_en DESC
          LIMIT ? OFFSET ?`, [limit, offset]);
            logger_1.default.info(`findAll ejecutado con limit ${limit} y offset ${offset}`);
            return await this.enrichFeedWithImages(rows);
        }
        catch (error) {
            logger_1.default.error(`Error en findAll: ${error}`);
            throw error;
        }
    }
    /**
     * Obtiene entradas del feed de un usuario con paginación.
     * @param userId ID del usuario
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de entradas de feed enriquecidas
     */
    async findByUser(userId, limit = 20, offset = 0) {
        try {
            const [rows] = await db_1.pool.query(`SELECT f.*, u.username, u.display_name, u.foto_perfil
          FROM feed f
          INNER JOIN users u ON f.user_id = u.id
          WHERE f.user_id = ?
          ORDER BY f.actualizado_en DESC, f.creado_en DESC
          LIMIT ? OFFSET ?`, [userId, limit, offset]);
            logger_1.default.info(`findByUser ejecutado para usuario ${userId}`);
            return await this.enrichFeedWithImages(rows);
        }
        catch (error) {
            logger_1.default.error(`Error en findByUser: ${error}`);
            throw error;
        }
    }
    /**
     * Busca una entrada de feed por su ID.
     * @param feedId ID de la entrada de feed
     * @returns Entrada de feed enriquecida o null
     */
    async findById(feedId) {
        try {
            const [rows] = await db_1.pool.query(`SELECT f.*, u.username, u.display_name, u.foto_perfil
          FROM feed f
          INNER JOIN users u ON f.user_id = u.id
          WHERE f.id = ?`, [feedId]);
            logger_1.default.info(`findById ejecutado para feed ${feedId}`);
            if (rows.length === 0)
                return null;
            const enrichedEntries = await this.enrichFeedWithImages(rows);
            return enrichedEntries[0] ?? null;
        }
        catch (error) {
            logger_1.default.error(`Error en findById: ${error}`);
            throw error;
        }
    }
    /**
     * Crea una entrada de feed para un nuevo usuario.
     * @param userId ID del usuario
     * @param username Username del usuario
     * @returns ID de la nueva entrada de feed
     */
    async createForUser(userId, username) {
        try {
            const fotoUrl = `/api/auth/user/${userId}/foto`;
            const mensaje = `Nuevo usuario registrado: <img src='${fotoUrl}' alt='foto' style='width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;' /><a href="/pagina/${username}">${username}</a>`;
            const [result] = await db_1.pool.query("INSERT INTO feed (user_id, mensaje) VALUES (?, ?)", [userId, mensaje]);
            logger_1.default.info(`createForUser ejecutado para usuario ${userId}`);
            return result.insertId;
        }
        catch (error) {
            logger_1.default.error(`Error en createForUser: ${error}`);
            throw error;
        }
    }
    /**
     * Crea una entrada de feed para una página.
     * @param userId ID del usuario
     * @param pageId ID de la página
     * @param titulo Título
     * @param contenido Contenido
     * @returns ID de la nueva entrada de feed
     */
    async createForPage(userId, pageId, titulo, contenido) {
        try {
            const [result] = await db_1.pool.query("INSERT INTO feed (user_id, pagina_id, titulo, contenido) VALUES (?, ?, ?, ?)", [userId, pageId, titulo, contenido]);
            logger_1.default.info(`createForPage ejecutado para página ${pageId}`);
            return result.insertId;
        }
        catch (error) {
            logger_1.default.error(`Error en createForPage: ${error}`);
            throw error;
        }
    }
    /**
     * Actualiza una entrada de feed para una página.
     * @param pageId ID de la página
     * @param titulo Título
     * @param contenido Contenido
     */
    async updateForPage(pageId, titulo, contenido) {
        try {
            await db_1.pool.query("UPDATE feed SET titulo = ?, contenido = ?, actualizado_en = NOW() WHERE pagina_id = ?", [titulo, contenido, pageId]);
            logger_1.default.info(`updateForPage ejecutado para página ${pageId}`);
        }
        catch (error) {
            logger_1.default.error(`Error en updateForPage: ${error}`);
            throw error;
        }
    }
    /**
     * Elimina entradas de feed por página.
     * @param pageId ID de la página
     */
    async deleteByPage(pageId) {
        try {
            await db_1.pool.query("DELETE FROM feed WHERE pagina_id = ?", [pageId]);
            logger_1.default.info(`deleteByPage ejecutado para página ${pageId}`);
        }
        catch (error) {
            logger_1.default.error(`Error en deleteByPage: ${error}`);
            throw error;
        }
    }
    /**
     * Elimina entradas de feed por usuario.
     * @param userId ID del usuario
     */
    async deleteByUser(userId) {
        try {
            await db_1.pool.query("DELETE FROM feed WHERE user_id = ?", [userId]);
            logger_1.default.info(`deleteByUser ejecutado para usuario ${userId}`);
        }
        catch (error) {
            logger_1.default.error(`Error en deleteByUser: ${error}`);
            throw error;
        }
    }
    /**
     * Busca entradas de feed por término de búsqueda.
     * @param searchTerm Término de búsqueda
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de entradas de feed enriquecidas
     */
    async search(searchTerm, limit = 20, offset = 0) {
        try {
            const searchPattern = `%${searchTerm}%`;
            const [rows] = await db_1.pool.query(`SELECT f.*, u.username, u.display_name, u.foto_perfil
          FROM feed f
          INNER JOIN users u ON f.user_id = u.id
          INNER JOIN paginas p ON f.pagina_id = p.id
          WHERE (f.titulo LIKE ? OR f.contenido LIKE ?)
          ORDER BY f.actualizado_en DESC, f.creado_en DESC
          LIMIT ? OFFSET ?`, [searchPattern, searchPattern, limit, offset]);
            logger_1.default.info(`search ejecutado con término '${searchTerm}'`);
            return await this.enrichFeedWithImages(rows);
        }
        catch (error) {
            logger_1.default.error(`Error en search: ${error}`);
            throw error;
        }
    }
    /**
     * Obtiene estadísticas del feed (total, usuarios, últimas 24h, usuario más activo).
     * @returns Objeto con estadísticas
     */
    async getStats() {
        try {
            const [totalRows] = await db_1.pool.query("SELECT COUNT(*) as count FROM feed");
            const [usersRows] = await db_1.pool.query("SELECT COUNT(DISTINCT user_id) as count FROM feed");
            const [recentRows] = await db_1.pool.query("SELECT COUNT(*) as count FROM feed WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            const [activeUserRows] = await db_1.pool.query(`SELECT u.username, COUNT(*) as entries
         FROM feed f
         INNER JOIN users u ON f.user_id = u.id
         GROUP BY f.user_id, u.username
         ORDER BY entries DESC
         LIMIT 1`);
            logger_1.default.info(`getStats ejecutado`);
            return {
                totalEntries: totalRows[0]?.count ?? 0,
                totalUsers: usersRows[0]?.count ?? 0,
                entriesLast24h: recentRows[0]?.count ?? 0,
                mostActiveUser: activeUserRows.length > 0 ? (activeUserRows[0] ?? null) : null
            };
        }
        catch (error) {
            logger_1.default.error(`Error en getStats: ${error}`);
            throw error;
        }
    }
    /**
     * Sincroniza el feed con las páginas visibles (crea/actualiza entradas).
     * @returns Objeto con cantidad de entradas creadas y actualizadas
     */
    async syncWithPages() {
        let created = 0;
        let updated = 0;
        try {
            const [pages] = await db_1.pool.query("SELECT * FROM paginas");
            for (const page of pages) {
                const [existing] = await db_1.pool.query("SELECT id FROM feed WHERE pagina_id = ?", [page.id]);
                if (existing.length > 0) {
                    await this.updateForPage(page.id, page.titulo, page.contenido);
                    updated++;
                }
                else {
                    await this.createForPage(page.user_id, page.id, page.titulo, page.contenido);
                    created++;
                }
            }
            logger_1.default.info(`syncWithPages ejecutado: ${created} creadas, ${updated} actualizadas`);
            return { created, updated };
        }
        catch (error) {
            logger_1.default.error(`Error en syncWithPages: ${error}`);
            throw error;
        }
    }
    /**
     * Elimina entradas de feed huérfanas (sin página asociada).
     * @returns Número de entradas eliminadas
     */
    async cleanOrphaned() {
        try {
            const [result] = await db_1.pool.query(`DELETE f FROM feed f
          LEFT JOIN paginas p ON f.pagina_id = p.id
          WHERE p.id IS NULL`);
            logger_1.default.info(`cleanOrphaned ejecutado`);
            return result.affectedRows;
        }
        catch (error) {
            logger_1.default.error(`Error en cleanOrphaned: ${error}`);
            throw error;
        }
    }
    /**
     * Actualiza enlaces antiguos en el feed.
     * @returns Número de enlaces actualizados
     */
    async updateLegacyLinks() {
        try {
            const [result] = await db_1.pool.query(`UPDATE feed SET enlace = CONCAT('/', SUBSTRING(enlace, 9), '/pagina/1') WHERE enlace LIKE '/pagina/%'`);
            logger_1.default.info(`updateLegacyLinks ejecutado`);
            return result.affectedRows;
        }
        catch (error) {
            logger_1.default.error(`Error en updateLegacyLinks: ${error}`);
            throw error;
        }
    }
    /**
     * Obtiene el feed de usuarios seguidos (por ahora retorna feed general).
     * @param userId ID del usuario
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de entradas de feed
     */
    async findFollowing(userId, limit = 20, offset = 0) {
        // Por ahora retorna feed general, en el futuro implementar follows
        logger_1.default.info(`findFollowing ejecutado para usuario ${userId}`);
        return this.findAll(limit, offset);
    }
    async enrichFeedWithImages(feedEntries) {
        const enriched = [];
        for (const entry of feedEntries) {
            // Obtener imágenes de la página
            const [images] = await db_1.pool.query("SELECT * FROM imagenes WHERE pagina_id = ? ORDER BY creado_en DESC LIMIT 5", [entry.pagina_id]);
            // Obtener el número de página
            let pageNumber = 1; // Default
            if (entry.pagina_id) {
                const pageRepo = (await Promise.resolve().then(() => __importStar(require('./PageRepository')))).PageRepository;
                const repo = new pageRepo();
                const num = await repo.getPageNumber(entry.pagina_id);
                if (num)
                    pageNumber = num;
            }
            // Limpiar enlaces del mensaje para evitar conflictos
            const cleanMensaje = entry.mensaje ? entry.mensaje.replace(/<a[^>]*>(.*?)<\/a>/g, '$1') : '';
            const result = {
                id: entry.id,
                user_id: entry.user_id,
                pagina_id: entry.pagina_id,
                titulo: entry.titulo,
                contenido: entry.contenido,
                creado_en: entry.creado_en,
                actualizado_en: entry.actualizado_en,
                username: entry.display_name || entry.username,
                imagenes: images,
                pageNumber: pageNumber,
                // Convertir Buffer a base64 para el frontend
                foto_perfil_url: entry.foto_perfil ?
                    `data:image/jpeg;base64,${entry.foto_perfil.toString('base64')}` :
                    null
            };
            if (cleanMensaje) {
                result.mensaje = cleanMensaje;
            }
            enriched.push(result);
        }
        return enriched;
    }
}
exports.FeedRepository = FeedRepository;
//# sourceMappingURL=FeedRepository.js.map