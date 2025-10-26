"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usernameUpdateService = exports.UsernameUpdateService = void 0;
const interfaces_1 = require("../types/interfaces");
const ContentUpdateService_1 = require("./ContentUpdateService");
const CacheInvalidationService_1 = require("./CacheInvalidationService");
const ValidationService_1 = require("./ValidationService");
const db_1 = require("../middlewares/db");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Servicio principal para coordinar la actualización completa de nombre de usuario
 */
class UsernameUpdateService {
    contentUpdateService;
    cacheInvalidationService;
    constructor() {
        this.contentUpdateService = new ContentUpdateService_1.ContentUpdateService();
        this.cacheInvalidationService = new CacheInvalidationService_1.CacheInvalidationService();
    }
    /**
     * Método principal para actualizar el nombre de usuario con todas las operaciones necesarias
     */
    async updateUsername(options) {
        const startTime = Date.now();
        const result = {
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
        logger_1.default.info('UsernameUpdateService.updateUsername iniciado', {
            userId: options.userId,
            newUsername: options.newUsername,
            dryRun: options.dryRun,
            context: 'username-update-start'
        });
        let transactionConn = null;
        try {
            // 1. Obtener información del usuario actual
            const user = await this.getCurrentUser(options.userId);
            if (!user) {
                throw new interfaces_1.AppError(404, 'Usuario no encontrado');
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
                transactionConn = await db_1.pool.getConnection();
                await transactionConn.beginTransaction();
                logger_1.default.debug('Transacción iniciada', {
                    userId: options.userId,
                    oldUsername: user.username,
                    newUsername: options.newUsername,
                    context: 'username-update-transaction-start'
                });
            }
            // 4. Actualizar referencias de contenido si no se omite
            if (!options.skipContentUpdate) {
                try {
                    const contentOptions = {
                        oldUsername: user.username,
                        newUsername: options.newUsername,
                        dryRun: options.dryRun
                    };
                    result.contentUpdate = await this.contentUpdateService.updateContentReferences(contentOptions);
                    logger_1.default.info('Referencias de contenido actualizadas', {
                        userId: options.userId,
                        totalReferences: result.contentUpdate.totalReferences,
                        updatedReferences: result.contentUpdate.updatedReferences,
                        context: 'username-update-content-updated'
                    });
                }
                catch (error) {
                    const errorMessage = `Error actualizando referencias de contenido: ${error instanceof Error ? error.message : String(error)}`;
                    result.errors.push(errorMessage);
                    throw new interfaces_1.AppError(500, errorMessage);
                }
            }
            // 5. Actualizar el username en la tabla de usuarios
            if (!options.dryRun) {
                try {
                    await this.updateUserUsername(options.userId, options.newUsername, transactionConn);
                    logger_1.default.info('Username actualizado en tabla de usuarios', {
                        userId: options.userId,
                        oldUsername: user.username,
                        newUsername: options.newUsername,
                        context: 'username-update-user-updated'
                    });
                }
                catch (error) {
                    const errorMessage = `Error actualizando username en usuarios: ${error}`;
                    result.errors.push(errorMessage);
                    throw new interfaces_1.AppError(500, errorMessage);
                }
            }
            // 6. Crear redirecciones 301 si no se omite
            if (!options.skipRedirects) {
                try {
                    result.redirectsCreated = await this.createRedirects(user.username, options.newUsername, options.dryRun ? null : transactionConn);
                    logger_1.default.info('Redirecciones 301 creadas', {
                        userId: options.userId,
                        oldUsername: user.username,
                        newUsername: options.newUsername,
                        redirectsCreated: result.redirectsCreated,
                        context: 'username-update-redirects-created'
                    });
                }
                catch (error) {
                    const errorMessage = `Error creando redirecciones: ${error}`;
                    result.errors.push(errorMessage);
                    logger_1.default.error(errorMessage, { userId: options.userId, error });
                }
            }
            // 7. Invalidar caché si no se omite
            if (!options.skipCacheInvalidation) {
                try {
                    const cacheContext = {
                        oldUsername: user.username,
                        newUsername: options.newUsername,
                        userId: options.userId,
                        user: user
                    };
                    const cacheOptions = {
                        dryRun: options.dryRun,
                        preserveUserId: options.preserveUserId,
                        createNewEntries: true
                    };
                    result.cacheInvalidation = await this.cacheInvalidationService.invalidateUserCache(cacheContext, cacheOptions);
                    logger_1.default.info('Caché invalidado', {
                        userId: options.userId,
                        keysInvalidated: result.cacheInvalidation?.invalidatedKeys.length || 0,
                        context: 'username-update-cache-invalidated'
                    });
                }
                catch (error) {
                    const errorMessage = `Error invalidando caché: ${error instanceof Error ? error.message : String(error)}`;
                    result.errors.push(errorMessage);
                    throw new interfaces_1.AppError(500, errorMessage);
                }
            }
            // 8. Confirmar transacción si no es dry run
            if (!options.dryRun && transactionConn) {
                await transactionConn.commit();
                logger_1.default.info('Transacción confirmada exitosamente', {
                    userId: options.userId,
                    oldUsername: user.username,
                    newUsername: options.newUsername,
                    context: 'username-update-transaction-committed'
                });
            }
            result.success = true;
        }
        catch (error) {
            // Manejo de errores con rollback automático
            result.success = false;
            if (error instanceof interfaces_1.AppError) {
                result.errors.push(error.message);
            }
            else {
                result.errors.push(`Error inesperado: ${error}`);
            }
            // Rollback automático
            if (transactionConn && !options.dryRun) {
                try {
                    await transactionConn.rollback();
                    result.rollbackPerformed = true;
                    logger_1.default.warn('Rollback realizado debido a error', {
                        userId: options.userId,
                        error: error instanceof Error ? error.message : String(error),
                        context: 'username-update-rollback-performed'
                    });
                }
                catch (rollbackError) {
                    logger_1.default.error('Error durante rollback', {
                        userId: options.userId,
                        originalError: error instanceof Error ? error.message : String(error),
                        rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
                        context: 'username-update-rollback-error'
                    });
                }
            }
            logger_1.default.error('Error en UsernameUpdateService.updateUsername', {
                userId: options.userId,
                newUsername: options.newUsername,
                error: error instanceof Error ? error.message : String(error),
                context: 'username-update-error'
            });
        }
        finally {
            // Liberar conexión
            if (transactionConn) {
                transactionConn.release();
            }
            result.executionTimeMs = Date.now() - startTime;
            logger_1.default.info('UsernameUpdateService.updateUsername completado', {
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
    async previewUsernameUpdate(userId, newUsername) {
        logger_1.default.info('UsernameUpdateService.previewUsernameUpdate iniciado', {
            userId,
            newUsername,
            context: 'username-update-preview-start'
        });
        const preview = {
            oldUsername: '',
            newUsername,
            userId,
            contentReferences: {
                comments: 0,
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
            }
            catch (error) {
                preview.warnings.push(error instanceof Error ? error.message : String(error));
                preview.canProceed = false;
            }
            // 3. Obtener estadísticas de referencias de contenido
            try {
                const contentStats = await this.contentUpdateService.getReferenceStatistics(user.username);
                preview.contentReferences = contentStats;
            }
            catch (error) {
                preview.warnings.push(`Error obteniendo estadísticas de contenido: ${error instanceof Error ? error.message : String(error)}`);
            }
            // 4. Obtener información de caché (simulada)
            try {
                const cacheStats = this.cacheInvalidationService.getInvalidationStats();
                preview.cacheEntries = cacheStats.keys.filter(key => key.includes(user.username) || key.includes(userId));
            }
            catch (error) {
                preview.warnings.push(`Error obteniendo estadísticas de caché: ${error instanceof Error ? error.message : String(error)}`);
            }
            logger_1.default.info('UsernameUpdateService.previewUsernameUpdate completado', {
                userId,
                oldUsername: preview.oldUsername,
                newUsername: preview.newUsername,
                totalReferences: preview.contentReferences.total,
                cacheEntriesCount: preview.cacheEntries.length,
                canProceed: preview.canProceed,
                context: 'username-update-preview-complete'
            });
        }
        catch (error) {
            preview.warnings.push(`Error generando preview: ${error instanceof Error ? error.message : String(error)}`);
            preview.canProceed = false;
            logger_1.default.error('Error en previewUsernameUpdate', {
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
    async getCurrentUser(userId) {
        try {
            const [userRows] = await db_1.pool.query('SELECT id, email, username, display_name, foto_perfil, creado_en FROM users WHERE id = ?', [userId]);
            if (userRows.length === 0) {
                return null;
            }
            const row = userRows[0];
            return {
                id: row.id,
                email: row.email,
                username: row.username,
                display_name: row.display_name,
                foto_perfil: row.foto_perfil,
                creado_en: row.creado_en
            };
        }
        catch (error) {
            logger_1.default.error('Error obteniendo usuario actual', {
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
    validateUsernameChange(oldUsername, newUsername) {
        // Validar usando ValidationService
        const validationResult = ValidationService_1.ValidationService.validateUpdateUsername({ username: newUsername });
        if (validationResult.error && validationResult.error.length > 0 && validationResult.error[0]) {
            throw new interfaces_1.AppError(400, `Username inválido: ${validationResult.error[0].message}`);
        }
        // Verificaciones adicionales específicas para cambio de username
        if (oldUsername === newUsername) {
            throw new interfaces_1.AppError(400, 'El nuevo username debe ser diferente al actual');
        }
        // Verificar que el nuevo username no esté en uso por otro usuario
        // Esta verificación se hará en la base de datos durante la actualización
    }
    /**
     * Actualizar el username en la tabla de usuarios
     */
    async updateUserUsername(userId, newUsername, connection) {
        const queryConn = connection || db_1.pool;
        // Verificar que el nuevo username no esté en uso por otro usuario
        const [existingUsers] = await queryConn.query('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, userId]);
        if (existingUsers.length > 0) {
            throw new interfaces_1.AppError(409, 'El username ya está en uso por otro usuario');
        }
        // Actualizar username
        await queryConn.query('UPDATE users SET username = ?, actualizado_en = NOW() WHERE id = ?', [newUsername, userId]);
    }
    /**
     * Crear redirecciones 301 para URLs antiguas
     */
    async createRedirects(oldUsername, newUsername, connection) {
        const queryConn = connection || db_1.pool;
        let redirectsCreated = 0;
        try {
            // Crear redirección para la página principal del usuario
            await queryConn.query(`INSERT INTO redirects (old_path, new_path, redirect_type, created_at, expires_at)
         VALUES (?, ?, '301', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
         ON DUPLICATE KEY UPDATE
         new_path = VALUES(new_path),
         created_at = NOW(),
         expires_at = DATE_ADD(NOW(), INTERVAL 1 YEAR)`, [`/${oldUsername}`, `/${newUsername}`]);
            redirectsCreated++;
            // Crear redirección para páginas específicas (/pagina/old-username -> /pagina/new-username)
            await queryConn.query(`INSERT INTO redirects (old_path, new_path, redirect_type, created_at, expires_at)
         VALUES (?, ?, '301', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
         ON DUPLICATE KEY UPDATE
         new_path = VALUES(new_path),
         created_at = NOW(),
         expires_at = DATE_ADD(NOW(), INTERVAL 1 YEAR)`, [`/pagina/${oldUsername}`, `/pagina/${newUsername}`]);
            redirectsCreated++;
            logger_1.default.debug('Redirecciones 301 creadas', {
                oldUsername,
                newUsername,
                redirectsCreated,
                context: 'username-update-redirects-created'
            });
        }
        catch (error) {
            logger_1.default.error('Error creando redirecciones', {
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
    async getUpdateStatistics(userId) {
        try {
            // Esta consulta dependería de si tienes una tabla de auditoría
            // Por ahora devolveremos estadísticas básicas
            const [redirectCount] = await db_1.pool.query('SELECT COUNT(*) as count FROM redirects WHERE old_path LIKE ? OR new_path LIKE ?', [`%/${userId}%`, `%/${userId}%`]);
            return {
                totalUpdates: 0, // Se implementaría con tabla de auditoría
                lastUpdate: undefined, // Se implementaría con tabla de auditoría
                redirectsActive: redirectCount[0]?.count || 0,
                averageExecutionTimeMs: 0 // Se implementaría con tabla de auditoría
            };
        }
        catch (error) {
            logger_1.default.error('Error obteniendo estadísticas de actualización', {
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
    async cleanupExpiredRedirects() {
        try {
            const [result] = await db_1.pool.query('DELETE FROM redirects WHERE expires_at < NOW()');
            const deletedCount = result.affectedRows || 0;
            logger_1.default.info('Redirecciones expiradas limpiadas', {
                deletedCount,
                context: 'username-update-cleanup-redirects'
            });
            return deletedCount;
        }
        catch (error) {
            logger_1.default.error('Error limpiando redirecciones expiradas', {
                error: error instanceof Error ? error.message : String(error),
                context: 'username-update-cleanup-error'
            });
            throw error;
        }
    }
}
exports.UsernameUpdateService = UsernameUpdateService;
// Instancia singleton del servicio
exports.usernameUpdateService = new UsernameUpdateService();
//# sourceMappingURL=UsernameUpdateService.js.map