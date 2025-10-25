import { cacheService } from './CacheService';
import { User } from '../types/interfaces';
import { AppError } from '../types/interfaces';
import winston from '../utils/logger';

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
export const USER_CACHE_PATTERNS = {
  USER_PROFILE: 'user:profile',
  USER_PAGES: 'user:pages',
  USER_COMMENTS: 'user:comments',
  USER_STATS: 'user:stats',
  USER_PREFERENCES: 'user:preferences',
  USER_SESSIONS: 'user:sessions',
  USER_ACTIVITY: 'user:activity'
} as const;

/**
 * Servicio para manejar la invalidación de caché relacionada con cambios de nombre de usuario
 */
export class CacheInvalidationService {
  private readonly defaultTTL = 300000; // 5 minutos en ms

  /**
   * Invalidar caché relacionado con el cambio de nombre de usuario
   */
  async invalidateUserCache(
    context: UsernameChangeContext,
    options: CacheInvalidationOptions = {}
  ): Promise<CacheInvalidationResult> {
    const result: CacheInvalidationResult = {
      success: true,
      invalidatedKeys: [],
      errors: [],
      timestamp: new Date()
    };

    const { oldUsername, newUsername, userId } = context;
    const { dryRun = false, createNewEntries = true, customPatterns = [] } = options;

    winston.info('Iniciando invalidación de caché por cambio de username', {
      oldUsername,
      newUsername,
      userId,
      dryRun,
      context: 'cache-invalidation-start'
    });

    try {
      // 1. Obtener estadísticas actuales del caché
      const initialStats = cacheService.getStats();
      winston.debug('Estadísticas iniciales del caché', {
        size: initialStats.size,
        keys: initialStats.keys,
        context: 'cache-invalidation-stats'
      });

      // 2. Invalidar patrones de caché del usuario antiguo
      const oldUserPatterns = this.generateUserCachePatterns(oldUsername, userId);
      const allPatterns = [...oldUserPatterns, ...customPatterns];

      winston.info('Patrones a invalidar', {
        patterns: allPatterns,
        oldUsername,
        context: 'cache-invalidation-patterns'
      });

      for (const pattern of allPatterns) {
        try {
          if (!dryRun) {
            cacheService.invalidatePattern(pattern);
          }

          // Registrar las claves que serían invalidadas (simulación)
          const keysToInvalidate = this.getKeysMatchingPattern(pattern, initialStats.keys);
          result.invalidatedKeys.push(...keysToInvalidate);

          winston.debug('Patrón de caché invalidado', {
            pattern,
            keysAffected: keysToInvalidate.length,
            context: 'cache-invalidation-pattern-done'
          });
        } catch (error) {
          const errorMessage = `Error invalidando patrón ${pattern}: ${error}`;
          result.errors.push(errorMessage);
          winston.error(errorMessage, { pattern, error, context: 'cache-invalidation-error' });
        }
      }

      // 3. Crear nuevas entradas de caché para el nuevo nombre de usuario
      if (createNewEntries && !dryRun) {
        await this.createNewUserCacheEntries(context, result);
      }

      // 4. Registrar resultado final
      winston.info('Invalidación de caché completada', {
        success: result.success,
        keysInvalidated: result.invalidatedKeys.length,
        errorsCount: result.errors.length,
        oldUsername,
        newUsername,
        context: 'cache-invalidation-complete'
      });

    } catch (error) {
      result.success = false;
      const errorMessage = `Error crítico en invalidación de caché: ${error}`;
      result.errors.push(errorMessage);

      winston.error(errorMessage, {
        error,
        oldUsername,
        newUsername,
        context: 'cache-invalidation-critical-error'
      });

      throw new AppError(500, 'Error durante la invalidación de caché del usuario');
    }

    return result;
  }

