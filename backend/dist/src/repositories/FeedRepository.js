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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedRepository = void 0;
const db_1 = require("../middlewares/db");
class FeedRepository {
    async findAll(limit = 20, offset = 0) {
        const [rows] = await db_1.pool.query(`SELECT f.*, u.username, u.display_name, u.foto_perfil
        FROM feed f
        INNER JOIN users u ON f.user_id = u.id
        ORDER BY f.actualizado_en DESC, f.creado_en DESC
        LIMIT ? OFFSET ?`, [limit, offset]);
        return await this.enrichFeedWithImages(rows);
    }
    async findByUser(userId, limit = 20, offset = 0) {
        const [rows] = await db_1.pool.query(`SELECT f.*, u.username, u.display_name, u.foto_perfil
        FROM feed f
        INNER JOIN users u ON f.user_id = u.id
        WHERE f.user_id = ?
        ORDER BY f.actualizado_en DESC, f.creado_en DESC
        LIMIT ? OFFSET ?`, [userId, limit, offset]);
        return await this.enrichFeedWithImages(rows);
    }
    async findById(feedId) {
        const [rows] = await db_1.pool.query(`SELECT f.*, u.username, u.display_name, u.foto_perfil
        FROM feed f
        INNER JOIN users u ON f.user_id = u.id
        WHERE f.id = ?`, [feedId]);
        if (rows.length === 0)
            return null;
        const enrichedEntries = await this.enrichFeedWithImages(rows);
        return enrichedEntries[0] ?? null;
    }
    async createForUser(userId, username) {
        const fotoUrl = `/api/auth/user/${userId}/foto`;
        const mensaje = `Nuevo usuario registrado: <img src='${fotoUrl}' alt='foto' style='width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;' /><a href="/pagina/${username}">${username}</a>`;
        const [result] = await db_1.pool.query("INSERT INTO feed (user_id, mensaje) VALUES (?, ?)", [userId, mensaje]);
        return result.insertId;
    }
    async createForPage(userId, pageId, titulo, contenido) {
        const [result] = await db_1.pool.query("INSERT INTO feed (user_id, pagina_id, titulo, contenido) VALUES (?, ?, ?, ?)", [userId, pageId, titulo, contenido]);
        return result.insertId;
    }
    async updateForPage(pageId, titulo, contenido) {
        await db_1.pool.query("UPDATE feed SET titulo = ?, contenido = ?, actualizado_en = NOW() WHERE pagina_id = ?", [titulo, contenido, pageId]);
    }
    async deleteByPage(pageId) {
        await db_1.pool.query("DELETE FROM feed WHERE pagina_id = ?", [pageId]);
    }
    async deleteByUser(userId) {
        await db_1.pool.query("DELETE FROM feed WHERE user_id = ?", [userId]);
    }
    async search(searchTerm, limit = 20, offset = 0) {
        const searchPattern = `%${searchTerm}%`;
        const [rows] = await db_1.pool.query(`SELECT f.*, u.username, u.display_name, u.foto_perfil
        FROM feed f
        INNER JOIN users u ON f.user_id = u.id
        INNER JOIN paginas p ON f.pagina_id = p.id
        WHERE (f.titulo LIKE ? OR f.contenido LIKE ?)
        ORDER BY f.actualizado_en DESC, f.creado_en DESC
        LIMIT ? OFFSET ?`, [searchPattern, searchPattern, limit, offset]);
        return await this.enrichFeedWithImages(rows);
    }
    async getStats() {
        // Total de entradas
        const [totalRows] = await db_1.pool.query("SELECT COUNT(*) as count FROM feed");
        // Total de usuarios únicos
        const [usersRows] = await db_1.pool.query("SELECT COUNT(DISTINCT user_id) as count FROM feed");
        // Entradas últimas 24 horas
        const [recentRows] = await db_1.pool.query("SELECT COUNT(*) as count FROM feed WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
        // Usuario más activo
        const [activeUserRows] = await db_1.pool.query(`SELECT u.username, COUNT(*) as entries
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
    async syncWithPages() {
        let created = 0;
        let updated = 0;
        // Obtener todas las páginas visibles
        const [pages] = await db_1.pool.query("SELECT * FROM paginas WHERE descripcion = 'visible'");
        for (const page of pages) {
            // Verificar si ya existe en el feed
            const [existing] = await db_1.pool.query("SELECT id FROM feed WHERE pagina_id = ?", [page.id]);
            if (existing.length > 0) {
                // Actualizar entrada existente
                await this.updateForPage(page.id, page.titulo, page.contenido);
                updated++;
            }
            else {
                // Crear nueva entrada
                await this.createForPage(page.user_id, page.id, page.titulo, page.contenido);
                created++;
            }
        }
        return { created, updated };
    }
    async cleanOrphaned() {
        const [result] = await db_1.pool.query(`DELETE f FROM feed f
        LEFT JOIN paginas p ON f.pagina_id = p.id
        WHERE p.id IS NULL`);
        return result.affectedRows;
    }
    async updateLegacyLinks() {
        // Actualizar enlaces antiguos que apuntan a /pagina/username a /username/pagina/1
        const [result] = await db_1.pool.query(`UPDATE feed SET enlace = CONCAT('/', SUBSTRING(enlace, 9), '/pagina/1') WHERE enlace LIKE '/pagina/%'`);
        return result.affectedRows;
    }
    async findFollowing(userId, limit = 20, offset = 0) {
        // Por ahora retorna feed general, en el futuro implementar follows
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