import { QueryResult } from '../types/interfaces';
import { pool } from "../middlewares/db";
import { IChatRepository, ChatMessage } from './IChatRepository';

export class ChatRepository implements IChatRepository {
  async findAll(limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    // Obtener mensajes de usuarios registrados
    const [registeredRows]: QueryResult<ChatMessage & { username: string; display_name: string; foto_perfil: Buffer }> = await pool.query(
      `SELECT gc.id, gc.user_id, gc.message, gc.created_at, u.username, u.display_name, u.foto_perfil
        FROM global_chat gc
        LEFT JOIN users u ON gc.user_id = u.id
        ORDER BY gc.created_at DESC`,
      []
    );

    // Obtener mensajes de usuarios invitados
    const [guestRows]: QueryResult<{ id: number; guest_username: string; message: string; created_at: string }> = await pool.query(
      `SELECT id, guest_username, message, created_at
        FROM invitados_global_chat
        ORDER BY created_at DESC`,
      []
    );

    // Combinar y ordenar todos los mensajes
    const allMessages: ChatMessage[] = [
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

  async create(userId: string | null, message: string, guestUsername?: string): Promise<number> {
    console.log('ChatRepository.create:', { userId, guestUsername, message });

    if (userId) {
      // Usuario registrado - insertar en global_chat
      const [result] = await pool.query(
        "INSERT INTO global_chat (user_id, message) VALUES (?, ?)",
        [userId, message]
      );
      console.log('Query result (registered user):', result);
      return (result as any).insertId;
    } else {
      // Usuario invitado - insertar en invitados_global_chat
      const [result] = await pool.query(
        "INSERT INTO invitados_global_chat (guest_username, message) VALUES (?, ?)",
        [guestUsername, message]
      );
      console.log('Query result (guest user):', result);
      return (result as any).insertId;
    }
  }

  async deleteByUser(userId: string): Promise<void> {
    await pool.query("DELETE FROM global_chat WHERE user_id = ?", [userId]);
  }
}