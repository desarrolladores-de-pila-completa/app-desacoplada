"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageRepository = void 0;
const db_1 = require("../middlewares/db");
const logger_1 = __importDefault(require("../utils/logger"));
class PageRepository {
    /**
     * Crea una nueva página para el usuario especificado.
     * @param userId ID del usuario propietario
     * @param pageData Datos de la página a crear
     * @returns ID de la nueva página
     */
    async create(userId, pageData) {
        const { usuario } = pageData;
        try {
            const [result] = await db_1.pool.query("INSERT INTO paginas (user_id, propietario, usuario) VALUES (?, 1, ?)", [userId, usuario]);
            logger_1.default.info(`Página creada para usuario ${userId}`);
            return result.insertId;
        }
        catch (error) {
            logger_1.default.error(`Error al crear página: ${error}`);
            throw error;
        }
    }
    /**
     * Busca una página por su ID.
     * @param pageId ID de la página
     * @returns Página encontrada o null
     */
    async findById(pageId) {
        try {
            const [rows] = await db_1.pool.query("SELECT * FROM paginas WHERE id = ?", [pageId]);
            logger_1.default.info(`findById ejecutado para página ${pageId}`);
            return rows.length > 0 ? (rows[0] ?? null) : null;
        }
        catch (error) {
            logger_1.default.error(`Error en findById: ${error}`);
            throw error;
        }
    }
    /**
     * Busca una página y sus imágenes asociadas.
     * @param pageId ID de la página
     * @returns Página con imágenes o null
     */
    async findWithImages(pageId) {
        try {
            const [pageRows] = await db_1.pool.query("SELECT * FROM paginas WHERE id = ?", [pageId]);
            if (pageRows.length === 0)
                return null;
            const pagina = pageRows[0];
            const [imageRows] = await db_1.pool.query("SELECT * FROM imagenes WHERE pagina_id = ? ORDER BY creado_en DESC", [pageId]);
            logger_1.default.info(`findWithImages ejecutado para página ${pageId}`);
            return {
                ...pagina,
                imagenes: imageRows
            };
        }
        catch (error) {
            logger_1.default.error(`Error en findWithImages: ${error}`);
            throw error;
        }
    }
    /**
     * Busca la última página de un usuario por su username.
     * @param username Username del usuario
     * @returns Página encontrada o null
     */
    async findByUsername(username) {
        try {
            const [rows] = await db_1.pool.query(`SELECT p.* FROM paginas p
         INNER JOIN users u ON p.user_id = u.id
         WHERE u.username = ?
         ORDER BY p.id DESC LIMIT 1`, [username]);
            logger_1.default.info(`findByUsername ejecutado para usuario ${username}`);
            return rows.length > 0 ? (rows[0] ?? null) : null;
        }
        catch (error) {
            logger_1.default.error(`Error en findByUsername: ${error}`);
            throw error;
        }
    }
    /**
     * Busca la página número N de un usuario por su username.
     * @param username Username del usuario
     * @param pageNumber Número de página (1-based)
     * @returns Página encontrada o null
     */
    async findByUsernameAndPageNumber(username, pageNumber) {
        try {
            const [userRows] = await db_1.pool.query("SELECT id FROM users WHERE username = ?", [username]);
            if (userRows.length === 0)
                return null;
            const userId = userRows[0]?.id;
            if (!userId)
                return null;
            const [rows] = await db_1.pool.query(`SELECT * FROM paginas
         WHERE user_id = ?
         ORDER BY id ASC
         LIMIT 1 OFFSET ?`, [userId, pageNumber - 1]);
            logger_1.default.info(`findByUsernameAndPageNumber ejecutado para usuario ${username}, página ${pageNumber}`);
            return rows.length > 0 ? (rows[0] ?? null) : null;
        }
        catch (error) {
            logger_1.default.error(`Error en findByUsernameAndPageNumber: ${error}`);
            throw error;
        }
    }
    /**
     * Obtiene páginas públicas (visibles) con paginación.
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de páginas públicas
     */
    async findPublic(limit = 20, offset = 0) {
        try {
            const [rows] = await db_1.pool.query("SELECT * FROM paginas WHERE descripcion = 'visible' ORDER BY creado_en DESC LIMIT ? OFFSET ?", [limit, offset]);
            logger_1.default.info(`findPublic ejecutado con limit ${limit} y offset ${offset}`);
            return rows;
        }
        catch (error) {
            logger_1.default.error(`Error en findPublic: ${error}`);
            throw error;
        }
    }
    /**
     * Actualiza una página (sin efecto, compatibilidad).
     * @param pageId ID de la página
     * @param updateData Datos a actualizar
     */
    async update(pageId, updateData) {
        logger_1.default.info(`update ejecutado para página ${pageId} (sin efecto)`);
        return;
    }
    /**
     * Elimina una página y sus imágenes/comentarios asociados.
     * @param pageId ID de la página
     */
    async delete(pageId) {
        try {
            await db_1.pool.query("DELETE FROM imagenes WHERE pagina_id = ?", [pageId]);
            await db_1.pool.query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
            await db_1.pool.query("DELETE FROM paginas WHERE id = ?", [pageId]);
            logger_1.default.info(`Página ${pageId} eliminada`);
        }
        catch (error) {
            logger_1.default.error(`Error al eliminar página: ${error}`);
            throw error;
        }
    }
    /**
     * Verifica si existe una página por su ID.
     * @param pageId ID de la página
     * @returns true si existe, false si no
     */
    async exists(pageId) {
        try {
            const [rows] = await db_1.pool.query("SELECT COUNT(*) as count FROM paginas WHERE id = ?", [pageId]);
            logger_1.default.info(`exists ejecutado para página ${pageId}`);
            return (rows[0]?.count ?? 0) > 0;
        }
        catch (error) {
            logger_1.default.error(`Error en exists: ${error}`);
            throw error;
        }
    }
    /**
     * Obtiene el user_id propietario de una página.
     * @param pageId ID de la página
     * @returns user_id o null
     */
    async getOwner(pageId) {
        try {
            const [rows] = await db_1.pool.query("SELECT user_id FROM paginas WHERE id = ?", [pageId]);
            logger_1.default.info(`getOwner ejecutado para página ${pageId}`);
            return rows.length > 0 ? (rows[0]?.user_id ?? null) : null;
        }
        catch (error) {
            logger_1.default.error(`Error en getOwner: ${error}`);
            throw error;
        }
    }
    /**
     * Alterna la visibilidad de una página (visible/oculta).
     * @param pageId ID de la página
     * @returns Nuevo estado de visibilidad
     */
    async toggleVisibility(pageId) {
        try {
            const [rows] = await db_1.pool.query("SELECT descripcion FROM paginas WHERE id = ?", [pageId]);
            if (rows.length === 0) {
                logger_1.default.warn(`toggleVisibility: página ${pageId} no encontrada`);
                throw new Error("Página no encontrada");
            }
            const currentVisibility = rows[0]?.descripcion ?? 'visible';
            const newVisibility = currentVisibility === 'visible' ? 'oculta' : 'visible';
            await db_1.pool.query("UPDATE paginas SET descripcion = ? WHERE id = ?", [newVisibility, pageId]);
            logger_1.default.info(`toggleVisibility ejecutado para página ${pageId}: ${newVisibility}`);
            return newVisibility;
        }
        catch (error) {
            logger_1.default.error(`Error en toggleVisibility: ${error}`);
            throw error;
        }
    }
    /**
     * Agrega una imagen a una página.
     * @param pageId ID de la página
     * @param imageBuffer Buffer de la imagen
     * @param mimeType Tipo MIME de la imagen
     * @returns ID de la imagen agregada
     */
    async addImage(pageId, imageBuffer, mimeType) {
        try {
            const [result] = await db_1.pool.query("INSERT INTO imagenes (pagina_id, imagen_buffer, mime_type) VALUES (?, ?, ?)", [pageId, imageBuffer, mimeType]);
            logger_1.default.info(`Imagen agregada a página ${pageId}`);
            return result.insertId;
        }
        catch (error) {
            logger_1.default.error(`Error en addImage: ${error}`);
            throw error;
        }
    }
    /**
     * Elimina una imagen de una página.
     * @param imageId ID de la imagen
     * @param pageId ID de la página
     */
    async removeImage(imageId, pageId) {
        try {
            await db_1.pool.query("DELETE FROM imagenes WHERE id = ? AND pagina_id = ?", [imageId, pageId]);
            logger_1.default.info(`Imagen ${imageId} eliminada de página ${pageId}`);
        }
        catch (error) {
            logger_1.default.error(`Error en removeImage: ${error}`);
            throw error;
        }
    }
    /**
     * Obtiene estadísticas de una página (comentarios, imágenes, visitas).
     * @param pageId ID de la página
     * @returns Objeto con estadísticas
     */
    async getStats(pageId) {
        try {
            const [comentariosRows] = await db_1.pool.query("SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?", [pageId]);
            const [imagenesRows] = await db_1.pool.query("SELECT COUNT(*) as count FROM imagenes WHERE pagina_id = ?", [pageId]);
            logger_1.default.info(`getStats ejecutado para página ${pageId}`);
            return {
                comentarios: comentariosRows[0]?.count ?? 0,
                imagenes: imagenesRows[0]?.count ?? 0,
                visitas: 0 // TODO: Implementar contador de visitas
            };
        }
        catch (error) {
            logger_1.default.error(`Error en getStats: ${error}`);
            throw error;
        }
    }
    /**
     * Obtiene el número de página (posición) de una página para un usuario.
     * @param pageId ID de la página
     * @returns Número de página o null
     */
    async getPageNumber(pageId) {
        try {
            const [pageRows] = await db_1.pool.query("SELECT user_id FROM paginas WHERE id = ?", [pageId]);
            if (pageRows.length === 0)
                return null;
            const userId = pageRows[0]?.user_id;
            if (!userId)
                return null;
            const [countRows] = await db_1.pool.query(`SELECT COUNT(*) as count FROM paginas
         WHERE user_id = ? AND id <= ?
         ORDER BY id ASC`, [userId, pageId]);
            logger_1.default.info(`getPageNumber ejecutado para página ${pageId}`);
            return countRows[0]?.count ?? null;
        }
        catch (error) {
            logger_1.default.error(`Error en getPageNumber: ${error}`);
            throw error;
        }
    }
}
exports.PageRepository = PageRepository;
//# sourceMappingURL=PageRepository.js.map