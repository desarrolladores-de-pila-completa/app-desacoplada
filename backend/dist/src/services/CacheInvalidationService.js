"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheInvalidationService = exports.CacheInvalidationService = exports.USER_CACHE_PATTERNS = void 0;
const CacheService_1 = require("./CacheService");
const interfaces_1 = require("../types/interfaces");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Patrones de caché comunes que pueden estar asociados a un usuario
 */
exports.USER_CACHE_PATTERNS = {
    USER_PROFILE: 'user:profile',
    USER_PAGES: 'user:pages',
    USER_COMMENTS: 'user:comments',
    USER_STATS: 'user:stats',
    USER_PREFERENCES: 'user:preferences',
    USER_SESSIONS: 'user:sessions',
    USER_ACTIVITY: 'user:activity'
};
/**
 * Servicio para manejar la invalidación de caché relacionada con cambios de nombre de usuario
 */
class CacheInvalidationService {
    defaultTTL = 300000; // 5 minutos en ms
    /**
     * Invalidar caché relacionado con el cambio de nombre de usuario
     */
    async invalidateUserCache(context, options = {}) {
        const result = {
            success: true,
            invalidatedKeys: [],
            errors: [],
            timestamp: new Date()
        };
        const { oldUsername, newUsername, userId } = context;
        const { dryRun = false, createNewEntries = true, customPatterns = [] } = options;
        logger_1.default.info('Iniciando invalidación de caché por cambio de username', {
            oldUsername,
            newUsername,
            userId,
            dryRun,
            context: 'cache-invalidation-start'
        });
        try {
            // 1. Obtener estadísticas actuales del caché
            const initialStats = CacheService_1.cacheService.getStats();
            logger_1.default.debug('Estadísticas iniciales del caché', {
                size: initialStats.size,
                keys: initialStats.keys,
                context: 'cache-invalidation-stats'
            });
            // 2. Invalidar patrones de caché del usuario antiguo
            const oldUserPatterns = this.generateUserCachePatterns(oldUsername, userId);
            const allPatterns = [...oldUserPatterns, ...customPatterns];
            logger_1.default.info('Patrones a invalidar', {
                patterns: allPatterns,
                oldUsername,
                context: 'cache-invalidation-patterns'
            });
            for (const pattern of allPatterns) {
                try {
                    if (!dryRun) {
                        CacheService_1.cacheService.invalidatePattern(pattern);
                    }
                    // Registrar las claves que serían invalidadas (simulación)
                    const keysToInvalidate = this.getKeysMatchingPattern(pattern, initialStats.keys);
                    result.invalidatedKeys.push(...keysToInvalidate);
                    logger_1.default.debug('Patrón de caché invalidado', {
                        pattern,
                        keysAffected: keysToInvalidate.length,
                        context: 'cache-invalidation-pattern-done'
                    });
                }
                catch (error) {
                    const errorMessage = `Error invalidando patrón ${pattern}: ${error}`;
                    result.errors.push(errorMessage);
                    logger_1.default.error(errorMessage, { pattern, error, context: 'cache-invalidation-error' });
                }
            }
            // 3. Crear nuevas entradas de caché para el nuevo nombre de usuario
            if (createNewEntries && !dryRun) {
                await this.createNewUserCacheEntries(context, result);
            }
            // 4. Registrar resultado final
            logger_1.default.info('Invalidación de caché completada', {
                success: result.success,
                keysInvalidated: result.invalidatedKeys.length,
                errorsCount: result.errors.length,
                oldUsername,
                newUsername,
                context: 'cache-invalidation-complete'
            });
        }
        catch (error) {
            result.success = false;
            const errorMessage = `Error crítico en invalidación de caché: ${error}`;
            result.errors.push(errorMessage);
            logger_1.default.error(errorMessage, {
                error,
                oldUsername,
                newUsername,
                context: 'cache-invalidation-critical-error'
            });
            throw new interfaces_1.AppError(500, 'Error durante la invalidación de caché del usuario');
        }
        return result;
    }
    /**
     * Generar patrones de caché específicos para un usuario
     */
    generateUserCachePatterns(username, userId) {
        const patterns = [
            `${exports.USER_CACHE_PATTERNS.USER_PROFILE}:${username}`,
            `${exports.USER_CACHE_PATTERNS.USER_PAGES}:${username}`,
            `${exports.USER_CACHE_PATTERNS.USER_COMMENTS}:${username}`,
            `${exports.USER_CACHE_PATTERNS.USER_STATS}:${username}`,
            `${exports.USER_CACHE_PATTERNS.USER_PREFERENCES}:${username}`,
            `${exports.USER_CACHE_PATTERNS.USER_SESSIONS}:${username}`,
            `${exports.USER_CACHE_PATTERNS.USER_ACTIVITY}:${username}`,
            // Patrones con ID de usuario
            `${exports.USER_CACHE_PATTERNS.USER_PROFILE}:${userId}`,
            `${exports.USER_CACHE_PATTERNS.USER_PAGES}:${userId}`,
            // Patrones genéricos que pueden contener el username
            `*${username}*`,
            // Patrones de páginas específicas del usuario
            `page:owner:${username}`,
            `page:list:${username}`,
            // Patrones de comentarios del usuario
            `comment:user:${username}`,
            `comment:list:${username}`
        ];
        return patterns;
    }
    /**
     * Obtener claves que coinciden con un patrón (simulación basada en estadísticas)
     */
    getKeysMatchingPattern(pattern, availableKeys) {
        if (pattern.startsWith('*') && pattern.endsWith('*')) {
            const searchTerm = pattern.slice(1, -1);
            return availableKeys.filter(key => key.includes(searchTerm));
        }
        else if (pattern.startsWith('*')) {
            const suffix = pattern.slice(1);
            return availableKeys.filter(key => key.endsWith(suffix));
        }
        else if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            return availableKeys.filter(key => key.startsWith(prefix));
        }
        else {
            return availableKeys.filter(key => key.includes(pattern));
        }
    }
    /**
     * Crear nuevas entradas de caché para el nuevo nombre de usuario
     */
    async createNewUserCacheEntries(context, result) {
        const { newUsername, userId, user } = context;
        logger_1.default.info('Creando nuevas entradas de caché', {
            newUsername,
            userId,
            context: 'cache-invalidation-create-entries'
        });
        try {
            // Crear entradas básicas del nuevo usuario
            const newUserPatterns = this.generateUserCachePatterns(newUsername, userId);
            // Si tenemos información del usuario, podemos crear entradas más específicas
            if (user) {
                // Crear entrada de perfil básico
                const profileKey = `${exports.USER_CACHE_PATTERNS.USER_PROFILE}:${newUsername}`;
                CacheService_1.cacheService.set(profileKey, {
                    id: user.id,
                    username: newUsername,
                    email: user.email,
                    display_name: user.display_name,
                    foto_perfil: user.foto_perfil ? 'cached' : null,
                    creado_en: user.creado_en
                }, this.defaultTTL);
                result.invalidatedKeys.push(profileKey);
                logger_1.default.debug('Nueva entrada de perfil creada', {
                    key: profileKey,
                    context: 'cache-invalidation-profile-created'
                });
                // Crear entrada de estadísticas básicas
                const statsKey = `${exports.USER_CACHE_PATTERNS.USER_STATS}:${newUsername}`;
                CacheService_1.cacheService.set(statsKey, {
                    pagesCount: 0,
                    commentsCount: 0,
                    lastActivity: new Date(),
                    username: newUsername
                }, this.defaultTTL);
                result.invalidatedKeys.push(statsKey);
                logger_1.default.debug('Nueva entrada de estadísticas creada', {
                    key: statsKey,
                    context: 'cache-invalidation-stats-created'
                });
            }
            logger_1.default.info('Nuevas entradas de caché creadas exitosamente', {
                newUsername,
                entriesCreated: 2,
                context: 'cache-invalidation-entries-created'
            });
        }
        catch (error) {
            const errorMessage = `Error creando nuevas entradas de caché: ${error}`;
            result.errors.push(errorMessage);
            logger_1.default.error(errorMessage, {
                error,
                newUsername,
                context: 'cache-invalidation-create-entries-error'
            });
        }
    }
    /**
     * Obtener estadísticas detalladas de la invalidación
     */
    getInvalidationStats() {
        return CacheService_1.cacheService.getStats();
    }
    /**
     * Limpiar completamente el caché (método de emergencia)
     */
    clearAllCache() {
        logger_1.default.warn('Limpiando completamente el caché', {
            context: 'cache-invalidation-clear-all'
        });
        CacheService_1.cacheService.clear();
    }
    /**
     * Verificar si una clave específica existe en el caché
     */
    hasCacheKey(key) {
        return CacheService_1.cacheService.has(key);
    }
    /**
     * Obtener un valor específico del caché
     */
    getCacheValue(key) {
        return CacheService_1.cacheService.get(key);
    }
    /**
     * Establecer un valor en el caché con manejo de errores
     */
    setCacheValue(key, value, ttlMs) {
        try {
            CacheService_1.cacheService.set(key, value, ttlMs);
            return true;
        }
        catch (error) {
            logger_1.default.error('Error estableciendo valor en caché', {
                key,
                error,
                context: 'cache-invalidation-set-error'
            });
            return false;
        }
    }
}
exports.CacheInvalidationService = CacheInvalidationService;
// Instancia singleton del servicio de invalidación de caché
exports.cacheInvalidationService = new CacheInvalidationService();
//# sourceMappingURL=CacheInvalidationService.js.map