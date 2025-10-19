import { User, AppError } from '../types/interfaces';
import { ContentUpdateService, UpdateStatistics, ContentUpdateOptions } from './ContentUpdateService';
import { CacheInvalidationService, CacheInvalidationResult, UsernameChangeContext, CacheInvalidationOptions } from './CacheInvalidationService';
import { ValidationService } from './ValidationService';
import { pool } from '../middlewares/db';
import winston from '../utils/logger';

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
    feed: number;
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
export class UsernameUpdateService {
  private contentUpdateService: ContentUpdateService;
  private cacheInvalidationService: CacheInvalidationService;

  constructor() {
    this.contentUpdateService = new ContentUpdateService();
    this.cacheInvalidationService = new CacheInvalidationService();
  }

  /**
   * Método principal para actualizar el nombre de usuario con todas las operaciones necesarias
   */
  async updateUsername(options: UsernameUpdateOptions): Promise<UsernameUpdateResult> {
    const startTime = Date.now();
    const result: UsernameUpdateResult = {
      success: false,
      oldUsername: '',
      newUsername: options.newUsername,
      userId: options.userId,
      redirectsCreated: 0,
      errors: [],
      warnings: [],
      timestamp: new Date(),
      executionTimeMs: 0
    };

    winston.info('UsernameUpdateService.updateUsername iniciado', {
      userId: options.userId,
      newUsername: options.newUsername,
      dryRun: options.dryRun,
      context: 'username-update-start'
    });

    let transactionConn: any = null;

    try {
      // 1. Obtener información del usuario actual
      const user = await this.getCurrentUser(options.userId);
      if (!user) {
        throw new AppError(404, 'Usuario no encontrado');
      }

      result.oldUsername = user.username;

      // Validar que el cambio sea necesario
      if (user.username === options.newUsername) {
        result.warnings.push('El nuevo username es igual al actual');
        result.success = true;
        result.executionTimeMs = Date.now() - startTime;
        return result;
      }

      // 2. Validar el nuevo username
      this.validateUsernameChange(user.username, options.newUsername);

      // 3. Iniciar transacción si no es dry run
      if (!options.dryRun) {
        transactionConn = await pool.getConnection();
        await transactionConn.beginTransaction();

        winston.debug('Transacción iniciada', {
          userId: options.userId,
          oldUsername: user.username,
          newUsername: options.newUsername,
          context: 'username-update-transaction-start'
        });
      }

      // 4. Actualizar referencias de contenido si no se omite
      if (!options.skipContentUpdate) {
        try {
          const contentOptions: ContentUpdateOptions = {
            oldUsername: user.username,
            newUsername: options.newUsername,
            dryRun: options.dryRun
          };

          result.contentUpdate = await this.contentUpdateService.updateContentReferences(contentOptions);

          winston.info('Referencias de contenido actualizadas', {
            userId: options.userId,
            totalReferences: result.contentUpdate.totalReferences,
            updatedReferences: result.contentUpdate.updatedReferences,
            context: 'username-update-content-updated'
          });

        } catch (error) {
          const errorMessage = `Error actualizando referencias de contenido: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMessage);
          throw new AppError(500, errorMessage);
        }
      }

      // 5. Actualizar el username en la tabla de usuarios
      if (!options.dryRun) {
        try {
          await this.updateUserUsername(options.userId, options.newUsername, transactionConn);

          winston.info('Username actualizado en tabla de usuarios', {
            userId: options.userId,
            oldUsername: user.username,
            newUsername: options.newUsername,
            context: 'username-update-user-updated'
          });

        } catch (error) {
          const errorMessage = `Error actualizando username en usuarios: ${error}`;
          result.errors.push(errorMessage);
          throw new AppError(500, errorMessage);
        }
      }

      // 6. Crear redirecciones 301 si no se omite
      if (!options.skipRedirects) {
        try {
          result.redirectsCreated = await this.createRedirects(
            user.username,
            options.newUsername,
            options.dryRun ? null : transactionConn
          );

          winston.info('Redirecciones 301 creadas', {
            userId: options.userId,
            oldUsername: user.username,
            newUsername: options.newUsername,
            redirectsCreated: result.redirectsCreated,
            context: 'username-update-redirects-created'
          });

        } catch (error) {
          const errorMessage = `Error creando redirecciones: ${error}`;
          result.errors.push(errorMessage);
          winston.error(errorMessage, { userId: options.userId, error });
        }
      }

      // 7. Invalidar caché si no se omite
      if (!options.skipCacheInvalidation) {
        try {
          const cacheContext: UsernameChangeContext = {
            oldUsername: user.username,
            newUsername: options.newUsername,
            userId: options.userId,
            user: user
          };

          const cacheOptions: CacheInvalidationOptions = {
            dryRun: options.dryRun,
            preserveUserId: options.preserveUserId,
            createNewEntries: true
          };

          result.cacheInvalidation = await this.cacheInvalidationService.invalidateUserCache(
            cacheContext,
            cacheOptions
          );

          winston.info('Caché invalidado', {
            userId: options.userId,
            keysInvalidated: result.cacheInvalidation?.invalidatedKeys.length || 0,
            context: 'username-update-cache-invalidated'
          });

        } catch (error) {
          const errorMessage = `Error invalidando caché: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMessage);
          throw new AppError(500, errorMessage);
        }
      }

      // 8. Confirmar transacción si no es dry run
      if (!options.dryRun && transactionConn) {
        await transactionConn.commit();

        winston.info('Transacción confirmada exitosamente', {
          userId: options.userId,
          oldUsername: user.username,
          newUsername: options.newUsername,
          context: 'username-update-transaction-committed'
        });
      }

      result.success = true;

    } catch (error) {
      // Manejo de errores con rollback automático
      result.success = false;

      if (error instanceof AppError) {
        result.errors.push(error.message);
      } else {
        result.errors.push(`Error inesperado: ${error}`);
      }

      // Rollback automático
      if (transactionConn && !options.dryRun) {
        try {
          await transactionConn.rollback();
          result.rollbackPerformed = true;

          winston.warn('Rollback realizado debido a error', {
            userId: options.userId,
            error: error instanceof Error ? error.message : String(error),
            context: 'username-update-rollback-performed'
          });

        } catch (rollbackError) {
          winston.error('Error durante rollback', {
            userId: options.userId,
            originalError: error instanceof Error ? error.message : String(error),
            rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
            context: 'username-update-rollback-error'
          });
        }
      }

      winston.error('Error en UsernameUpdateService.updateUsername', {
        userId: options.userId,
        newUsername: options.newUsername,
        error: error instanceof Error ? error.message : String(error),
        context: 'username-update-error'
      });

    } finally {
      // Liberar conexión
      if (transactionConn) {
        transactionConn.release();
      }

      result.executionTimeMs = Date.now() - startTime;

      winston.info('UsernameUpdateService.updateUsername completado', {
        userId: options.userId,
        success: result.success,
        executionTimeMs: result.executionTimeMs,
        errorsCount: result.errors.length,
        context: 'username-update-complete'
      });
    }

