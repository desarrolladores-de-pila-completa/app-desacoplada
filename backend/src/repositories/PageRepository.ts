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
    const { titulo, contenido, descripcion, usuario, comentarios } = pageData;

    const [result] = await pool.query(
      "INSERT INTO paginas (user_id, propietario, titulo, contenido, descripcion, usuario, comentarios) VALUES (?, 1, ?, ?, ?, ?, ?)",
      [userId, titulo, contenido, descripcion || 'visible', usuario, comentarios || '']
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
       WHERE u.username = ?`,
      [username]
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
}
