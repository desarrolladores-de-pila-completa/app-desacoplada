import { QueryResult, FeedEntry, ImagenData } from '../types/interfaces';
import { pool } from "../middlewares/db";
import { IFeedRepository } from './IFeedRepository';

export class FeedRepository implements IFeedRepository {
  async findAll(limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    const [rows]: QueryResult<FeedEntry & { username: string; display_name: string; foto_perfil: Buffer }> = await pool.query(
      `SELECT f.*, u.username, u.display_name, u.foto_perfil
        FROM feed f
        INNER JOIN users u ON f.user_id = u.id
        ORDER BY f.actualizado_en DESC, f.creado_en DESC
        LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return await this.enrichFeedWithImages(rows);
  }

  async findByUser(userId: string, limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    const [rows]: QueryResult<FeedEntry & { username: string; display_name: string; foto_perfil: Buffer }> = await pool.query(
      `SELECT f.*, u.username, u.display_name, u.foto_perfil
        FROM feed f
        INNER JOIN users u ON f.user_id = u.id
        WHERE f.user_id = ?
        ORDER BY f.actualizado_en DESC, f.creado_en DESC
        LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return await this.enrichFeedWithImages(rows);
  }

  async findById(feedId: number): Promise<FeedEntry | null> {
    const [rows]: QueryResult<FeedEntry & { username: string; display_name: string; foto_perfil: Buffer }> = await pool.query(
      `SELECT f.*, u.username, u.display_name, u.foto_perfil
        FROM feed f
        INNER JOIN users u ON f.user_id = u.id
        WHERE f.id = ?`,
      [feedId]
    );

    if (rows.length === 0) return null;

    const enrichedEntries = await this.enrichFeedWithImages(rows);
    return enrichedEntries[0] ?? null;
  }

  async createForUser(userId: string, username: string): Promise<number> {
    const fotoUrl = `/api/auth/user/${userId}/foto`;
    const mensaje = `Nuevo usuario registrado: <img src='${fotoUrl}' alt='foto' style='width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;' /><a href="/pagina/${username}">${username}</a>`;

    const [result] = await pool.query(
      "INSERT INTO feed (user_id, mensaje) VALUES (?, ?)",
      [userId, mensaje]
    );

    return (result as any).insertId;
  }

  async createForPage(userId: string, pageId: number, titulo: string, contenido: string): Promise<number> {
    const [result] = await pool.query(
      "INSERT INTO feed (user_id, pagina_id, titulo, contenido) VALUES (?, ?, ?, ?)",
      [userId, pageId, titulo, contenido]
    );

    return (result as any).insertId;
  }

  async updateForPage(pageId: number, titulo: string, contenido: string): Promise<void> {
    await pool.query(
      "UPDATE feed SET titulo = ?, contenido = ?, actualizado_en = NOW() WHERE pagina_id = ?",
      [titulo, contenido, pageId]
    );
  }

  async deleteByPage(pageId: number): Promise<void> {
    await pool.query("DELETE FROM feed WHERE pagina_id = ?", [pageId]);
  }

  async deleteByUser(userId: string): Promise<void> {
    await pool.query("DELETE FROM feed WHERE user_id = ?", [userId]);
  }

  async search(searchTerm: string, limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
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

    return await this.enrichFeedWithImages(rows);
  }

  async getStats(): Promise<{
    totalEntries: number;
    totalUsers: number;
    entriesLast24h: number;
    mostActiveUser: { username: string; entries: number } | null;
  }> {
    // Total de entradas
    const [totalRows]: QueryResult<{ count: number }> = await pool.query(
      "SELECT COUNT(*) as count FROM feed"
    );

    // Total de usuarios únicos
    const [usersRows]: QueryResult<{ count: number }> = await pool.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM feed"
    );

    // Entradas últimas 24 horas
    const [recentRows]: QueryResult<{ count: number }> = await pool.query(
      "SELECT COUNT(*) as count FROM feed WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );

    // Usuario más activo
    const [activeUserRows]: QueryResult<{ username: string; entries: number }> = await pool.query(
      `SELECT u.username, COUNT(*) as entries
       FROM feed f
       INNER JOIN users u ON f.user_id = u.id
       GROUP BY f.user_id, u.username
       ORDER BY entries DESC
       LIMIT 1`
    );

    return {
      totalEntries: totalRows[0]?.count ?? 0,
      totalUsers: usersRows[0]?.count ?? 0,
      entriesLast24h: recentRows[0]?.count ?? 0,
      mostActiveUser: activeUserRows.length > 0 ? (activeUserRows[0] ?? null) : null
    };
  }

  async syncWithPages(): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    // Obtener todas las páginas visibles
    const [pages] = await pool.query(
      "SELECT * FROM paginas WHERE descripcion = 'visible'"
    );

    for (const page of pages as any[]) {
      // Verificar si ya existe en el feed
      const [existing] = await pool.query(
        "SELECT id FROM feed WHERE pagina_id = ?",
        [page.id]
      );

      if ((existing as any[]).length > 0) {
        // Actualizar entrada existente
        await this.updateForPage(page.id, page.titulo, page.contenido);
        updated++;
      } else {
        // Crear nueva entrada
        await this.createForPage(page.user_id, page.id, page.titulo, page.contenido);
        created++;
      }
    }

    return { created, updated };
  }

  async cleanOrphaned(): Promise<number> {
    const [result] = await pool.query(
      `DELETE f FROM feed f
        LEFT JOIN paginas p ON f.pagina_id = p.id
        WHERE p.id IS NULL`
    );

    return (result as any).affectedRows;
  }

  async updateLegacyLinks(): Promise<number> {
    // Actualizar enlaces antiguos que apuntan a /pagina/username a /username/pagina/1
    const [result] = await pool.query(
      `UPDATE feed SET enlace = CONCAT('/', SUBSTRING(enlace, 9), '/pagina/1') WHERE enlace LIKE '/pagina/%'`
    );

    return (result as any).affectedRows;
  }

  async findFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    // Por ahora retorna feed general, en el futuro implementar follows
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