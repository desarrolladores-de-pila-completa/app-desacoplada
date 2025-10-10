import { Comentario } from '../types/interfaces';
import { ICommentRepository } from '../repositories';
export declare class CommentService {
    private commentRepository;
    constructor(commentRepository: ICommentRepository);
    private sanitizeComment;
    /**
     * Crear un nuevo comentario
     */
    createComment(userId: string, pageId: number, comentario: string): Promise<number>;
    /**
     * Obtener comentarios de una página con información de usuario
     */
    getPageComments(pageId: number, limit?: number, offset?: number): Promise<Comentario[]>;
    /**
     * Obtener comentario por ID
     */
    getCommentById(commentId: number): Promise<Comentario | null>;
    /**
     * Actualizar comentario (solo el propietario)
     */
    updateComment(commentId: number, userId: string, nuevoComentario: string): Promise<void>;
    /**
     * Eliminar comentario
     */
    deleteComment(commentId: number, userId: string): Promise<void>;
    /**
     * Obtener comentarios de un usuario
     */
    getUserComments(userId: string, limit?: number, offset?: number): Promise<Comentario[]>;
    /**
     * Contar comentarios de una página
     */
    countPageComments(pageId: number): Promise<number>;
    /**
     * Eliminar todos los comentarios de una página
     */
    deleteAllPageComments(pageId: number): Promise<void>;
    /**
     * Verificar si un usuario es propietario de un comentario
     */
    isCommentOwner(commentId: number, userId: string): Promise<boolean>;
    /**
     * Verificar si un usuario puede eliminar un comentario
     * (propietario del comentario o propietario de la página)
     */
    canDeleteComment(commentId: number, userId: string): Promise<boolean>;
    /**
     * Obtener comentarios recientes del sistema
     */
    getRecentComments(limit?: number): Promise<Comentario[]>;
    /**
     * Buscar comentarios por texto
     */
    searchComments(searchTerm: string, limit?: number, offset?: number): Promise<Comentario[]>;
}
//# sourceMappingURL=CommentService.d.ts.map