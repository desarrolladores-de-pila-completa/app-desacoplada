import { UpdateStatistics } from './ContentUpdateService';
import { CacheInvalidationResult } from './CacheInvalidationService';
/**
 * Tipos e interfaces para el servicio de actualización de username
 */
export interface UsernameUpdateOptions {
    userId: string;
    newUsername: string;
    dryRun?: boolean;
    skipContentUpdate?: boolean;
    skipCacheInvalidation?: boolean;
    skipRedirects?: boolean;
    preserveUserId?: boolean;
}
export interface UsernameUpdateResult {
    success: boolean;
    oldUsername: string;
    newUsername: string;
    userId: string;
    contentUpdate?: UpdateStatistics;
    cacheInvalidation?: CacheInvalidationResult;
    redirectsCreated: number;
    errors: string[];
    warnings: string[];
    timestamp: Date;
    executionTimeMs: number;
    rollbackPerformed?: boolean;
}
export interface UsernameUpdatePreview {
    oldUsername: string;
    newUsername: string;
    userId: string;
    contentReferences: {
        comments: number;
        privateMessages: number;
        publications: number;
        total: number;
    };
    cacheEntries: string[];
    canProceed: boolean;
    warnings: string[];
}
export interface RedirectRule {
    id: number;
    old_path: string;
    new_path: string;
    redirect_type: '301' | '302';
    created_at: Date;
    expires_at?: Date;
}
/**
 * Servicio principal para coordinar la actualización completa de nombre de usuario
 */
export declare class UsernameUpdateService {
    private contentUpdateService;
    private cacheInvalidationService;
    constructor();
    /**
     * Método principal para actualizar el nombre de usuario con todas las operaciones necesarias
     */
    updateUsername(options: UsernameUpdateOptions): Promise<UsernameUpdateResult>;
    /**
     * Método para previsualizar cambios sin realizarlos
     */
    previewUsernameUpdate(userId: string, newUsername: string): Promise<UsernameUpdatePreview>;
    /**
     * Obtener información completa del usuario actual
     */
    private getCurrentUser;
    /**
     * Validar el cambio de username
     */
    private validateUsernameChange;
    /**
     * Actualizar el username en la tabla de usuarios
     */
    private updateUserUsername;
    /**
     * Crear redirecciones 301 para URLs antiguas
     */
    private createRedirects;
    /**
     * Obtener estadísticas históricas de actualizaciones de username
     */
    getUpdateStatistics(userId: string): Promise<{
        totalUpdates: number;
        lastUpdate?: Date;
        redirectsActive: number;
        averageExecutionTimeMs: number;
    }>;
    /**
     * Limpiar redirecciones expiradas
     */
    cleanupExpiredRedirects(): Promise<number>;
}
export declare const usernameUpdateService: UsernameUpdateService;
//# sourceMappingURL=UsernameUpdateService.d.ts.map