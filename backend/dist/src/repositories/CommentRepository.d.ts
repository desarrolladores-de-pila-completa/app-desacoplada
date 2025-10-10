import { Comentario, ComentarioCreateData } from '../types/interfaces';
import { ICommentRepository } from './ICommentRepository';
export declare class CommentRepository implements ICommentRepository {
    create(commentData: ComentarioCreateData): Promise<number>;
    findById(commentId: number): Promise<Comentario | null>;
    findByPage(pageId: number, limit?: number, offset?: number): Promise<Comentario[]>;
    findByUser(userId: string, limit?: number, offset?: number): Promise<Comentario[]>;
    update(commentId: number, userId: string, newComment: string): Promise<void>;
    delete(commentId: number, userId: string): Promise<void>;
    countByPage(pageId: number): Promise<number>;
    deleteAllByPage(pageId: number): Promise<void>;
    isOwner(commentId: number, userId: string): Promise<boolean>;
    canDelete(commentId: number, userId: string): Promise<boolean>;
    findRecent(limit?: number): Promise<Comentario[]>;
    search(searchTerm: string, limit?: number, offset?: number): Promise<Comentario[]>;
}
//# sourceMappingURL=CommentRepository.d.ts.map