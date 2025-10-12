"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const db_1 = require("../middlewares/db");
class ChatRepository {
    async findAll(limit = 50, offset = 0) {
        // Obtener mensajes de usuarios registrados
        const [registeredRows] = await db_1.pool.query(`SELECT gc.id, gc.user_id, gc.message, gc.created_at, u.username, u.display_name, u.foto_perfil
        FROM global_chat gc
        LEFT JOIN users u ON gc.user_id = u.id
        ORDER BY gc.created_at DESC`, []);
        // Obtener mensajes de usuarios invitados
        const [guestRows] = await db_1.pool.query(`SELECT id, guest_username, message, created_at
        FROM invitados_global_chat
        ORDER BY created_at DESC`, []);
        // Combinar y ordenar todos los mensajes
        const allMessages = [
            ...registeredRows.map(row => ({
                id: row.id,
                user_id: row.user_id,
                message: row.message,
                created_at: row.created_at,
                username: row.display_name || row.username,
                display_name: row.display_name || undefined,
                foto_perfil_url: row.foto_perfil ?
                    `data:image/jpeg;base64,${row.foto_perfil.toString('base64')}` :
                    null
            })),
            ...guestRows.map(row => ({
                id: row.id,
                user_id: null,
                message: row.message,
                created_at: row.created_at,
                username: row.guest_username,
                display_name: undefined,
                foto_perfil_url: null
            }))
        ];
        // Ordenar por fecha descendente y aplicar límite y offset
        allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return allMessages.slice(offset, offset + limit);
    }
    async create(userId, message, guestUsername) {
        console.log('ChatRepository.create:', { userId, guestUsername, message });
        if (userId) {
            // Usuario registrado - insertar en global_chat
            const [result] = await db_1.pool.query("INSERT INTO global_chat (user_id, message) VALUES (?, ?)", [userId, message]);
            console.log('Query result (registered user):', result);
            return result.insertId;
        }
        else {
            // Usuario invitado - insertar en invitados_global_chat
            const [result] = await db_1.pool.query("INSERT INTO invitados_global_chat (guest_username, message) VALUES (?, ?)", [guestUsername, message]);
            console.log('Query result (guest user):', result);
            return result.insertId;
        }
    }
    async deleteByUser(userId) {
        await db_1.pool.query("DELETE FROM global_chat WHERE user_id = ?", [userId]);
    }
}
exports.ChatRepository = ChatRepository;
//# sourceMappingURL=ChatRepository.js.map