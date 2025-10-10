export declare class CacheService {
    private cache;
    private defaultTTL;
    /**
     * Obtener un valor del caché
     */
    get<T>(key: string): T | null;
    /**
     * Establecer un valor en el caché con TTL opcional
     */
    set<T>(key: string, value: T, ttlMs?: number): void;
    /**
     * Eliminar una clave específica del caché
     */
    delete(key: string): void;
    /**
     * Invalidar todas las claves que coincidan con un patrón
     */
    invalidatePattern(pattern: string): void;
    /**
     * Limpiar todo el caché
     */
    clear(): void;
    /**
     * Obtener estadísticas del caché
     */
    getStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Verificar si una clave existe y no ha expirado
     */
    has(key: string): boolean;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=CacheService.d.ts.map