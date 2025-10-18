import { QueryResult, FeedEntry, ImagenData } from '../types/interfaces';
import { pool } from "../middlewares/db";
import { IFeedRepository } from './IFeedRepository';
import logger from '../utils/logger';

export class FeedRepository implements IFeedRepository {
  /**
   * Obtiene todas las entradas del feed con paginación.
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de entradas de feed enriquecidas
   */
  async findAll(limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    try {
      const [rows]: QueryResult<FeedEntry & { username: string; display_name: string; foto_perfil: Buffer }> = await pool.query(
        `SELECT f.*, u.username, u.display_name, u.foto_perfil
          FROM feed f
          INNER JOIN users u ON f.user_id = u.id
          ORDER BY f.actualizado_en DESC, f.creado_en DESC
          LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      logger.info(`findAll ejecutado con limit ${limit} y offset ${offset}`);
      return await this.enrichFeedWithImages(rows);
    } catch (error) {
      logger.error(`Error en findAll: ${error}`);
      throw error;
    }
  }

  /**
   * Obtiene entradas del feed de un usuario con paginación.
   * @param userId ID del usuario
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de entradas de feed enriquecidas
   */
  async findByUser(userId: string, limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    try {
      const [rows]: QueryResult<FeedEntry & { username: string; display_name: string; foto_perfil: Buffer }> = await pool.query(
        `SELECT f.*, u.username, u.display_name, u.foto_perfil
          FROM feed f
          INNER JOIN users u ON f.user_id = u.id
          WHERE f.user_id = ?
          ORDER BY f.actualizado_en DESC, f.creado_en DESC
          LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      logger.info(`findByUser ejecutado para usuario ${userId}`);
      return await this.enrichFeedWithImages(rows);
    } catch (error) {
      logger.error(`Error en findByUser: ${error}`);
      throw error;
    }
  }

  /**
   * Busca una entrada de feed por su ID.
   * @param feedId ID de la entrada de feed
   * @returns Entrada de feed enriquecida o null
   */
  async findById(feedId: number): Promise<FeedEntry | null> {
    try {
      const [rows]: QueryResult<FeedEntry & { username: string; display_name: string; foto_perfil: Buffer }> = await pool.query(
        `SELECT f.*, u.username, u.display_name, u.foto_perfil
          FROM feed f
          INNER JOIN users u ON f.user_id = u.id
          WHERE f.id = ?`,
        [feedId]
      );
      logger.info(`findById ejecutado para feed ${feedId}`);
      if (rows.length === 0) return null;
      const enrichedEntries = await this.enrichFeedWithImages(rows);
      return enrichedEntries[0] ?? null;
    } catch (error) {
      logger.error(`Error en findById: ${error}`);
      throw error;
    }
  }

  /**
   * Crea una entrada de feed para un nuevo usuario.
   * @param userId ID del usuario
   * @param username Username del usuario
   * @returns ID de la nueva entrada de feed
   */
  async createForUser(userId: string, username: string): Promise<number> {
    try {
      const fotoUrl = `/api/auth/user/${userId}/foto`;
      const mensaje = `Nuevo usuario registrado: <img src='${fotoUrl}' alt='foto' style='width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;' /><a href="/pagina/${username}">${username}</a>`;
      const [result] = await pool.query(
        "INSERT INTO feed (user_id, mensaje) VALUES (?, ?)",
        [userId, mensaje]
      );
      logger.info(`createForUser ejecutado para usuario ${userId}`);
      return (result as any).insertId;
    } catch (error) {
      logger.error(`Error en createForUser: ${error}`);
      throw error;
    }
  }

  /**
   * Crea una entrada de feed para una página.
   * @param userId ID del usuario
   * @param pageId ID de la página
   * @param titulo Título
   * @param contenido Contenido
   * @returns ID de la nueva entrada de feed
   */
  async createForPage(userId: string, pageId: number, titulo: string, contenido: string): Promise<number> {
    try {
      const [result] = await pool.query(
        "INSERT INTO feed (user_id, pagina_id, titulo, contenido) VALUES (?, ?, ?, ?)",
        [userId, pageId, titulo, contenido]
      );
      logger.info(`createForPage ejecutado para página ${pageId}`);
      return (result as any).insertId;
    } catch (error) {
      logger.error(`Error en createForPage: ${error}`);
      throw error;
    }
  }

  /**
   * Actualiza una entrada de feed para una página.
   * @param pageId ID de la página
   * @param titulo Título
   * @param contenido Contenido
   */
  async updateForPage(pageId: number, titulo: string, contenido: string): Promise<void> {
    try {
      await pool.query(
        "UPDATE feed SET titulo = ?, contenido = ?, actualizado_en = NOW() WHERE pagina_id = ?",
        [titulo, contenido, pageId]
      );
      logger.info(`updateForPage ejecutado para página ${pageId}`);
    } catch (error) {
      logger.error(`Error en updateForPage: ${error}`);
      throw error;
    }
  }

  /**
   * Elimina entradas de feed por página.
   * @param pageId ID de la página
   */
  async deleteByPage(pageId: number): Promise<void> {
    try {
      await pool.query("DELETE FROM feed WHERE pagina_id = ?", [pageId]);
      logger.info(`deleteByPage ejecutado para página ${pageId}`);
    } catch (error) {
      logger.error(`Error en deleteByPage: ${error}`);
      throw error;
    }
  }

  /**
   * Elimina entradas de feed por usuario.
   * @param userId ID del usuario
   */
  async deleteByUser(userId: string): Promise<void> {
    try {
      await pool.query("DELETE FROM feed WHERE user_id = ?", [userId]);
      logger.info(`deleteByUser ejecutado para usuario ${userId}`);
    } catch (error) {
      logger.error(`Error en deleteByUser: ${error}`);
      throw error;
    }
  }

  /**
   * Busca entradas de feed por término de búsqueda.
   * @param searchTerm Término de búsqueda
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de entradas de feed enriquecidas
   */
  async search(searchTerm: string, limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows]: QueryResult<FeedEntry & { username: string; display_name: string; foto_perfil: Buffer }> = await pool.query(
        `SELECT f.*, u.username, u.display_name, u.foto_perfil
          FROM feed f
          INNER JOIN users u ON f.user_id = u.id
          INNER JOIN paginas p ON f.pagina_id = p.id
          WHERE (f.titulo LIKE ? OR f.contenido LIKE ?)
          ORDER BY f.actualizado_en DESC, f.creado_en DESC
          LIMIT ? OFFSET ?`,
        [searchPattern, searchPattern, limit, offset]
      );
      logger.info(`search ejecutado con término '${searchTerm}'`);
      return await this.enrichFeedWithImages(rows);
    } catch (error) {
      logger.error(`Error en search: ${error}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del feed (total, usuarios, últimas 24h, usuario más activo).
   * @returns Objeto con estadísticas
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalUsers: number;
    entriesLast24h: number;
    mostActiveUser: { username: string; entries: number } | null;
  }> {
    try {
      const [totalRows]: QueryResult<{ count: number }> = await pool.query(
        "SELECT COUNT(*) as count FROM feed"
      );
      const [usersRows]: QueryResult<{ count: number }> = await pool.query(
        "SELECT COUNT(DISTINCT user_id) as count FROM feed"
      );
      const [recentRows]: QueryResult<{ count: number }> = await pool.query(
        "SELECT COUNT(*) as count FROM feed WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
      );
      const [activeUserRows]: QueryResult<{ username: string; entries: number }> = await pool.query(
        `SELECT u.username, COUNT(*) as entries
         FROM feed f
         INNER JOIN users u ON f.user_id = u.id
         GROUP BY f.user_id, u.username
         ORDER BY entries DESC
         LIMIT 1`
      );
      logger.info(`getStats ejecutado`);
      return {
        totalEntries: totalRows[0]?.count ?? 0,
        totalUsers: usersRows[0]?.count ?? 0,
        entriesLast24h: recentRows[0]?.count ?? 0,
        mostActiveUser: activeUserRows.length > 0 ? (activeUserRows[0] ?? null) : null
      };
    } catch (error) {
      logger.error(`Error en getStats: ${error}`);
      throw error;
    }
  }

  /**
   * Sincroniza el feed con las páginas visibles (crea/actualiza entradas).
   * @returns Objeto con cantidad de entradas creadas y actualizadas
   */
  async syncWithPages(): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;
    try {
      const [pages] = await pool.query(
        "SELECT * FROM paginas WHERE descripcion = 'visible'"
      );
      for (const page of pages as any[]) {
        const [existing] = await pool.query(
          "SELECT id FROM feed WHERE pagina_id = ?",
          [page.id]
        );
        if ((existing as any[]).length > 0) {
          await this.updateForPage(page.id, page.titulo, page.contenido);
          updated++;
        } else {
          await this.createForPage(page.user_id, page.id, page.titulo, page.contenido);
          created++;
        }
      }
      logger.info(`syncWithPages ejecutado: ${created} creadas, ${updated} actualizadas`);
      return { created, updated };
    } catch (error) {
      logger.error(`Error en syncWithPages: ${error}`);
      throw error;
    }
  }

  /**
   * Elimina entradas de feed huérfanas (sin página asociada).
   * @returns Número de entradas eliminadas
   */
  async cleanOrphaned(): Promise<number> {
    try {
      const [result] = await pool.query(
        `DELETE f FROM feed f
          LEFT JOIN paginas p ON f.pagina_id = p.id
          WHERE p.id IS NULL`
      );
      logger.info(`cleanOrphaned ejecutado`);
      return (result as any).affectedRows;
    } catch (error) {
      logger.error(`Error en cleanOrphaned: ${error}`);
      throw error;
    }
  }

  /**
   * Actualiza enlaces antiguos en el feed.
   * @returns Número de enlaces actualizados
   */
  async updateLegacyLinks(): Promise<number> {
    try {
      const [result] = await pool.query(
        `UPDATE feed SET enlace = CONCAT('/', SUBSTRING(enlace, 9), '/pagina/1') WHERE enlace LIKE '/pagina/%'`
      );
      logger.info(`updateLegacyLinks ejecutado`);
      return (result as any).affectedRows;
    } catch (error) {
      logger.error(`Error en updateLegacyLinks: ${error}`);
      throw error;
    }
  }

  /**
   * Obtiene el feed de usuarios seguidos (por ahora retorna feed general).
   * @param userId ID del usuario
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de entradas de feed
   */
  async findFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    // Por ahora retorna feed general, en el futuro implementar follows
    logger.info(`findFollowing ejecutado para usuario ${userId}`);
    return this.findAll(limit, offset);
  }

  private async enrichFeedWithImages(feedEntries: (FeedEntry & { username: string; display_name: string; foto_perfil: Buffer })[]): Promise<FeedEntry[]> {
    const enriched: FeedEntry[] = [];

    for (const entry of feedEntries) {
      // Obtener imágenes de la página
      const [images]: QueryResult<ImagenData> = await pool.query(
        "SELECT * FROM imagenes WHERE pagina_id = ? ORDER BY creado_en DESC LIMIT 5",
        [(entry as any).pagina_id]
      );

      // Obtener el número de página
      let pageNumber = 1; // Default
      if ((entry as any).pagina_id) {
        const pageRepo = (await import('./PageRepository')).PageRepository;
        const repo = new pageRepo();
        const num = await repo.getPageNumber((entry as any).pagina_id);
        if (num) pageNumber = num;
      }

      // Limpiar enlaces del mensaje para evitar conflictos
      const cleanMensaje = (entry as any).mensaje ? (entry as any).mensaje.replace(/<a[^>]*>(.*?)<\/a>/g, '$1') : '';

      const result: any = {
        id: entry.id,
        user_id: entry.user_id,
        pagina_id: (entry as any).pagina_id,
        titulo: entry.titulo,
        contenido: entry.contenido,
        creado_en: entry.creado_en,
        actualizado_en: entry.actualizado_en,
        username: entry.display_name || entry.username,
        imagenes: images,
        pageNumber: pageNumber,
        // Convertir Buffer a base64 para el frontend
        foto_perfil_url: entry.foto_perfil ?
          `data:image/jpeg;base64,${entry.foto_perfil.toString('base64')}` :
          null
      };

      if (cleanMensaje) {
        result.mensaje = cleanMensaje;
      }

      enriched.push(result);
    }

    return enriched;
  }
}