import { Comentario, ComentarioCreateData } from '../types/interfaces';
import { ICommentRepository } from './ICommentRepository';
export declare class CommentRepository implements ICommentRepository {
    /**
     * Crea un nuevo comentario en una página.
     * @param commentData Datos del comentario
     * @returns ID del nuevo comentario
     */
    create(commentData: ComentarioCreateData): Promise<number>;
    /**
     * Busca un comentario por su ID.
     * @param commentId ID del comentario
     * @returns Comentario encontrado o null
     */
    findById(commentId: number): Promise<Comentario | null>;
    /**
     * Busca comentarios de una página con paginación.
     * @param pageId ID de la página
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de comentarios
     */
    findByPage(pageId: number, limit?: number, offset?: number): Promise<Comentario[]>;
    /**
     * Busca comentarios de un usuario con paginación.
     * @param userId ID del usuario
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de comentarios
     */
    findByUser(userId: string, limit?: number, offset?: number): Promise<Comentario[]>;
    /**
     * Actualiza un comentario por su ID y usuario.
     * @param commentId ID del comentario
     * @param userId ID del usuario
     * @param newComment Nuevo texto del comentario
     */
    update(commentId: number, userId: string, newComment: string): Promise<void>;
    /**
     * Elimina un comentario por su ID y usuario.
     * @param commentId ID del comentario
     * @param userId ID del usuario
     */
    delete(commentId: number, userId: string): Promise<void>;
    /**
     * Cuenta el número de comentarios en una página.
     * @param pageId ID de la página
     * @returns Número de comentarios
     */
    countByPage(pageId: number): Promise<number>;
    /**
     * Elimina todos los comentarios de una página.
     * @param pageId ID de la página
     */
    deleteAllByPage(pageId: number): Promise<void>;
    /**
     * Verifica si el usuario es propietario de un comentario.
     * @param commentId ID del comentario
     * @param userId ID del usuario
     * @returns true si es propietario, false si no
     */
    isOwner(commentId: number, userId: string): Promise<boolean>;
    /**
     * Verifica si el usuario puede eliminar el comentario (propietario o dueño de la página).
     * @param commentId ID del comentario
     * @param userId ID del usuario
     * @returns true si puede eliminar, false si no
     */
    canDelete(commentId: number, userId: string): Promise<boolean>;
    /**
     * Busca los comentarios más recientes en páginas visibles.
     * @param limit Límite de resultados
     * @returns Array de comentarios
     */
    findRecent(limit?: number): Promise<Comentario[]>;
    /**
     * Busca comentarios por término de búsqueda en páginas visibles.
     * @param searchTerm Término de búsqueda
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de comentarios
     */
    search(searchTerm: string, limit?: number, offset?: number): Promise<Comentario[]>;
}
//# sourceMappingURL=CommentRepository.d.ts.map