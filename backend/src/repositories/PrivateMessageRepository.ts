import { QueryResult } from '../types/interfaces';
import { pool } from "../middlewares/db";
import { IPrivateMessageRepository, PrivateMessage } from './IPrivateMessageRepository';
import logger from '../utils/logger';

export class PrivateMessageRepository implements IPrivateMessageRepository {
  /**
   * Busca mensajes privados entre dos usuarios con paginación.
   * @param userId1 ID del usuario 1
   * @param userId2 ID del usuario 2
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de mensajes privados
   */
  async findBetweenUsers(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<PrivateMessage[]> {
    try {
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
      logger.info(`findBetweenUsers ejecutado para usuarios ${userId1} y ${userId2}`);
      return rows.map(row => ({
        id: row.id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id,
        message: row.message,
        created_at: row.created_at,
        sender_username: row.sender_username,
        receiver_username: row.receiver_username
      }));
    } catch (error) {
      logger.error(`Error en findBetweenUsers: ${error}`);
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
  async create(senderId: string, receiverId: string, message: string): Promise<number> {
    try {
      const [result] = await pool.query(
        "INSERT INTO private_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
        [senderId, receiverId, message]
      );
      logger.info(`Mensaje privado creado de ${senderId} a ${receiverId}`);
      return (result as any).insertId;
    } catch (error) {
      logger.error(`Error al crear mensaje privado: ${error}`);
      throw error;
    }
  }

  /**
   * Elimina todos los mensajes privados de un usuario (como remitente o destinatario).
   * @param userId ID del usuario
   */
  async deleteByUser(userId: string): Promise<void> {
    try {
      await pool.query("DELETE FROM private_messages WHERE sender_id = ? OR receiver_id = ?", [userId, userId]);
      logger.info(`deleteByUser ejecutado para usuario ${userId}`);
    } catch (error) {
      logger.error(`Error al eliminar mensajes privados: ${error}`);
      throw error;
    }
  }
}