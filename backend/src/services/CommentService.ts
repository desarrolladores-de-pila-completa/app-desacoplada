import {
  Comentario,
  CreateCommentRequest,
  AuthenticatedRequest
} from '../types/interfaces';
import { ICommentRepository } from '../repositories';

export class CommentService {
  constructor(private commentRepository: ICommentRepository) {}
  /**
   * Crear un nuevo comentario
   */
  async createComment(userId: string, pageId: number, comentario: string): Promise<number> {
    return await this.commentRepository.create({ pagina_id: pageId, user_id: userId, comentario });
  }

  /**
   * Obtener comentarios de una página con información de usuario
   */
  async getPageComments(pageId: number, limit: number = 50, offset: number = 0): Promise<Comentario[]> {
    return await this.commentRepository.findByPage(pageId, limit, offset);
  }

  /**
   * Obtener comentario por ID
   */
  async getCommentById(commentId: number): Promise<Comentario | null> {
    return await this.commentRepository.findById(commentId);
  }

  /**
   * Actualizar comentario (solo el propietario)
   */
  async updateComment(commentId: number, userId: string, nuevoComentario: string): Promise<void> {
    await this.commentRepository.update(commentId, userId, nuevoComentario);
  }

  /**
   * Eliminar comentario
   */
  async deleteComment(commentId: number, userId: string): Promise<void> {
    await this.commentRepository.delete(commentId, userId);
  }

  /**
   * Obtener comentarios de un usuario
   */
  async getUserComments(userId: string, limit: number = 20, offset: number = 0): Promise<Comentario[]> {
    return await this.commentRepository.findByUser(userId, limit, offset);
  }

  /**
   * Contar comentarios de una página
   */
  async countPageComments(pageId: number): Promise<number> {
    return await this.commentRepository.countByPage(pageId);
  }

  /**
   * Eliminar todos los comentarios de una página
   */
  async deleteAllPageComments(pageId: number): Promise<void> {
    await this.commentRepository.deleteAllByPage(pageId);
  }

  /**
   * Verificar si un usuario es propietario de un comentario
   */
  async isCommentOwner(commentId: number, userId: string): Promise<boolean> {
    return await this.commentRepository.isOwner(commentId, userId);
  }

  /**
   * Verificar si un usuario puede eliminar un comentario
   * (propietario del comentario o propietario de la página)
   */
  async canDeleteComment(commentId: number, userId: string): Promise<boolean> {
    return await this.commentRepository.canDelete(commentId, userId);
  }

  /**
   * Obtener comentarios recientes del sistema
   */
  async getRecentComments(limit: number = 10): Promise<Comentario[]> {
    return await this.commentRepository.findRecent(limit);
  }

  /**
   * Buscar comentarios por texto
   */
  async searchComments(searchTerm: string, limit: number = 20, offset: number = 0): Promise<Comentario[]> {
    return await this.commentRepository.search(searchTerm, limit, offset);
  }
}