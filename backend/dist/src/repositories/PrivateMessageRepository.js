"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateMessageRepository = void 0;
const db_1 = require("../middlewares/db");
const logger_1 = __importDefault(require("../utils/logger"));
class PrivateMessageRepository {
    /**
     * Busca mensajes privados entre dos usuarios con paginación.
     * @param userId1 ID del usuario 1
     * @param userId2 ID del usuario 2
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de mensajes privados
     */
    async findBetweenUsers(userId1, userId2, limit = 50, offset = 0) {
        try {
            const [rows] = await db_1.pool.query(`SELECT pm.*,
          CASE
            WHEN u1.username IS NOT NULL THEN COALESCE(u1.display_name, u1.username)
            WHEN g1.id IS NOT NULL THEN g1.guest_username
            WHEN g1_name.id IS NOT NULL THEN g1_name.guest_username
            ELSE pm.sender_id
          END as sender_username,
          CASE
            WHEN u2.username IS NOT NULL THEN COALESCE(u2.display_name, u2.username)
            WHEN g2.id IS NOT NULL THEN g2.guest_username
            WHEN g2_name.id IS NOT NULL THEN g2_name.guest_username
            ELSE pm.receiver_id
          END as receiver_username
          FROM private_messages pm
          LEFT JOIN users u1 ON pm.sender_id = u1.username OR pm.sender_id = u1.id
          LEFT JOIN usuariosinvitados g1 ON pm.sender_id = CONCAT('guest-', g1.id)
          LEFT JOIN users u2 ON pm.receiver_id = u2.username OR pm.receiver_id = u2.id
          LEFT JOIN usuariosinvitados g2 ON pm.receiver_id = CONCAT('guest-', g2.id)
          LEFT JOIN usuariosinvitados g1_name ON pm.sender_id = g1_name.guest_username
          LEFT JOIN usuariosinvitados g2_name ON pm.receiver_id = g2_name.guest_username
          WHERE (pm.sender_id = ? AND pm.receiver_id = ?) OR (pm.sender_id = ? AND pm.receiver_id = ?)
          ORDER BY pm.created_at ASC
          LIMIT ? OFFSET ?`, [userId1, userId2, userId2, userId1, limit, offset]);
            logger_1.default.info(`findBetweenUsers ejecutado para usuarios ${userId1} y ${userId2}`);
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
        catch (error) {
            logger_1.default.error(`Error en findBetweenUsers: ${error}`);
            throw error;
        }
    }
    /**
     * Crea un nuevo mensaje privado.
     * @param senderId ID del remitente
     * @param receiverId ID del destinatario
     * @param message Mensaje
     * @returns ID del nuevo mensaje
     */
    async create(senderId, receiverId, message) {
        try {
            const [result] = await db_1.pool.query("INSERT INTO private_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)", [senderId, receiverId, message]);
            logger_1.default.info(`Mensaje privado creado de ${senderId} a ${receiverId}`);
            return result.insertId;
        }
        catch (error) {
            logger_1.default.error(`Error al crear mensaje privado: ${error}`);
            throw error;
        }
    }
    /**
     * Elimina todos los mensajes privados de un usuario (como remitente o destinatario).
     * @param userId ID del usuario
     */
    async deleteByUser(userId) {
        try {
            await db_1.pool.query("DELETE FROM private_messages WHERE sender_id = ? OR receiver_id = ?", [userId, userId]);
            logger_1.default.info(`deleteByUser ejecutado para usuario ${userId}`);
        }
        catch (error) {
            logger_1.default.error(`Error al eliminar mensajes privados: ${error}`);
            throw error;
        }
    }
}
exports.PrivateMessageRepository = PrivateMessageRepository;
//# sourceMappingURL=PrivateMessageRepository.js.map