  /**
   * Generar patrones de caché específicos para un usuario
   */
  private generateUserCachePatterns(username: string, userId: string): string[] {
    const patterns = [
      `${USER_CACHE_PATTERNS.USER_PROFILE}:${username}`,
      `${USER_CACHE_PATTERNS.USER_PAGES}:${username}`,
      `${USER_CACHE_PATTERNS.USER_COMMENTS}:${username}`,
      `${USER_CACHE_PATTERNS.USER_STATS}:${username}`,
      `${USER_CACHE_PATTERNS.USER_PREFERENCES}:${username}`,
      `${USER_CACHE_PATTERNS.USER_SESSIONS}:${username}`,
      `${USER_CACHE_PATTERNS.USER_ACTIVITY}:${username}`,
      // Patrones con ID de usuario
      `${USER_CACHE_PATTERNS.USER_PROFILE}:${userId}`,
      `${USER_CACHE_PATTERNS.USER_PAGES}:${userId}`,
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
  private getKeysMatchingPattern(pattern: string, availableKeys: string[]): string[] {
    if (pattern.startsWith('*') && pattern.endsWith('*')) {
      const searchTerm = pattern.slice(1, -1);
      return availableKeys.filter(key => key.includes(searchTerm));
    } else if (pattern.startsWith('*')) {
      const suffix = pattern.slice(1);
      return availableKeys.filter(key => key.endsWith(suffix));
    } else if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return availableKeys.filter(key => key.startsWith(prefix));
    } else {
      return availableKeys.filter(key => key.includes(pattern));
    }
  }

  /**
   * Crear nuevas entradas de caché para el nuevo nombre de usuario
   */
  private async createNewUserCacheEntries(
    context: UsernameChangeContext,
    result: CacheInvalidationResult
  ): Promise<void> {
    const { newUsername, userId, user } = context;

    winston.info('Creando nuevas entradas de caché', {
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
        const profileKey = `${USER_CACHE_PATTERNS.USER_PROFILE}:${newUsername}`;
        cacheService.set(profileKey, {
          id: user.id,
          username: newUsername,
          email: user.email,
          display_name: user.display_name,
          foto_perfil: user.foto_perfil ? 'cached' : null,
          creado_en: user.creado_en
        }, this.defaultTTL);

        result.invalidatedKeys.push(profileKey);
        winston.debug('Nueva entrada de perfil creada', {
          key: profileKey,
          context: 'cache-invalidation-profile-created'
        });

        // Crear entrada de estadísticas básicas
        const statsKey = `${USER_CACHE_PATTERNS.USER_STATS}:${newUsername}`;
        cacheService.set(statsKey, {
          pagesCount: 0,
          commentsCount: 0,
          lastActivity: new Date(),
          username: newUsername
        }, this.defaultTTL);

        result.invalidatedKeys.push(statsKey);
        winston.debug('Nueva entrada de estadísticas creada', {
          key: statsKey,
          context: 'cache-invalidation-stats-created'
        });
      }

      winston.info('Nuevas entradas de caché creadas exitosamente', {
        newUsername,
        entriesCreated: 2,
        context: 'cache-invalidation-entries-created'
      });

    } catch (error) {
      const errorMessage = `Error creando nuevas entradas de caché: ${error}`;
      result.errors.push(errorMessage);

      winston.error(errorMessage, {
        error,
        newUsername,
        context: 'cache-invalidation-create-entries-error'
      });
    }
  }

  /**
   * Obtener estadísticas detalladas de la invalidación
   */
  getInvalidationStats(): { size: number; keys: string[] } {
    return cacheService.getStats();
  }

  /**
   * Limpiar completamente el caché (método de emergencia)
   */
  clearAllCache(): void {
    winston.warn('Limpiando completamente el caché', {
      context: 'cache-invalidation-clear-all'
    });

    cacheService.clear();
  }

  /**
   * Verificar si una clave específica existe en el caché
   */
  hasCacheKey(key: string): boolean {
    return cacheService.has(key);
  }

  /**
   * Obtener un valor específico del caché
   */
  getCacheValue<T>(key: string): T | null {
    return cacheService.get<T>(key);
  }

  /**
   * Establecer un valor en el caché con manejo de errores
   */
  setCacheValue<T>(key: string, value: T, ttlMs?: number): boolean {
    try {
      cacheService.set(key, value, ttlMs);
      return true;
    } catch (error) {
      winston.error('Error estableciendo valor en caché', {
        key,
        error,
        context: 'cache-invalidation-set-error'
      });
      return false;
    }
  }
}

// Instancia singleton del servicio de invalidación de caché
export const cacheInvalidationService = new CacheInvalidationService();