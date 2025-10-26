import {
  QueryResult,
  Comentario,
  ComentarioCreateData
} from '../types/interfaces';
import { pool } from "../middlewares/db";
import { ICommentRepository } from './ICommentRepository';
import logger from '../utils/logger';

export class CommentRepository implements ICommentRepository {
  /**
   * Crea un nuevo comentario en una página.
   * @param commentData Datos del comentario
   * @returns ID del nuevo comentario
   */
  async create(commentData: ComentarioCreateData): Promise<number> {
    try {
      const [result] = await pool.query(
        "INSERT INTO comentarios (pagina_id, user_id, comentario) VALUES (?, ?, ?)",
        [commentData.pagina_id, commentData.user_id, commentData.comentario]
      );
      logger.info(`Comentario creado en página ${commentData.pagina_id} por usuario ${commentData.user_id}`);
      return (result as any).insertId;
    } catch (error) {
      logger.error(`Error al crear comentario: ${error}`);
      throw error;
    }
  }

  /**
   * Busca un comentario por su ID.
   * @param commentId ID del comentario
   * @returns Comentario encontrado o null
   */
  async findById(commentId: number): Promise<Comentario | null> {
    try {
      const [rows]: QueryResult<Comentario> = await pool.query(
        `SELECT c.*, u.username
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [commentId]
      );
      logger.info(`findById ejecutado para comentario ${commentId}`);
      return rows.length > 0 && rows[0] ? rows[0] : null;
    } catch (error) {
      logger.error(`Error en findById: ${error}`);
      throw error;
    }
  }

  /**
   * Busca comentarios de una página con paginación.
   * @param pageId ID de la página
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de comentarios
   */
  async findByPage(pageId: number, limit: number = 50, offset: number = 0): Promise<Comentario[]> {
    try {
      const [rows]: QueryResult<Comentario> = await pool.query(
        `SELECT c.*, u.username
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.pagina_id = ?
         ORDER BY c.creado_en DESC
         LIMIT ? OFFSET ?`,
        [pageId, limit, offset]
      );
      logger.info(`findByPage ejecutado para página ${pageId}`);
      return rows;
    } catch (error) {
      logger.error(`Error en findByPage: ${error}`);
      throw error;
    }
  }

  /**
   * Busca comentarios de un usuario con paginación.
   * @param userId ID del usuario
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de comentarios
   */
  async findByUser(userId: string, limit: number = 20, offset: number = 0): Promise<Comentario[]> {
    try {
      const [rows]: QueryResult<Comentario> = await pool.query(
        `SELECT c.*, u.username, p.titulo as pagina_titulo
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN paginas p ON c.pagina_id = p.id
         WHERE c.user_id = ?
         ORDER BY c.creado_en DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      logger.info(`findByUser ejecutado para usuario ${userId}`);
      return rows;
    } catch (error) {
      logger.error(`Error en findByUser: ${error}`);
      throw error;
    }
  }

  /**
   * Actualiza un comentario por su ID y usuario.
   * @param commentId ID del comentario
   * @param userId ID del usuario
   * @param newComment Nuevo texto del comentario
   */
  async update(commentId: number, userId: string, newComment: string): Promise<void> {
    try {
      await pool.query(
        "UPDATE comentarios SET comentario = ? WHERE id = ? AND user_id = ?",
        [newComment, commentId, userId]
      );
      logger.info(`Comentario ${commentId} actualizado por usuario ${userId}`);
    } catch (error) {
      logger.error(`Error al actualizar comentario: ${error}`);
      throw error;
    }
  }

  /**
   * Elimina un comentario por su ID y usuario.
   * @param commentId ID del comentario
   * @param userId ID del usuario
   */
  async delete(commentId: number, userId: string): Promise<void> {
    try {
      await pool.query("DELETE FROM imagenes_comentarios WHERE comentario_id = ?", [commentId]);
      await pool.query("DELETE FROM comentarios WHERE id = ? AND user_id = ?", [commentId, userId]);
      logger.info(`Comentario ${commentId} eliminado por usuario ${userId}`);
    } catch (error) {
      logger.error(`Error al eliminar comentario: ${error}`);
      throw error;
    }
  }

  /**
   * Cuenta el número de comentarios en una página.
   * @param pageId ID de la página
   * @returns Número de comentarios
   */
  async countByPage(pageId: number): Promise<number> {
    try {
      const [rows]: QueryResult<{ count: number }> = await pool.query(
        "SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?",
        [pageId]
      );
      logger.info(`countByPage ejecutado para página ${pageId}`);
      return rows[0]?.count || 0;
    } catch (error) {
      logger.error(`Error en countByPage: ${error}`);
      throw error;
    }
  }

  /**
   * Elimina todos los comentarios de una página.
   * @param pageId ID de la página
   */
  async deleteAllByPage(pageId: number): Promise<void> {
    try {
      await pool.query("DELETE FROM imagenes_comentarios WHERE comentario_id IN (SELECT id FROM comentarios WHERE pagina_id = ?)", [pageId]);
      await pool.query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
      logger.info(`Todos los comentarios eliminados para página ${pageId}`);
    } catch (error) {
      logger.error(`Error al eliminar todos los comentarios: ${error}`);
      throw error;
    }
  }

  /**
   * Verifica si el usuario es propietario de un comentario.
   * @param commentId ID del comentario
   * @param userId ID del usuario
   * @returns true si es propietario, false si no
   */
  async isOwner(commentId: number, userId: string): Promise<boolean> {
    try {
      const [rows]: QueryResult<{ user_id: string }> = await pool.query(
        "SELECT user_id FROM comentarios WHERE id = ?",
        [commentId]
      );
      logger.info(`isOwner ejecutado para comentario ${commentId} y usuario ${userId}`);
      if (rows.length === 0 || !rows[0]) return false;
      return rows[0].user_id === userId;
    } catch (error) {
      logger.error(`Error en isOwner: ${error}`);
      throw error;
    }
  }

  /**
   * Verifica si el usuario puede eliminar el comentario (propietario o dueño de la página).
   * @param commentId ID del comentario
   * @param userId ID del usuario
   * @returns true si puede eliminar, false si no
   */
  async canDelete(commentId: number, userId: string): Promise<boolean> {
    try {
      const [rows]: QueryResult<{ comment_user_id: string; page_user_id: string }> = await pool.query(
        `SELECT c.user_id as comment_user_id, p.user_id as page_user_id
         FROM comentarios c
         INNER JOIN paginas p ON c.pagina_id = p.id
         WHERE c.id = ?`,
        [commentId]
      );
      logger.info(`canDelete ejecutado para comentario ${commentId} y usuario ${userId}`);
      if (rows.length === 0 || !rows[0]) return false;
      const { comment_user_id, page_user_id } = rows[0];
      return comment_user_id === userId || page_user_id === userId;
    } catch (error) {
      logger.error(`Error en canDelete: ${error}`);
      throw error;
    }
  }

  /**
   * Busca los comentarios más recientes en páginas visibles.
   * @param limit Límite de resultados
   * @returns Array de comentarios
   */
  async findRecent(limit: number = 10): Promise<Comentario[]> {
    try {
      const [rows]: QueryResult<Comentario> = await pool.query(
        `SELECT c.*, u.username, p.titulo as pagina_titulo, p.id as pagina_id
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN paginas p ON c.pagina_id = p.id
         ORDER BY c.creado_en DESC
         LIMIT ?`,
        [limit]
      );
      logger.info(`findRecent ejecutado con limit ${limit}`);
      return rows;
    } catch (error) {
      logger.error(`Error en findRecent: ${error}`);
      throw error;
    }
  }

  /**
   * Busca comentarios por término de búsqueda en páginas visibles.
   * @param searchTerm Término de búsqueda
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de comentarios
   */
  async search(searchTerm: string, limit: number = 20, offset: number = 0): Promise<Comentario[]> {
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows]: QueryResult<Comentario> = await pool.query(
        `SELECT c.*, u.username, p.titulo as pagina_titulo
         FROM comentarios c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN paginas p ON c.pagina_id = p.id
         WHERE c.comentario LIKE ?
         ORDER BY c.creado_en DESC
         LIMIT ? OFFSET ?`,
        [searchPattern, limit, offset]
      );
      logger.info(`search ejecutado con término '${searchTerm}'`);
      return rows;
    } catch (error) {
      logger.error(`Error en search: ${error}`);
      throw error;
    }
  }
}