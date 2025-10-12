import { QueryResult } from '../types/interfaces';
import { pool } from "../middlewares/db";
import { IChatRepository, ChatMessage } from './IChatRepository';

export class ChatRepository implements IChatRepository {
  async findAll(limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const [rows]: QueryResult<ChatMessage & { username: string; display_name: string; foto_perfil: Buffer }> = await pool.query(
      `SELECT gc.*, u.username, u.display_name, u.foto_perfil
        FROM global_chat gc
        INNER JOIN users u ON gc.user_id = u.id
        ORDER BY gc.created_at DESC
        LIMIT ? OFFSET ?`,
      [limit, offset]
    );

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

  async create(userId: string, message: string): Promise<number> {
    console.log('ChatRepository.create:', { userId, message });
    const [result] = await pool.query(
      "INSERT INTO global_chat (user_id, message) VALUES (?, ?)",
      [userId, message]
    );
    console.log('Query result:', result);

    return (result as any).insertId;
  }

  async deleteByUser(userId: string): Promise<void> {
    await pool.query("DELETE FROM global_chat WHERE user_id = ?", [userId]);
  }
}