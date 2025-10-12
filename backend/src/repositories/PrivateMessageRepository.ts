import { QueryResult } from '../types/interfaces';
import { pool } from "../middlewares/db";
import { IPrivateMessageRepository, PrivateMessage } from './IPrivateMessageRepository';

export class PrivateMessageRepository implements IPrivateMessageRepository {
  async findBetweenUsers(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<PrivateMessage[]> {
    const [rows]: QueryResult<PrivateMessage & { sender_username: string; receiver_username: string }> = await pool.query(
      `SELECT pm.*, u1.username as sender_username, u2.username as receiver_username
        FROM private_messages pm
        INNER JOIN users u1 ON pm.sender_id = u1.id
        INNER JOIN users u2 ON pm.receiver_id = u2.id
        WHERE (pm.sender_id = ? AND pm.receiver_id = ?) OR (pm.sender_id = ? AND pm.receiver_id = ?)
        ORDER BY pm.created_at DESC
        LIMIT ? OFFSET ?`,
      [userId1, userId2, userId2, userId1, limit, offset]
    );

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

  async create(senderId: string, receiverId: string, message: string): Promise<number> {
    const [result] = await pool.query(
      "INSERT INTO private_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [senderId, receiverId, message]
    );

    return (result as any).insertId;
  }

  async deleteByUser(userId: string): Promise<void> {
    await pool.query("DELETE FROM private_messages WHERE sender_id = ? OR receiver_id = ?", [userId, userId]);
  }
}