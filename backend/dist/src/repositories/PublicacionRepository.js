"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicacionRepository = void 0;
const db_1 = require("../middlewares/db");
const logger_1 = __importDefault(require("../utils/logger"));
class PublicacionRepository {
    /**
     * Crea una nueva publicación para el usuario especificado.
     * @param userId ID del usuario
     * @param data Datos de la publicación
     * @returns ID de la nueva publicación
     */
    async create(userId, data) {
        try {
            const [result] = await db_1.pool.query("INSERT INTO publicaciones (user_id, titulo, contenido) VALUES (?, ?, ?)", [userId, data.titulo, data.contenido]);
            logger_1.default.info(`Publicación creada para usuario ${userId}`);
            return result.insertId;
        }
        catch (error) {
            logger_1.default.error(`Error al crear publicación: ${error}`);
            throw error;
        }
    }
    /**
     * Busca una publicación por su ID.
     * @param id ID de la publicación
     * @returns Publicación encontrada o null
     */
    async findById(id) {
        try {
            const [rows] = await db_1.pool.query("SELECT * FROM publicaciones WHERE id = ?", [id]);
            logger_1.default.info(`findById ejecutado para publicación ${id}`);
            return rows.length > 0 ? (rows[0] ?? null) : null;
        }
        catch (error) {
            logger_1.default.error(`Error en findById: ${error}`);
            throw error;
        }
    }
    /**
     * Busca publicaciones de un usuario con paginación.
     * @param userId ID del usuario
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de publicaciones
     */
    async findByUser(userId, limit = 20, offset = 0) {
        try {
            const [rows] = await db_1.pool.query("SELECT * FROM publicaciones WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", [userId, limit, offset]);
            logger_1.default.info(`findByUser ejecutado para usuario ${userId}`);
            return rows;
        }
        catch (error) {
            logger_1.default.error(`Error en findByUser: ${error}`);
            throw error;
        }
    }
    /**
     * Busca todas las publicaciones con paginación.
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de publicaciones
     */
    async findAll(limit = 20, offset = 0) {
        try {
            const [rows] = await db_1.pool.query("SELECT p.*, u.username FROM publicaciones p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
            logger_1.default.info(`findAll ejecutado con limit ${limit} y offset ${offset}`);
            return rows;
        }
        catch (error) {
            logger_1.default.error(`Error en findAll: ${error}`);
            throw error;
        }
    }
    /**
     * Actualiza una publicación por su ID.
     * @param id ID de la publicación
     * @param data Datos a actualizar
     */
    async update(id, data) {
        const fields = [];
        const values = [];
        if (data.titulo !== undefined) {
            fields.push('titulo = ?');
            values.push(data.titulo);
        }
        if (data.contenido !== undefined) {
            fields.push('contenido = ?');
            values.push(data.contenido);
        }
        if (fields.length === 0)
            return;
        values.push(id);
        try {
            await db_1.pool.query(`UPDATE publicaciones SET ${fields.join(', ')} WHERE id = ?`, values);
            logger_1.default.info(`Publicación ${id} actualizada`);
        }
        catch (error) {
            logger_1.default.error(`Error al actualizar publicación: ${error}`);
            throw error;
        }
    }
    /**
     * Elimina una publicación por su ID.
     * @param id ID de la publicación
     */
    async delete(id) {
        try {
            await db_1.pool.query("DELETE FROM publicaciones WHERE id = ?", [id]);
            logger_1.default.info(`Publicación ${id} eliminada`);
        }
        catch (error) {
            logger_1.default.error(`Error al eliminar publicación: ${error}`);
            throw error;
        }
    }
}
exports.PublicacionRepository = PublicacionRepository;
//# sourceMappingURL=PublicacionRepository.js.map