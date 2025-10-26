"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentUpdateService = void 0;
const interfaces_1 = require("../types/interfaces");
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("../middlewares/db");
const CommentRepository_1 = require("../repositories/CommentRepository");
const PrivateMessageRepository_1 = require("../repositories/PrivateMessageRepository");
const PublicacionRepository_1 = require("../repositories/PublicacionRepository");
class ContentUpdateService {
    commentRepository;
    privateMessageRepository;
    publicacionRepository;
    constructor() {
        this.commentRepository = new CommentRepository_1.CommentRepository();
        this.privateMessageRepository = new PrivateMessageRepository_1.PrivateMessageRepository();
        this.publicacionRepository = new PublicacionRepository_1.PublicacionRepository();
    }
    /**
     * Método principal para actualizar referencias de username en todo el contenido
     */
    async updateContentReferences(options) {
        logger_1.default.info('ContentUpdateService.updateContentReferences iniciado', {
            oldUsername: options.oldUsername,
            newUsername: options.newUsername,
            dryRun: options.dryRun
        });
        const stats = {
            totalReferences: 0,
            updatedReferences: 0,
            errors: [],
            details: {
                comments: { found: 0, updated: 0 },
                privateMessages: { found: 0, updated: 0 },
                publications: { found: 0, updated: 0 }
            }
        };
        try {
            // Validar entrada
            this.validateInput(options);
            // Obtener patrones de búsqueda seguros
            const patterns = this.generateSearchPatterns(options);
            // Buscar y actualizar referencias en cada tipo de contenido
            await this.updateCommentsReferences(options, patterns, stats);
            await this.updatePrivateMessagesReferences(options, patterns, stats);
            await this.updatePublicationsReferences(options, patterns, stats);
            logger_1.default.info('ContentUpdateService.updateContentReferences completado', {
                totalReferences: stats.totalReferences,
                updatedReferences: stats.updatedReferences,
                errorsCount: stats.errors.length
            });
            return stats;
        }
        catch (error) {
            logger_1.default.error('Error en ContentUpdateService.updateContentReferences', { error });
            throw error;
        }
    }
    /**
     * Validar entrada del usuario
     */
    validateInput(options) {
        if (!options.oldUsername || !options.newUsername) {
            throw new interfaces_1.AppError(400, 'Los nombres de usuario antiguos y nuevos son requeridos');
        }
        if (options.oldUsername === options.newUsername) {
            throw new interfaces_1.AppError(400, 'Los nombres de usuario deben ser diferentes');
        }
        if (options.oldUsername.length < 3 || options.newUsername.length < 3) {
            throw new interfaces_1.AppError(400, 'Los nombres de usuario deben tener al menos 3 caracteres');
        }
        // Validar caracteres permitidos en usernames
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(options.oldUsername) || !usernameRegex.test(options.newUsername)) {
            throw new interfaces_1.AppError(400, 'Los nombres de usuario solo pueden contener letras, números, guiones y guiones bajos');
        }
    }
    /**
     * Generar patrones de búsqueda seguros para diferentes contextos
     */
    generateSearchPatterns(options) {
        const { oldUsername, newUsername, caseSensitive = false } = options;
        const flags = caseSensitive ? 'g' : 'gi';
        return [
            // Patrón para menciones directas (@username)
            {
                pattern: new RegExp(`@${oldUsername}\\b`, flags),
                replacement: `@${newUsername}`,
                description: 'Menciones directas (@username)'
            },
            // Patrón para enlaces a páginas (/pagina/username)
            {
                pattern: new RegExp(`/pagina/${oldUsername}\\b`, flags),
                replacement: `/pagina/${newUsername}`,
                description: 'Enlaces a páginas (/pagina/username)'
            },
            // Patrón para texto plano (username como palabra independiente)
            {
                pattern: new RegExp(`\\b${this.escapeRegex(oldUsername)}\\b`, flags),
                replacement: newUsername,
                description: 'Texto plano (palabra independiente)'
            }
        ];
    }
    /**
     * Escapar caracteres especiales para uso en expresiones regulares
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Actualizar referencias en comentarios
     */
    async updateCommentsReferences(options, patterns, stats) {
        try {
            logger_1.default.debug('Buscando referencias en comentarios', { oldUsername: options.oldUsername });
            // Buscar comentarios que contengan referencias al username antiguo
            const [commentRows] = await db_1.pool.query(`SELECT id, comentario, user_id FROM comentarios
         WHERE comentario LIKE ? OR comentario LIKE ? OR comentario LIKE ?`, [`%@${options.oldUsername}%`, `%/pagina/${options.oldUsername}%`, `%%${options.oldUsername}%%`]);
            stats.details.comments.found = commentRows.length;
            for (const row of commentRows) {
                try {
                    const originalContent = row.comentario;
                    let updatedContent = originalContent;
                    // Aplicar todos los patrones de búsqueda
                    for (const pattern of patterns) {
                        updatedContent = updatedContent.replace(pattern.pattern, pattern.replacement);
                    }
                    // Si el contenido cambió y no es dry run, actualizar
                    if (updatedContent !== originalContent) {
                        if (!options.dryRun) {
                            await db_1.pool.query('UPDATE comentarios SET comentario = ? WHERE id = ?', [updatedContent, row.id]);
                        }
                        stats.details.comments.updated++;
                        stats.updatedReferences++;
                    }
                    stats.totalReferences++;
                }
                catch (error) {
                    stats.errors.push({
                        type: 'comment',
                        id: row.id,
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                    logger_1.default.error(`Error actualizando comentario ${row.id}`, { error });
                }
            }
            logger_1.default.info(`Comentarios procesados: ${stats.details.comments.found} encontrados, ${stats.details.comments.updated} actualizados`);
        }
        catch (error) {
            logger_1.default.error('Error procesando comentarios', { error });
            throw error;
        }
    }
    /**
     * Actualizar referencias en mensajes privados
     */
    async updatePrivateMessagesReferences(options, patterns, stats) {
        try {
            logger_1.default.debug('Buscando referencias en mensajes privados', { oldUsername: options.oldUsername });
            // Buscar mensajes privados que contengan referencias
            const [messageRows] = await db_1.pool.query(`SELECT id, message FROM private_messages
         WHERE message LIKE ? OR message LIKE ? OR message LIKE ?`, [`%@${options.oldUsername}%`, `%/pagina/${options.oldUsername}%`, `%%${options.oldUsername}%%`]);
            stats.details.privateMessages.found = messageRows.length;
            for (const row of messageRows) {
                try {
                    const originalContent = row.message;
                    let updatedContent = originalContent;
                    // Aplicar todos los patrones de búsqueda
                    for (const pattern of patterns) {
                        updatedContent = updatedContent.replace(pattern.pattern, pattern.replacement);
                    }
                    // Si el contenido cambió y no es dry run, actualizar
                    if (updatedContent !== originalContent) {
                        if (!options.dryRun) {
                            await db_1.pool.query('UPDATE private_messages SET message = ? WHERE id = ?', [updatedContent, row.id]);
                        }
                        stats.details.privateMessages.updated++;
                        stats.updatedReferences++;
                    }
                    stats.totalReferences++;
                }
                catch (error) {
                    stats.errors.push({
                        type: 'private_message',
                        id: row.id,
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                    logger_1.default.error(`Error actualizando mensaje privado ${row.id}`, { error });
                }
            }
            logger_1.default.info(`Mensajes privados procesados: ${stats.details.privateMessages.found} encontrados, ${stats.details.privateMessages.updated} actualizados`);
        }
        catch (error) {
            logger_1.default.error('Error procesando mensajes privados', { error });
            throw error;
        }
    }
    /**
     * Actualizar referencias en publicaciones
     */
    async updatePublicationsReferences(options, patterns, stats) {
        try {
            logger_1.default.debug('Buscando referencias en publicaciones', { oldUsername: options.oldUsername });
            // Buscar publicaciones que contengan referencias
            const [publicationRows] = await db_1.pool.query(`SELECT id, titulo, contenido FROM publicaciones
         WHERE titulo LIKE ? OR titulo LIKE ? OR titulo LIKE ?
            OR contenido LIKE ? OR contenido LIKE ? OR contenido LIKE ?`, [
                `%@${options.oldUsername}%`, `%/pagina/${options.oldUsername}%`, `%%${options.oldUsername}%%`,
                `%@${options.oldUsername}%`, `%/pagina/${options.oldUsername}%`, `%%${options.oldUsername}%%`
            ]);
            stats.details.publications.found = publicationRows.length;
            for (const row of publicationRows) {
                try {
                    let needsUpdate = false;
                    const updates = {};
                    // Procesar título
                    if (row.titulo) {
                        let updatedTitulo = row.titulo;
                        for (const pattern of patterns) {
                            updatedTitulo = updatedTitulo.replace(pattern.pattern, pattern.replacement);
                        }
                        if (updatedTitulo !== row.titulo) {
                            updates.titulo = updatedTitulo;
                            needsUpdate = true;
                        }
                    }
                    // Procesar contenido
                    if (row.contenido) {
                        let updatedContenido = row.contenido;
                        for (const pattern of patterns) {
                            updatedContenido = updatedContenido.replace(pattern.pattern, pattern.replacement);
                        }
                        if (updatedContenido !== row.contenido) {
                            updates.contenido = updatedContenido;
                            needsUpdate = true;
                        }
                    }
                    // Actualizar si hay cambios y no es dry run
                    if (needsUpdate && !options.dryRun) {
                        const setParts = Object.keys(updates).map(key => `${key} = ?`).join(', ');
                        const values = Object.values(updates);
                        values.push(row.id);
                        await db_1.pool.query(`UPDATE publicaciones SET ${setParts}, updated_at = NOW() WHERE id = ?`, values);
                    }
                    if (needsUpdate) {
                        stats.details.publications.updated++;
                        stats.updatedReferences++;
                    }
                    stats.totalReferences++;
                }
                catch (error) {
                    stats.errors.push({
                        type: 'publication',
                        id: row.id,
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                    logger_1.default.error(`Error actualizando publicación ${row.id}`, { error });
                }
            }
            logger_1.default.info(`Publicaciones procesadas: ${stats.details.publications.found} encontradas, ${stats.details.publications.updated} actualizadas`);
        }
        catch (error) {
            logger_1.default.error('Error procesando publicaciones', { error });
            throw error;
        }
    }
    /**
     * Método para hacer una prueba sin actualizar (dry run)
     */
    async previewContentUpdates(options) {
        logger_1.default.info('ContentUpdateService.previewContentUpdates iniciado', {
            oldUsername: options.oldUsername,
            newUsername: options.newUsername
        });
        return await this.updateContentReferences({ ...options, dryRun: true });
    }
    /**
     * Obtener estadísticas detalladas de referencias sin actualizar
     */
    async getReferenceStatistics(oldUsername) {
        logger_1.default.info('ContentUpdateService.getReferenceStatistics iniciado', { oldUsername });
        try {
            this.validateInput({ oldUsername, newUsername: 'temp' });
            // Contar referencias en cada tipo de contenido
            const [commentCount] = await db_1.pool.query(`SELECT COUNT(*) as count FROM comentarios
         WHERE comentario LIKE ? OR comentario LIKE ? OR comentario LIKE ?`, [`%@${oldUsername}%`, `%/pagina/${oldUsername}%`, `%%${oldUsername}%%`]);
            const [messageCount] = await db_1.pool.query(`SELECT COUNT(*) as count FROM private_messages
         WHERE message LIKE ? OR message LIKE ? OR message LIKE ?`, [`%@${oldUsername}%`, `%/pagina/${oldUsername}%`, `%%${oldUsername}%%`]);
            const [publicationCount] = await db_1.pool.query(`SELECT COUNT(*) as count FROM publicaciones
         WHERE titulo LIKE ? OR titulo LIKE ? OR titulo LIKE ?
            OR contenido LIKE ? OR contenido LIKE ? OR contenido LIKE ?`, [
                `%@${oldUsername}%`, `%/pagina/${oldUsername}%`, `%%${oldUsername}%%`,
                `%@${oldUsername}%`, `%/pagina/${oldUsername}%`, `%%${oldUsername}%%`
            ]);
            const result = {
                comments: commentCount[0]?.count || 0,
                privateMessages: messageCount[0]?.count || 0,
                publications: publicationCount[0]?.count || 0,
                total: (commentCount[0]?.count || 0) +
                    (messageCount[0]?.count || 0) +
                    (publicationCount[0]?.count || 0)
            };
            logger_1.default.info('ContentUpdateService.getReferenceStatistics completado', result);
            return result;
        }
        catch (error) {
            logger_1.default.error('Error en ContentUpdateService.getReferenceStatistics', { error });
            throw error;
        }
    }
}
exports.ContentUpdateService = ContentUpdateService;
//# sourceMappingURL=ContentUpdateService.js.map