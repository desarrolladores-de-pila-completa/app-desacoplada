import { FeedEntry } from '../types/interfaces';
export declare class FeedService {
    /**
     * Obtener feed completo con paginación
     */
    getFeed(limit?: number, offset?: number): Promise<FeedEntry[]>;
    /**
     * Obtener feed de un usuario específico
     */
    getUserFeed(userId: string, limit?: number, offset?: number): Promise<FeedEntry[]>;
    /**
     * Obtener entrada específica del feed
     */
    getFeedEntry(feedId: number): Promise<FeedEntry | null>;
    /**
     * Crear entrada en el feed para registro de usuario
     */
    createUserRegistrationEntry(userId: string, username: string): Promise<number>;
    /**
     * Crear entrada en el feed cuando se crea una página
     */
    createFeedEntry(userId: string, pageId: number, titulo: string, contenido: string): Promise<number>;
    /**
     * Actualizar entrada del feed cuando se modifica una página
     */
    updateFeedEntry(pageId: number, titulo: string, contenido: string): Promise<void>;
    /**
     * Eliminar entrada del feed
     */
    deleteFeedEntry(pageId: number): Promise<void>;
    /**
     * Eliminar todas las entradas de un usuario
     */
    deleteUserFeedEntries(userId: string): Promise<void>;
    /**
     * Buscar en el feed
     */
    searchFeed(searchTerm: string, limit?: number, offset?: number): Promise<FeedEntry[]>;
    /**
     * Obtener estadísticas del feed
     */
    getFeedStats(): Promise<{
        totalEntries: number;
        totalUsers: number;
        entriesLast24h: number;
        mostActiveUser: {
            username: string;
            entries: number;
        } | null;
    }>;
    /**
     * Sincronizar feed con páginas existentes
     * Útil para migración o corrección de datos
     */
    syncFeedWithPages(): Promise<{
        created: number;
        updated: number;
    }>;
    /**
     * Enriquecer entradas del feed con imágenes
     */
    private enrichFeedWithImages;
    /**
     * Limpiar entradas huérfanas del feed
     */
    cleanOrphanedEntries(): Promise<number>;
    /**
     * Obtener feed de páginas seguidas por un usuario
     * TODO: Implementar sistema de follows
     */
    getFollowingFeed(userId: string, limit?: number, offset?: number): Promise<FeedEntry[]>;
}
//# sourceMappingURL=FeedService.d.ts.map