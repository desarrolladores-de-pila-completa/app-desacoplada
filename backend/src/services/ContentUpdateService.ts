import { AppError } from '../types/interfaces';
import winston from '../utils/logger';
import { pool } from "../middlewares/db";
import { CommentRepository } from '../repositories/CommentRepository';
import { PrivateMessageRepository } from '../repositories/PrivateMessageRepository';
import { PublicacionRepository } from '../repositories/PublicacionRepository';

// Interfaces para el servicio de actualización de contenido
export interface ContentUpdateOptions {
  oldUsername: string;
  newUsername: string;
  dryRun?: boolean; // Si es true, solo cuenta sin actualizar
  caseSensitive?: boolean;
}

export interface ContentReference {
  id: number;
  type: 'comment' | 'private_message' | 'publication';
  content: string;
  userId?: string;
  tableName: string;
  columnName: string;
}

export interface UpdateStatistics {
  totalReferences: number;
  updatedReferences: number;
  errors: Array<{ type: string; id: number; error: string }>;
  details: {
    comments: { found: number; updated: number };
    privateMessages: { found: number; updated: number };
    publications: { found: number; updated: number };
  };
}

export interface SearchPattern {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export class ContentUpdateService {
  private commentRepository: CommentRepository;
  private privateMessageRepository: PrivateMessageRepository;
  private publicacionRepository: PublicacionRepository;

  constructor() {
    this.commentRepository = new CommentRepository();
    this.privateMessageRepository = new PrivateMessageRepository();
    this.publicacionRepository = new PublicacionRepository();
  }

  /**
   * Método principal para actualizar referencias de username en todo el contenido
   */
  async updateContentReferences(options: ContentUpdateOptions): Promise<UpdateStatistics> {
    winston.info('ContentUpdateService.updateContentReferences iniciado', {
      oldUsername: options.oldUsername,
      newUsername: options.newUsername,
      dryRun: options.dryRun
    });

    const stats: UpdateStatistics = {
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

      winston.info('ContentUpdateService.updateContentReferences completado', {
        totalReferences: stats.totalReferences,
        updatedReferences: stats.updatedReferences,
        errorsCount: stats.errors.length
      });

      return stats;

    } catch (error) {
      winston.error('Error en ContentUpdateService.updateContentReferences', { error });
      throw error;
    }
  }

  /**
   * Validar entrada del usuario
   */
  private validateInput(options: ContentUpdateOptions): void {
    if (!options.oldUsername || !options.newUsername) {
      throw new AppError(400, 'Los nombres de usuario antiguos y nuevos son requeridos');
    }

    if (options.oldUsername === options.newUsername) {
      throw new AppError(400, 'Los nombres de usuario deben ser diferentes');
    }

    if (options.oldUsername.length < 3 || options.newUsername.length < 3) {
      throw new AppError(400, 'Los nombres de usuario deben tener al menos 3 caracteres');
    }

    // Validar caracteres permitidos en usernames
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(options.oldUsername) || !usernameRegex.test(options.newUsername)) {
      throw new AppError(400, 'Los nombres de usuario solo pueden contener letras, números, guiones y guiones bajos');
    }
  }

  /**
   * Generar patrones de búsqueda seguros para diferentes contextos
   */
  private generateSearchPatterns(options: ContentUpdateOptions): SearchPattern[] {
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
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Actualizar referencias en comentarios
   */
  private async updateCommentsReferences(
    options: ContentUpdateOptions,
    patterns: SearchPattern[],
    stats: UpdateStatistics
  ): Promise<void> {
    try {
      winston.debug('Buscando referencias en comentarios', { oldUsername: options.oldUsername });

      // Buscar comentarios que contengan referencias al username antiguo
      const [commentRows] = await pool.query(
        `SELECT id, comentario, user_id FROM comentarios
         WHERE comentario LIKE ? OR comentario LIKE ? OR comentario LIKE ?`,
        [`%@${options.oldUsername}%`, `%/pagina/${options.oldUsername}%`, `%%${options.oldUsername}%%`]
      );

      stats.details.comments.found = (commentRows as any[]).length;

      for (const row of commentRows as any[]) {
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
              await pool.query(
                'UPDATE comentarios SET comentario = ? WHERE id = ?',
                [updatedContent, row.id]
              );
            }
            stats.details.comments.updated++;
            stats.updatedReferences++;
          }

          stats.totalReferences++;
        } catch (error) {
          stats.errors.push({
            type: 'comment',
            id: row.id,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
          winston.error(`Error actualizando comentario ${row.id}`, { error });
        }
      }

      winston.info(`Comentarios procesados: ${stats.details.comments.found} encontrados, ${stats.details.comments.updated} actualizados`);
    } catch (error) {
      winston.error('Error procesando comentarios', { error });
      throw error;
    }
  }


