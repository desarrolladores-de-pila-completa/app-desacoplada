import {
  QueryResult,
  Comentario,
  ComentarioCreateData
} from '../types/interfaces';
import { pool } from "../middlewares/db";
import { ICommentRepository } from './ICommentRepository';

export class CommentRepository implements ICommentRepository {
  async create(commentData: ComentarioCreateData): Promise<number> {
    const [result] = await pool.query(
      "INSERT INTO comentarios (pagina_id, user_id, comentario) VALUES (?, ?, ?)",
      [commentData.pagina_id, commentData.user_id, commentData.comentario]
    );

    return (result as any).insertId;
  }

  async findById(commentId: number): Promise<Comentario | null> {
    const [rows]: QueryResult<Comentario> = await pool.query(
      `SELECT c.*, u.username
       FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );

    return rows.length > 0 && rows[0] ? rows[0] : null;
  }

  async findByPage(pageId: number, limit: number = 50, offset: number = 0): Promise<Comentario[]> {
    const [rows]: QueryResult<Comentario> = await pool.query(
      `SELECT c.*, u.username
       FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.pagina_id = ?
       ORDER BY c.creado_en DESC
       LIMIT ? OFFSET ?`,
      [pageId, limit, offset]
    );

    return rows;
  }

  async findByUser(userId: string, limit: number = 20, offset: number = 0): Promise<Comentario[]> {
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

    return rows;
  }

  async update(commentId: number, userId: string, newComment: string): Promise<void> {
    await pool.query(
      "UPDATE comentarios SET comentario = ? WHERE id = ? AND user_id = ?",
      [newComment, commentId, userId]
    );
  }

  async delete(commentId: number, userId: string): Promise<void> {
    await pool.query("DELETE FROM comentarios WHERE id = ?", [commentId]);
  }

  async countByPage(pageId: number): Promise<number> {
    const [rows]: QueryResult<{ count: number }> = await pool.query(
      "SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?",
      [pageId]
    );

    return rows[0]?.count || 0;
  }

  async deleteAllByPage(pageId: number): Promise<void> {
    await pool.query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
  }

  async isOwner(commentId: number, userId: string): Promise<boolean> {
    const [rows]: QueryResult<{ user_id: string }> = await pool.query(
      "SELECT user_id FROM comentarios WHERE id = ?",
      [commentId]
    );

    if (rows.length === 0 || !rows[0]) return false;
    return rows[0].user_id === userId;
  }

  async canDelete(commentId: number, userId: string): Promise<boolean> {
    const [rows]: QueryResult<{ comment_user_id: string; page_user_id: string }> = await pool.query(
      `SELECT c.user_id as comment_user_id, p.user_id as page_user_id
       FROM comentarios c
       INNER JOIN paginas p ON c.pagina_id = p.id
       WHERE c.id = ?`,
      [commentId]
    );

    if (rows.length === 0 || !rows[0]) return false;

    const { comment_user_id, page_user_id } = rows[0];

    // Puede eliminar si es propietario del comentario o propietario de la página
    return comment_user_id === userId || page_user_id === userId;
  }

  async findRecent(limit: number = 10): Promise<Comentario[]> {
    const [rows]: QueryResult<Comentario> = await pool.query(
      `SELECT c.*, u.username, p.titulo as pagina_titulo, p.id as pagina_id
       FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN paginas p ON c.pagina_id = p.id
       WHERE p.descripcion = 'visible'
       ORDER BY c.creado_en DESC
       LIMIT ?`,
      [limit]
    );

    return rows;
  }

  async search(searchTerm: string, limit: number = 20, offset: number = 0): Promise<Comentario[]> {
    const searchPattern = `%${searchTerm}%`;

    const [rows]: QueryResult<Comentario> = await pool.query(
      `SELECT c.*, u.username, p.titulo as pagina_titulo
       FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN paginas p ON c.pagina_id = p.id
       WHERE c.comentario LIKE ? AND p.descripcion = 'visible'
       ORDER BY c.creado_en DESC
       LIMIT ? OFFSET ?`,
      [searchPattern, limit, offset]
    );

    return rows;
  }
}