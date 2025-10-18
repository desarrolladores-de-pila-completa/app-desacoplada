import { FeedEntry } from '../types/interfaces';
import { IFeedRepository } from './IFeedRepository';
export declare class FeedRepository implements IFeedRepository {
    /**
     * Obtiene todas las entradas del feed con paginación.
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de entradas de feed enriquecidas
     */
    findAll(limit?: number, offset?: number): Promise<FeedEntry[]>;
    /**
     * Obtiene entradas del feed de un usuario con paginación.
     * @param userId ID del usuario
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de entradas de feed enriquecidas
     */
    findByUser(userId: string, limit?: number, offset?: number): Promise<FeedEntry[]>;
    /**
     * Busca una entrada de feed por su ID.
     * @param feedId ID de la entrada de feed
     * @returns Entrada de feed enriquecida o null
     */
    findById(feedId: number): Promise<FeedEntry | null>;
    /**
     * Crea una entrada de feed para un nuevo usuario.
     * @param userId ID del usuario
     * @param username Username del usuario
     * @returns ID de la nueva entrada de feed
     */
    createForUser(userId: string, username: string): Promise<number>;
    /**
     * Crea una entrada de feed para una página.
     * @param userId ID del usuario
     * @param pageId ID de la página
     * @param titulo Título
     * @param contenido Contenido
     * @returns ID de la nueva entrada de feed
     */
    createForPage(userId: string, pageId: number, titulo: string, contenido: string): Promise<number>;
    /**
     * Actualiza una entrada de feed para una página.
     * @param pageId ID de la página
     * @param titulo Título
     * @param contenido Contenido
     */
    updateForPage(pageId: number, titulo: string, contenido: string): Promise<void>;
    /**
     * Elimina entradas de feed por página.
     * @param pageId ID de la página
     */
    deleteByPage(pageId: number): Promise<void>;
    /**
     * Elimina entradas de feed por usuario.
     * @param userId ID del usuario
     */
    deleteByUser(userId: string): Promise<void>;
    /**
     * Busca entradas de feed por término de búsqueda.
     * @param searchTerm Término de búsqueda
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de entradas de feed enriquecidas
     */
    search(searchTerm: string, limit?: number, offset?: number): Promise<FeedEntry[]>;
    /**
     * Obtiene estadísticas del feed (total, usuarios, últimas 24h, usuario más activo).
     * @returns Objeto con estadísticas
     */
    getStats(): Promise<{
        totalEntries: number;
        totalUsers: number;
        entriesLast24h: number;
        mostActiveUser: {
            username: string;
            entries: number;
        } | null;
    }>;
    /**
     * Sincroniza el feed con las páginas visibles (crea/actualiza entradas).
     * @returns Objeto con cantidad de entradas creadas y actualizadas
     */
    syncWithPages(): Promise<{
        created: number;
        updated: number;
    }>;
    /**
     * Elimina entradas de feed huérfanas (sin página asociada).
     * @returns Número de entradas eliminadas
     */
    cleanOrphaned(): Promise<number>;
    /**
     * Actualiza enlaces antiguos en el feed.
     * @returns Número de enlaces actualizados
     */
    updateLegacyLinks(): Promise<number>;
    /**
     * Obtiene el feed de usuarios seguidos (por ahora retorna feed general).
     * @param userId ID del usuario
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de entradas de feed
     */
    findFollowing(userId: string, limit?: number, offset?: number): Promise<FeedEntry[]>;
    private enrichFeedWithImages;
}
//# sourceMappingURL=FeedRepository.d.ts.map