  /**
   * Actualizar referencias en mensajes privados
   */
  private async updatePrivateMessagesReferences(
    options: ContentUpdateOptions,
    patterns: SearchPattern[],
    stats: UpdateStatistics
  ): Promise<void> {
    try {
      winston.debug('Buscando referencias en mensajes privados', { oldUsername: options.oldUsername });

      // Buscar mensajes privados que contengan referencias
      const [messageRows] = await pool.query(
        `SELECT id, message FROM private_messages
         WHERE message LIKE ? OR message LIKE ? OR message LIKE ?`,
        [`%@${options.oldUsername}%`, `%/pagina/${options.oldUsername}%`, `%%${options.oldUsername}%%`]
      );

      stats.details.privateMessages.found = (messageRows as any[]).length;

      for (const row of messageRows as any[]) {
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
              await pool.query(
                'UPDATE private_messages SET message = ? WHERE id = ?',
                [updatedContent, row.id]
              );
            }
            stats.details.privateMessages.updated++;
            stats.updatedReferences++;
          }

          stats.totalReferences++;
        } catch (error) {
          stats.errors.push({
            type: 'private_message',
            id: row.id,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
          winston.error(`Error actualizando mensaje privado ${row.id}`, { error });
        }
      }

      winston.info(`Mensajes privados procesados: ${stats.details.privateMessages.found} encontrados, ${stats.details.privateMessages.updated} actualizados`);
    } catch (error) {
      winston.error('Error procesando mensajes privados', { error });
      throw error;
    }
  }

  /**
   * Actualizar referencias en publicaciones
   */
  private async updatePublicationsReferences(
    options: ContentUpdateOptions,
    patterns: SearchPattern[],
    stats: UpdateStatistics
  ): Promise<void> {
    try {
      winston.debug('Buscando referencias en publicaciones', { oldUsername: options.oldUsername });

      // Buscar publicaciones que contengan referencias
      const [publicationRows] = await pool.query(
        `SELECT id, titulo, contenido FROM publicaciones
         WHERE titulo LIKE ? OR titulo LIKE ? OR titulo LIKE ?
            OR contenido LIKE ? OR contenido LIKE ? OR contenido LIKE ?`,
        [
          `%@${options.oldUsername}%`, `%/pagina/${options.oldUsername}%`, `%%${options.oldUsername}%%`,
          `%@${options.oldUsername}%`, `%/pagina/${options.oldUsername}%`, `%%${options.oldUsername}%%`
        ]
      );

      stats.details.publications.found = (publicationRows as any[]).length;

      for (const row of publicationRows as any[]) {
        try {
          let needsUpdate = false;
          const updates: any = {};

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

            await pool.query(
              `UPDATE publicaciones SET ${setParts}, updated_at = NOW() WHERE id = ?`,
              values
            );
          }

          if (needsUpdate) {
            stats.details.publications.updated++;
            stats.updatedReferences++;
          }

          stats.totalReferences++;
        } catch (error) {
          stats.errors.push({
            type: 'publication',
            id: row.id,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
          winston.error(`Error actualizando publicación ${row.id}`, { error });
        }
      }

      winston.info(`Publicaciones procesadas: ${stats.details.publications.found} encontradas, ${stats.details.publications.updated} actualizadas`);
    } catch (error) {
      winston.error('Error procesando publicaciones', { error });
      throw error;
    }
  }

  /**
   * Método para hacer una prueba sin actualizar (dry run)
   */
  async previewContentUpdates(options: ContentUpdateOptions): Promise<UpdateStatistics> {
    winston.info('ContentUpdateService.previewContentUpdates iniciado', {
      oldUsername: options.oldUsername,
      newUsername: options.newUsername
    });

    return await this.updateContentReferences({ ...options, dryRun: true });
  }

  /**
   * Obtener estadísticas detalladas de referencias sin actualizar
   */
  async getReferenceStatistics(oldUsername: string): Promise<{
    comments: number;
    privateMessages: number;
    publications: number;
    total: number;
  }> {
    winston.info('ContentUpdateService.getReferenceStatistics iniciado', { oldUsername });

    try {
      this.validateInput({ oldUsername, newUsername: 'temp' });

      // Contar referencias en cada tipo de contenido
      const [commentCount] = await pool.query(
        `SELECT COUNT(*) as count FROM comentarios
         WHERE comentario LIKE ? OR comentario LIKE ? OR comentario LIKE ?`,
        [`%@${oldUsername}%`, `%/pagina/${oldUsername}%`, `%%${oldUsername}%%`]
      );

      const [messageCount] = await pool.query(
        `SELECT COUNT(*) as count FROM private_messages
         WHERE message LIKE ? OR message LIKE ? OR message LIKE ?`,
        [`%@${oldUsername}%`, `%/pagina/${oldUsername}%`, `%%${oldUsername}%%`]
      );

      const [publicationCount] = await pool.query(
        `SELECT COUNT(*) as count FROM publicaciones
         WHERE titulo LIKE ? OR titulo LIKE ? OR titulo LIKE ?
            OR contenido LIKE ? OR contenido LIKE ? OR contenido LIKE ?`,
        [
          `%@${oldUsername}%`, `%/pagina/${oldUsername}%`, `%%${oldUsername}%%`,
          `%@${oldUsername}%`, `%/pagina/${oldUsername}%`, `%%${oldUsername}%%`
        ]
      );

      const result = {
        comments: (commentCount as any[])[0]?.count || 0,
        privateMessages: (messageCount as any[])[0]?.count || 0,
        publications: (publicationCount as any[])[0]?.count || 0,
        total: ((commentCount as any[])[0]?.count || 0) +
               ((messageCount as any[])[0]?.count || 0) +
               ((publicationCount as any[])[0]?.count || 0)
      };

      winston.info('ContentUpdateService.getReferenceStatistics completado', result);
      return result;

    } catch (error) {
      winston.error('Error en ContentUpdateService.getReferenceStatistics', { error });
      throw error;
    }
  }
}