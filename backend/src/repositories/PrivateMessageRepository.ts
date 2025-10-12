import { QueryResult } from '../types/interfaces';
import { pool } from "../middlewares/db";
import { IPrivateMessageRepository, PrivateMessage } from './IPrivateMessageRepository';

export class PrivateMessageRepository implements IPrivateMessageRepository {
  async findBetweenUsers(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<PrivateMessage[]> {
    console.log('findBetweenUsers called with:', { userId1, userId2, limit, offset });

    const [rows]: QueryResult<PrivateMessage & { sender_username: string; receiver_username: string }> = await pool.query(
      `SELECT pm.*,
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
        LIMIT ? OFFSET ?`,
      [userId1, userId2, userId2, userId1, limit, offset]
    );

    console.log('findBetweenUsers query result:', rows);

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