    return result;
  }

  /**
   * Método para previsualizar cambios sin realizarlos
   */
  async previewUsernameUpdate(userId: string, newUsername: string): Promise<UsernameUpdatePreview> {
    winston.info('UsernameUpdateService.previewUsernameUpdate iniciado', {
      userId,
      newUsername,
      context: 'username-update-preview-start'
    });

    const preview: UsernameUpdatePreview = {
      oldUsername: '',
      newUsername,
      userId,
      contentReferences: {
        comments: 0,
        feed: 0,
        privateMessages: 0,
        publications: 0,
        total: 0
      },
      cacheEntries: [],
      canProceed: false,
      warnings: []
    };

    try {
      // 1. Obtener información del usuario actual
      const user = await this.getCurrentUser(userId);
      if (!user) {
        preview.warnings.push('Usuario no encontrado');
        return preview;
      }

      preview.oldUsername = user.username;

      // 2. Validar el cambio
      try {
        this.validateUsernameChange(user.username, newUsername);
        preview.canProceed = true;
      } catch (error) {
        preview.warnings.push(error instanceof Error ? error.message : String(error));
        preview.canProceed = false;
      }

      // 3. Obtener estadísticas de referencias de contenido
      try {
        const contentStats = await this.contentUpdateService.getReferenceStatistics(user.username);
        preview.contentReferences = contentStats;
      } catch (error) {
        preview.warnings.push(`Error obteniendo estadísticas de contenido: ${error instanceof Error ? error.message : String(error)}`);
      }

      // 4. Obtener información de caché (simulada)
      try {
        const cacheStats = this.cacheInvalidationService.getInvalidationStats();
        preview.cacheEntries = cacheStats.keys.filter(key =>
          key.includes(user.username) || key.includes(userId)
        );
      } catch (error) {
        preview.warnings.push(`Error obteniendo estadísticas de caché: ${error instanceof Error ? error.message : String(error)}`);
      }

      winston.info('UsernameUpdateService.previewUsernameUpdate completado', {
        userId,
        oldUsername: preview.oldUsername,
        newUsername: preview.newUsername,
        totalReferences: preview.contentReferences.total,
        cacheEntriesCount: preview.cacheEntries.length,
        canProceed: preview.canProceed,
        context: 'username-update-preview-complete'
      });

    } catch (error) {
      preview.warnings.push(`Error generando preview: ${error instanceof Error ? error.message : String(error)}`);
      preview.canProceed = false;

      winston.error('Error en previewUsernameUpdate', {
        userId,
        newUsername,
        error: error instanceof Error ? error.message : String(error),
        context: 'username-update-preview-error'
      });
    }

    return preview;
  }

  /**
   * Obtener información completa del usuario actual
   */
  private async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const [userRows] = await pool.query(
        'SELECT id, email, username, display_name, foto_perfil, creado_en FROM users WHERE id = ?',
        [userId]
      );

      if ((userRows as any[]).length === 0) {
        return null;
      }

      const row = (userRows as any[])[0];
      return {
        id: row.id,
        email: row.email,
        username: row.username,
        display_name: row.display_name,
        foto_perfil: row.foto_perfil,
        creado_en: row.creado_en
      };

    } catch (error) {
      winston.error('Error obteniendo usuario actual', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        context: 'username-update-get-user-error'
      });
      throw error;
    }
  }

  /**
   * Validar el cambio de username
   */
  private validateUsernameChange(oldUsername: string, newUsername: string): void {
    // Validar usando ValidationService
    const validationResult = ValidationService.validateUpdateUsername({ username: newUsername });

    if (validationResult.error && validationResult.error.length > 0 && validationResult.error[0]) {
      throw new AppError(400, `Username inválido: ${validationResult.error[0].message}`);
    }

    // Verificaciones adicionales específicas para cambio de username
    if (oldUsername === newUsername) {
      throw new AppError(400, 'El nuevo username debe ser diferente al actual');
    }

    // Verificar que el nuevo username no esté en uso por otro usuario
    // Esta verificación se hará en la base de datos durante la actualización
  }

  /**
   * Actualizar el username en la tabla de usuarios
   */
  private async updateUserUsername(
    userId: string,
    newUsername: string,
    connection?: any
  ): Promise<void> {
    const queryConn = connection || pool;

    // Verificar que el nuevo username no esté en uso por otro usuario
    const [existingUsers] = await queryConn.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [newUsername, userId]
    );

    if ((existingUsers as any[]).length > 0) {
      throw new AppError(409, 'El username ya está en uso por otro usuario');
    }

    // Actualizar username
    await queryConn.query(
      'UPDATE users SET username = ?, actualizado_en = NOW() WHERE id = ?',
      [newUsername, userId]
    );
  }

  /**
   * Crear redirecciones 301 para URLs antiguas
   */
  private async createRedirects(
    oldUsername: string,
    newUsername: string,
    connection?: any
  ): Promise<number> {
    const queryConn = connection || pool;
    let redirectsCreated = 0;

    try {
      // Crear redirección para la página principal del usuario
      await queryConn.query(
        `INSERT INTO redirects (old_path, new_path, redirect_type, created_at, expires_at)
         VALUES (?, ?, '301', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
         ON DUPLICATE KEY UPDATE
         new_path = VALUES(new_path),
         created_at = NOW(),
         expires_at = DATE_ADD(NOW(), INTERVAL 1 YEAR)`,
        [`/${oldUsername}`, `/${newUsername}`]
      );
      redirectsCreated++;

      // Crear redirección para páginas específicas (/pagina/old-username -> /pagina/new-username)
      await queryConn.query(
        `INSERT INTO redirects (old_path, new_path, redirect_type, created_at, expires_at)
         VALUES (?, ?, '301', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
         ON DUPLICATE KEY UPDATE
         new_path = VALUES(new_path),
         created_at = NOW(),
         expires_at = DATE_ADD(NOW(), INTERVAL 1 YEAR)`,
        [`/pagina/${oldUsername}`, `/pagina/${newUsername}`]
      );
      redirectsCreated++;

      winston.debug('Redirecciones 301 creadas', {
        oldUsername,
        newUsername,
        redirectsCreated,
        context: 'username-update-redirects-created'
      });

    } catch (error) {
      winston.error('Error creando redirecciones', {
        oldUsername,
        newUsername,
        error: error instanceof Error ? error.message : String(error),
        context: 'username-update-redirects-error'
      });
      throw error;
    }

    return redirectsCreated;
  }

  /**
   * Obtener estadísticas históricas de actualizaciones de username
   */
  async getUpdateStatistics(userId: string): Promise<{
    totalUpdates: number;
    lastUpdate?: Date;
    redirectsActive: number;
    averageExecutionTimeMs: number;
  }> {
    try {
      // Esta consulta dependería de si tienes una tabla de auditoría
      // Por ahora devolveremos estadísticas básicas
      const [redirectCount] = await pool.query(
        'SELECT COUNT(*) as count FROM redirects WHERE old_path LIKE ? OR new_path LIKE ?',
        [`%/${userId}%`, `%/${userId}%`]
      );

      return {
        totalUpdates: 0, // Se implementaría con tabla de auditoría
        lastUpdate: undefined, // Se implementaría con tabla de auditoría
        redirectsActive: (redirectCount as any[])[0]?.count || 0,
        averageExecutionTimeMs: 0 // Se implementaría con tabla de auditoría
      };

    } catch (error) {
      winston.error('Error obteniendo estadísticas de actualización', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        context: 'username-update-stats-error'
      });
      throw error;
    }
  }

  /**
   * Limpiar redirecciones expiradas
   */
  async cleanupExpiredRedirects(): Promise<number> {
    try {
      const [result] = await pool.query(
        'DELETE FROM redirects WHERE expires_at < NOW()'
      );

      const deletedCount = (result as any).affectedRows || 0;

      winston.info('Redirecciones expiradas limpiadas', {
        deletedCount,
        context: 'username-update-cleanup-redirects'
      });

      return deletedCount;

    } catch (error) {
      winston.error('Error limpiando redirecciones expiradas', {
        error: error instanceof Error ? error.message : String(error),
        context: 'username-update-cleanup-error'
      });
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const usernameUpdateService = new UsernameUpdateService();