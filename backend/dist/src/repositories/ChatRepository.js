"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const db_1 = require("../middlewares/db");
class ChatRepository {
    async findAll(limit = 50, offset = 0) {
        const [rows] = await db_1.pool.query(`SELECT gc.*, u.username, u.display_name, u.foto_perfil
        FROM global_chat gc
        INNER JOIN users u ON gc.user_id = u.id
        ORDER BY gc.created_at DESC
        LIMIT ? OFFSET ?`, [limit, offset]);
        return rows.map(row => ({
            id: row.id,
            user_id: row.user_id,
            message: row.message,
            created_at: row.created_at,
            username: row.display_name || row.username,
            display_name: row.display_name,
            foto_perfil_url: row.foto_perfil ?
                `data:image/jpeg;base64,${row.foto_perfil.toString('base64')}` :
                null
        }));
    }
    async create(userId, message) {
        console.log('ChatRepository.create:', { userId, message });
        const [result] = await db_1.pool.query("INSERT INTO global_chat (user_id, message) VALUES (?, ?)", [userId, message]);
        console.log('Query result:', result);
        return result.insertId;
    }
    async deleteByUser(userId) {
        await db_1.pool.query("DELETE FROM global_chat WHERE user_id = ?", [userId]);
    }
}
exports.ChatRepository = ChatRepository;
//# sourceMappingURL=ChatRepository.js.map