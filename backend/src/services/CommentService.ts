import { 
  QueryResult, 
  Comentario, 
  CreateCommentRequest,
  AuthenticatedRequest 
} from '../types/interfaces';
const { getPool } = require("../middlewares/db");

export class CommentService {
  /**
   * Crear un nuevo comentario
   */
  async createComment(userId: string, pageId: number, comentario: string): Promise<number> {
    const [result] = await getPool().query(
      "INSERT INTO comentarios (pagina_id, user_id, comentario) VALUES (?, ?, ?)",
      [pageId, userId, comentario]
    );

    return (result as any).insertId;
  }

  /**
   * Obtener comentarios de una página con información de usuario
   */
  async getPageComments(pageId: number, limit: number = 50, offset: number = 0): Promise<Comentario[]> {
    const [rows]: QueryResult<Comentario> = await getPool().query(
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

  /**
   * Obtener comentario por ID
   */
  async getCommentById(commentId: number): Promise<Comentario | null> {
    const [rows]: QueryResult<Comentario> = await getPool().query(
      `SELECT c.*, u.username 
       FROM comentarios c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [commentId]
    );

    return rows.length > 0 && rows[0] ? rows[0] : null;
  }

  /**
   * Actualizar comentario (solo el propietario)
   */
  async updateComment(commentId: number, userId: string, nuevoComentario: string): Promise<void> {
    // Verificar que el usuario es el propietario
    const isOwner = await this.isCommentOwner(commentId, userId);
    if (!isOwner) {
      throw new Error("No tienes permisos para editar este comentario");
    }

    await getPool().query(
      "UPDATE comentarios SET comentario = ? WHERE id = ? AND user_id = ?",
      [nuevoComentario, commentId, userId]
    );
  }

  /**
   * Eliminar comentario
   */
  async deleteComment(commentId: number, userId: string): Promise<void> {
    // Verificar permisos (propietario del comentario o propietario de la página)
    const canDelete = await this.canDeleteComment(commentId, userId);
    if (!canDelete) {
      throw new Error("No tienes permisos para eliminar este comentario");
    }

    await getPool().query("DELETE FROM comentarios WHERE id = ?", [commentId]);
  }

  /**
   * Obtener comentarios de un usuario
   */
  async getUserComments(userId: string, limit: number = 20, offset: number = 0): Promise<Comentario[]> {
    const [rows]: QueryResult<Comentario> = await getPool().query(
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

  /**
   * Contar comentarios de una página
   */
  async countPageComments(pageId: number): Promise<number> {
    const [rows]: QueryResult<{ count: number }> = await getPool().query(
      "SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?",
      [pageId]
    );

    return rows[0]?.count || 0;
  }

  /**
   * Eliminar todos los comentarios de una página
   */
  async deleteAllPageComments(pageId: number): Promise<void> {
    await getPool().query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
  }

  /**
   * Verificar si un usuario es propietario de un comentario
   */
  async isCommentOwner(commentId: number, userId: string): Promise<boolean> {
    const [rows]: QueryResult<{ user_id: string }> = await getPool().query(
      "SELECT user_id FROM comentarios WHERE id = ?",
      [commentId]
    );

    if (rows.length === 0 || !rows[0]) return false;
    return rows[0].user_id === userId;
  }

  /**
   * Verificar si un usuario puede eliminar un comentario
   * (propietario del comentario o propietario de la página)
   */
  async canDeleteComment(commentId: number, userId: string): Promise<boolean> {
    const [rows]: QueryResult<{ comment_user_id: string; page_user_id: string }> = await getPool().query(
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

  /**
   * Obtener comentarios recientes del sistema
   */
  async getRecentComments(limit: number = 10): Promise<Comentario[]> {
    const [rows]: QueryResult<Comentario> = await getPool().query(
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

  /**
   * Buscar comentarios por texto
   */
  async searchComments(searchTerm: string, limit: number = 20, offset: number = 0): Promise<Comentario[]> {
    const searchPattern = `%${searchTerm}%`;
    
    const [rows]: QueryResult<Comentario> = await getPool().query(
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