import { 
  QueryResult, 
  Pagina, 
  CreatePaginaData, 
  UpdatePaginaData, 
  PaginaWithImages,
  ImagenData,
  FeedEntry 
} from '../types/interfaces';
import { pool } from "../middlewares/db";

export class PageService {
  /**
   * Obtener página por ID con imágenes
   */
  async getPageWithImages(pageId: number): Promise<PaginaWithImages | null> {
    // Obtener datos de la página
    const [pageRows]: QueryResult<Pagina> = await pool.query(
      "SELECT * FROM paginas WHERE id = ?",
      [pageId]
    );

    if (pageRows.length === 0) return null;
    const pagina = pageRows[0];

    // Obtener imágenes de la página
    const [imageRows]: QueryResult<ImagenData> = await pool.query(
      "SELECT * FROM imagenes WHERE pagina_id = ? ORDER BY creado_en DESC",
      [pageId]
    );

    return {
      ...pagina,
      imagenes: imageRows
    } as PaginaWithImages;
  }

  /**
   * Obtener página por usuario (username)
   */
  async getPageByUsername(username: string): Promise<Pagina | null> {
    const [rows]: QueryResult<Pagina> = await pool.query(
      `SELECT p.* FROM paginas p 
       INNER JOIN users u ON p.user_id = u.id 
       WHERE u.username = ?`,
      [username]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  /**
   * Obtener todas las páginas públicas con paginación
   */
  async getPublicPages(limit: number = 20, offset: number = 0): Promise<Pagina[]> {
    const [rows]: QueryResult<Pagina> = await pool.query(
      "SELECT * FROM paginas WHERE descripcion = 'visible' ORDER BY creado_en DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    return rows;
  }

  /**
   * Crear nueva página
   */
  async createPage(userId: string, pageData: CreatePaginaData): Promise<number> {
    const { titulo, contenido, descripcion, usuario, comentarios } = pageData;

    const [result] = await pool.query(
      "INSERT INTO paginas (user_id, propietario, titulo, contenido, descripcion, usuario, comentarios) VALUES (?, 1, ?, ?, ?, ?, ?)",
      [userId, titulo, contenido, descripcion || 'visible', usuario, comentarios || '']
    );

    return (result as any).insertId;
  }

  /**
   * Actualizar página existente
   */
  async updatePage(pageId: number, updateData: UpdatePaginaData): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    // Construir query dinámicamente
    if (updateData.titulo !== undefined) {
      fields.push('titulo = ?');
      values.push(updateData.titulo);
    }
    if (updateData.contenido !== undefined) {
      fields.push('contenido = ?');
      values.push(updateData.contenido);
    }
    if (updateData.descripcion !== undefined) {
      fields.push('descripcion = ?');
      values.push(updateData.descripcion);
    }
    if (updateData.comentarios !== undefined) {
      fields.push('comentarios = ?');
      values.push(updateData.comentarios);
    }

    if (fields.length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    values.push(pageId);
    
    await pool.query(
      `UPDATE paginas SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * Eliminar página y todas sus imágenes
   */
  async deletePage(pageId: number): Promise<void> {
    // Eliminar imágenes primero (foreign key)
    await pool.query("DELETE FROM imagenes WHERE pagina_id = ?", [pageId]);
    
    // Eliminar comentarios de la página
    await pool.query(
      "DELETE FROM comentarios WHERE pagina_id = ?", 
      [pageId]
    );
    
    // Eliminar entrada del feed
    await pool.query("DELETE FROM feed WHERE pagina_id = ?", [pageId]);
    
    // Eliminar página
    await pool.query("DELETE FROM paginas WHERE id = ?", [pageId]);
  }

  /**
   * Agregar imagen a una página
   */
  async addImageToPage(pageId: number, imageBuffer: Buffer, mimeType: string): Promise<number> {
    const [result] = await pool.query(
      "INSERT INTO imagenes (pagina_id, imagen_buffer, mime_type) VALUES (?, ?, ?)",
      [pageId, imageBuffer, mimeType]
    );

    const imageId = (result as any).insertId;

    // Actualizar el feed si es necesario
    await this.updatePageInFeed(pageId);

    return imageId;
  }

  /**
   * Eliminar imagen específica
   */
  async removeImage(imageId: number, pageId: number): Promise<void> {
    await pool.query(
      "DELETE FROM imagenes WHERE id = ? AND pagina_id = ?",
      [imageId, pageId]
    );

    // Actualizar el feed
    await this.updatePageInFeed(pageId);
  }

  /**
   * Verificar si una página existe
   */
  async pageExists(pageId: number): Promise<boolean> {
    const [rows]: QueryResult<{ count: number }> = await pool.query(
      "SELECT COUNT(*) as count FROM paginas WHERE id = ?",
      [pageId]
    );
    return (rows[0]?.count ?? 0) > 0;
  }

  /**
   * Obtener el propietario de una página
   */
  async getPageOwner(pageId: number): Promise<string | null> {
    const [rows]: QueryResult<{ user_id: string }> = await pool.query(
      "SELECT user_id FROM paginas WHERE id = ?",
      [pageId]
    );
    return rows.length > 0 ? (rows[0]?.user_id ?? null) : null;
  }

  /**
   * Actualizar página en el feed (privado)
   */
  private async updatePageInFeed(pageId: number): Promise<void> {
    // Obtener datos de la página
    const [pageRows]: QueryResult<Pagina> = await pool.query(
      "SELECT * FROM paginas WHERE id = ?",
      [pageId]
    );

    if (pageRows.length === 0) return;
    const pagina = pageRows[0];

    // Verificar si ya existe en el feed
    const [feedRows]: QueryResult<FeedEntry> = await pool.query(
      "SELECT id FROM feed WHERE pagina_id = ?",
      [pageId]
    );

    if (feedRows.length > 0) {
      // Actualizar entrada existente
      await pool.query(
        "UPDATE feed SET titulo = ?, contenido = ?, actualizado_en = NOW() WHERE pagina_id = ?",
        [pagina?.titulo, pagina?.contenido, pageId]
      );
    } else {
      // Crear nueva entrada en el feed
      await pool.query(
        "INSERT INTO feed (user_id, pagina_id, titulo, contenido) VALUES (?, ?, ?, ?)",
        [pagina?.user_id, pageId, pagina?.titulo, pagina?.contenido]
      );
    }
  }

  /**
   * Cambiar visibilidad de página
   */
  async togglePageVisibility(pageId: number): Promise<string> {
    const [rows]: QueryResult<{ descripcion: string }> = await pool.query(
      "SELECT descripcion FROM paginas WHERE id = ?",
      [pageId]
    );

    if (rows.length === 0) {
      throw new Error("Página no encontrada");
    }

    const currentVisibility = rows[0]?.descripcion ?? 'visible';
    const newVisibility = currentVisibility === 'visible' ? 'oculta' : 'visible';

    await pool.query(
      "UPDATE paginas SET descripcion = ? WHERE id = ?",
      [newVisibility, pageId]
    );

    return newVisibility;
  }

  /**
   * Obtener estadísticas de página
   */
  async getPageStats(pageId: number): Promise<{ comentarios: number; imagenes: number; visitas: number }> {
    const [comentariosRows]: QueryResult<{ count: number }> = await pool.query(
      "SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?",
      [pageId]
    );

    const [imagenesRows]: QueryResult<{ count: number }> = await pool.query(
      "SELECT COUNT(*) as count FROM imagenes WHERE pagina_id = ?",
      [pageId]
    );

    return {
      comentarios: comentariosRows[0]?.count ?? 0,
      imagenes: imagenesRows[0]?.count ?? 0,
      visitas: 0 // TODO: Implementar contador de visitas
    };
  }
}