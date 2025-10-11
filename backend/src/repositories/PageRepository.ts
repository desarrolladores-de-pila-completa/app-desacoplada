import {
  QueryResult,
  Pagina,
  CreatePaginaData,
  UpdatePaginaData,
  PaginaWithImages,
  ImagenData
} from '../types/interfaces';
import { pool } from "../middlewares/db";
import { IPageRepository } from './IPageRepository';

export class PageRepository implements IPageRepository {
  async create(userId: string, pageData: CreatePaginaData): Promise<number> {
    const { usuario } = pageData;

    const [result] = await pool.query(
      "INSERT INTO paginas (user_id, propietario, usuario) VALUES (?, 1, ?)",
      [userId, usuario]
    );

    return (result as any).insertId;
  }

  async findById(pageId: number): Promise<Pagina | null> {
    const [rows]: QueryResult<Pagina> = await pool.query(
      "SELECT * FROM paginas WHERE id = ?",
      [pageId]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  async findWithImages(pageId: number): Promise<PaginaWithImages | null> {
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

  async findByUsername(username: string): Promise<Pagina | null> {
    const [rows]: QueryResult<Pagina> = await pool.query(
      `SELECT p.* FROM paginas p
       INNER JOIN users u ON p.user_id = u.id
       WHERE u.username = ?
       ORDER BY p.id DESC LIMIT 1`,
      [username]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  async findByUsernameAndPageNumber(username: string, pageNumber: number): Promise<Pagina | null> {
    // Obtener el user_id del username
    const [userRows]: QueryResult<{ id: string }> = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (userRows.length === 0) return null;
    const userId = userRows[0]?.id;
    if (!userId) return null;

    // Obtener la página número pageNumber del usuario, ordenada por id ASC
    const [rows]: QueryResult<Pagina> = await pool.query(
      `SELECT * FROM paginas
       WHERE user_id = ?
       ORDER BY id ASC
       LIMIT 1 OFFSET ?`,
      [userId, pageNumber - 1] // OFFSET 0 para página 1, 1 para página 2, etc.
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  async findPublic(limit: number = 20, offset: number = 0): Promise<Pagina[]> {
    const [rows]: QueryResult<Pagina> = await pool.query(
      "SELECT * FROM paginas WHERE descripcion = 'visible' ORDER BY creado_en DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    return rows;
  }

  async update(pageId: number, updateData: UpdatePaginaData): Promise<void> {
    // En la nueva estructura simplificada, no hay campos para actualizar
    // Esta función se mantiene por compatibilidad pero no hace nada
    return;
  }

  async delete(pageId: number): Promise<void> {
    // Eliminar imágenes primero (foreign key)
    await pool.query("DELETE FROM imagenes WHERE pagina_id = ?", [pageId]);

    // Eliminar comentarios de la página
    await pool.query(
      "DELETE FROM comentarios WHERE pagina_id = ?",
      [pageId]
    );

    // Eliminar página
    await pool.query("DELETE FROM paginas WHERE id = ?", [pageId]);
  }

  async exists(pageId: number): Promise<boolean> {
    const [rows]: QueryResult<{ count: number }> = await pool.query(
      "SELECT COUNT(*) as count FROM paginas WHERE id = ?",
      [pageId]
    );
    return (rows[0]?.count ?? 0) > 0;
  }

  async getOwner(pageId: number): Promise<string | null> {
    const [rows]: QueryResult<{ user_id: string }> = await pool.query(
      "SELECT user_id FROM paginas WHERE id = ?",
      [pageId]
    );
    return rows.length > 0 ? (rows[0]?.user_id ?? null) : null;
  }

  async toggleVisibility(pageId: number): Promise<string> {
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

  async addImage(pageId: number, imageBuffer: Buffer, mimeType: string): Promise<number> {
    const [result] = await pool.query(
      "INSERT INTO imagenes (pagina_id, imagen_buffer, mime_type) VALUES (?, ?, ?)",
      [pageId, imageBuffer, mimeType]
    );

    return (result as any).insertId;
  }

  async removeImage(imageId: number, pageId: number): Promise<void> {
    await pool.query(
      "DELETE FROM imagenes WHERE id = ? AND pagina_id = ?",
      [imageId, pageId]
    );
  }

  async getStats(pageId: number): Promise<{ comentarios: number; imagenes: number; visitas: number }> {
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

  async getPageNumber(pageId: number): Promise<number | null> {
    // Obtener el user_id de la página
    const [pageRows]: QueryResult<{ user_id: string }> = await pool.query(
      "SELECT user_id FROM paginas WHERE id = ?",
      [pageId]
    );
    if (pageRows.length === 0) return null;
    const userId = pageRows[0]?.user_id;
    if (!userId) return null;

    // Contar cuántas páginas tiene el usuario con id <= pageId, ordenadas por id ASC
    const [countRows]: QueryResult<{ count: number }> = await pool.query(
      `SELECT COUNT(*) as count FROM paginas
       WHERE user_id = ? AND id <= ?
       ORDER BY id ASC`,
      [userId, pageId]
    );
    return countRows[0]?.count ?? null;
  }
}
