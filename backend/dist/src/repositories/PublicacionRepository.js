"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicacionRepository = void 0;
const db_1 = require("../middlewares/db");
class PublicacionRepository {
    async create(userId, data) {
        const [result] = await db_1.pool.query("INSERT INTO publicaciones (user_id, titulo, contenido) VALUES (?, ?, ?)", [userId, data.titulo, data.contenido]);
        return result.insertId;
    }
    async findById(id) {
        const [rows] = await db_1.pool.query("SELECT * FROM publicaciones WHERE id = ?", [id]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    async findByUser(userId, limit = 20, offset = 0) {
        const [rows] = await db_1.pool.query("SELECT * FROM publicaciones WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", [userId, limit, offset]);
        return rows;
    }
    async findAll(limit = 20, offset = 0) {
        const [rows] = await db_1.pool.query("SELECT p.*, u.username FROM publicaciones p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
        return rows;
    }
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
        await db_1.pool.query(`UPDATE publicaciones SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    async delete(id) {
        await db_1.pool.query("DELETE FROM publicaciones WHERE id = ?", [id]);
    }
}
exports.PublicacionRepository = PublicacionRepository;
//# sourceMappingURL=PublicacionRepository.js.map