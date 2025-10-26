import { User } from '../types/interfaces';
/**
 * Tipos para el servicio de invalidación de caché
 */
export interface CacheInvalidationResult {
    success: boolean;
    invalidatedKeys: string[];
    errors: string[];
    timestamp: Date;
}
export interface CacheInvalidationOptions {
    dryRun?: boolean;
    preserveUserId?: boolean;
    createNewEntries?: boolean;
    customPatterns?: string[];
}
export interface UsernameChangeContext {
    oldUsername: string;
    newUsername: string;
    userId: string;
    user?: User;
}
/**
 * Patrones de caché comunes que pueden estar asociados a un usuario
 */
export declare const USER_CACHE_PATTERNS: {
    readonly USER_PROFILE: "user:profile";
    readonly USER_PAGES: "user:pages";
    readonly USER_COMMENTS: "user:comments";
    readonly USER_STATS: "user:stats";
    readonly USER_PREFERENCES: "user:preferences";
    readonly USER_SESSIONS: "user:sessions";
    readonly USER_ACTIVITY: "user:activity";
};
/**
 * Servicio para manejar la invalidación de caché relacionada con cambios de nombre de usuario
 */
export declare class CacheInvalidationService {
    private readonly defaultTTL;
    /**
     * Invalidar caché relacionado con el cambio de nombre de usuario
     */
    invalidateUserCache(context: UsernameChangeContext, options?: CacheInvalidationOptions): Promise<CacheInvalidationResult>;
    /**
     * Generar patrones de caché específicos para un usuario
     */
    private generateUserCachePatterns;
    /**
     * Obtener claves que coinciden con un patrón (simulación basada en estadísticas)
     */
    private getKeysMatchingPattern;
    /**
     * Crear nuevas entradas de caché para el nuevo nombre de usuario
     */
    private createNewUserCacheEntries;
    /**
     * Obtener estadísticas detalladas de la invalidación
     */
    getInvalidationStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Limpiar completamente el caché (método de emergencia)
     */
    clearAllCache(): void;
    /**
     * Verificar si una clave específica existe en el caché
     */
    hasCacheKey(key: string): boolean;
    /**
     * Obtener un valor específico del caché
     */
    getCacheValue<T>(key: string): T | null;
    /**
     * Establecer un valor en el caché con manejo de errores
     */
    setCacheValue<T>(key: string, value: T, ttlMs?: number): boolean;
}
export declare const cacheInvalidationService: CacheInvalidationService;
//# sourceMappingURL=CacheInvalidationService.d.ts.map