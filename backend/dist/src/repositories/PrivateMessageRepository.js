"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateMessageRepository = void 0;
const db_1 = require("../middlewares/db");
class PrivateMessageRepository {
    async findBetweenUsers(userId1, userId2, limit = 50, offset = 0) {
        const [rows] = await db_1.pool.query(`SELECT pm.*,
        CASE
          WHEN u1.id IS NOT NULL THEN COALESCE(u1.display_name, u1.username)
          ELSE pm.sender_id
        END as sender_username,
        COALESCE(u2.display_name, u2.username) as receiver_username
        FROM private_messages pm
        LEFT JOIN users u1 ON pm.sender_id = u1.id
        INNER JOIN users u2 ON pm.receiver_id = u2.id
        WHERE (pm.sender_id = ? AND pm.receiver_id = ?) OR (pm.sender_id = ? AND pm.receiver_id = ?)
        ORDER BY pm.created_at ASC
        LIMIT ? OFFSET ?`, [userId1, userId2, userId2, userId1, limit, offset]);
        return rows.map(row => ({
            id: row.id,
            sender_id: row.sender_id,
            receiver_id: row.receiver_id,
            message: row.message,
            created_at: row.created_at,
            sender_username: row.sender_username,
            receiver_username: row.receiver_username
        }));
    }
    async create(senderId, receiverId, message) {
        const [result] = await db_1.pool.query("INSERT INTO private_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)", [senderId, receiverId, message]);
        return result.insertId;
    }
    async deleteByUser(userId) {
        await db_1.pool.query("DELETE FROM private_messages WHERE sender_id = ? OR receiver_id = ?", [userId, userId]);
    }
}
exports.PrivateMessageRepository = PrivateMessageRepository;
//# sourceMappingURL=PrivateMessageRepository.js.map