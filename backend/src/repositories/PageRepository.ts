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
import logger from '../utils/logger';

export class PageRepository implements IPageRepository {
  /**
   * Crea una nueva página para el usuario especificado.
   * @param userId ID del usuario propietario
   * @param pageData Datos de la página a crear
   * @returns ID de la nueva página
   */
  async create(userId: string, pageData: CreatePaginaData): Promise<number> {
    const { usuario } = pageData;
    try {
      const [result] = await pool.query(
        "INSERT INTO paginas (user_id, propietario, usuario) VALUES (?, 1, ?)",
        [userId, usuario]
      );
      logger.info(`Página creada para usuario ${userId}`);
      return (result as any).insertId;
    } catch (error) {
      logger.error(`Error al crear página: ${error}`);
      throw error;
    }
  }

  /**
   * Busca una página por su ID.
   * @param pageId ID de la página
   * @returns Página encontrada o null
   */
  async findById(pageId: number): Promise<Pagina | null> {
    try {
      const [rows]: QueryResult<Pagina> = await pool.query(
        "SELECT * FROM paginas WHERE id = ?",
        [pageId]
      );
      logger.info(`findById ejecutado para página ${pageId}`);
      return rows.length > 0 ? (rows[0] ?? null) : null;
    } catch (error) {
      logger.error(`Error en findById: ${error}`);
      throw error;
    }
  }

  /**
   * Busca una página y sus imágenes asociadas.
   * @param pageId ID de la página
   * @returns Página con imágenes o null
   */
  async findWithImages(pageId: number): Promise<PaginaWithImages | null> {
    try {
      const [pageRows]: QueryResult<Pagina> = await pool.query(
        "SELECT * FROM paginas WHERE id = ?",
        [pageId]
      );
      if (pageRows.length === 0) return null;
      const pagina = pageRows[0];
      const [imageRows]: QueryResult<ImagenData> = await pool.query(
        "SELECT * FROM imagenes WHERE pagina_id = ? ORDER BY creado_en DESC",
        [pageId]
      );
      logger.info(`findWithImages ejecutado para página ${pageId}`);
      return {
        ...pagina,
        imagenes: imageRows
      } as PaginaWithImages;
    } catch (error) {
      logger.error(`Error en findWithImages: ${error}`);
      throw error;
    }
  }

  /**
   * Busca la última página de un usuario por su username.
   * @param username Username del usuario
   * @returns Página encontrada o null
   */
  async findByUsername(username: string): Promise<Pagina | null> {
    try {
      const [rows]: QueryResult<Pagina> = await pool.query(
        `SELECT p.* FROM paginas p
         INNER JOIN users u ON p.user_id = u.id
         WHERE u.username = ?
         ORDER BY p.id DESC LIMIT 1`,
        [username]
      );
      logger.info(`findByUsername ejecutado para usuario ${username}`);
      return rows.length > 0 ? (rows[0] ?? null) : null;
    } catch (error) {
      logger.error(`Error en findByUsername: ${error}`);
      throw error;
    }
  }

  /**
   * Busca la página número N de un usuario por su username.
   * @param username Username del usuario
   * @param pageNumber Número de página (1-based)
   * @returns Página encontrada o null
   */
  async findByUsernameAndPageNumber(username: string, pageNumber: number): Promise<Pagina | null> {
    try {
      const [userRows]: QueryResult<{ id: string }> = await pool.query(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      if (userRows.length === 0) return null;
      const userId = userRows[0]?.id;
      if (!userId) return null;
      const [rows]: QueryResult<Pagina> = await pool.query(
        `SELECT * FROM paginas
         WHERE user_id = ?
         ORDER BY id ASC
         LIMIT 1 OFFSET ?`,
        [userId, pageNumber - 1]
      );
      logger.info(`findByUsernameAndPageNumber ejecutado para usuario ${username}, página ${pageNumber}`);
      return rows.length > 0 ? (rows[0] ?? null) : null;
    } catch (error) {
      logger.error(`Error en findByUsernameAndPageNumber: ${error}`);
      throw error;
    }
  }

  /**
   * Obtiene páginas públicas (visibles) con paginación.
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de páginas públicas
   */
  async findPublic(limit: number = 20, offset: number = 0): Promise<Pagina[]> {
    try {
      const [rows]: QueryResult<Pagina> = await pool.query(
        "SELECT * FROM paginas WHERE descripcion = 'visible' ORDER BY creado_en DESC LIMIT ? OFFSET ?",
        [limit, offset]
      );
      logger.info(`findPublic ejecutado con limit ${limit} y offset ${offset}`);
      return rows;
    } catch (error) {
      logger.error(`Error en findPublic: ${error}`);
      throw error;
    }
  }

  /**
   * Actualiza una página (sin efecto, compatibilidad).
   * @param pageId ID de la página
   * @param updateData Datos a actualizar
   */
  async update(pageId: number, updateData: UpdatePaginaData): Promise<void> {
    logger.info(`update ejecutado para página ${pageId} (sin efecto)`);
    return;
  }

  /**
   * Elimina una página y sus imágenes/comentarios asociados.
   * @param pageId ID de la página
   */
  async delete(pageId: number): Promise<void> {
    try {
      await pool.query("DELETE FROM imagenes WHERE pagina_id = ?", [pageId]);
      await pool.query("DELETE FROM comentarios WHERE pagina_id = ?", [pageId]);
      await pool.query("DELETE FROM paginas WHERE id = ?", [pageId]);
      logger.info(`Página ${pageId} eliminada`);
    } catch (error) {
      logger.error(`Error al eliminar página: ${error}`);
      throw error;
    }
  }

  /**
   * Verifica si existe una página por su ID.
   * @param pageId ID de la página
   * @returns true si existe, false si no
   */
  async exists(pageId: number): Promise<boolean> {
    try {
      const [rows]: QueryResult<{ count: number }> = await pool.query(
        "SELECT COUNT(*) as count FROM paginas WHERE id = ?",
        [pageId]
      );
      logger.info(`exists ejecutado para página ${pageId}`);
      return (rows[0]?.count ?? 0) > 0;
    } catch (error) {
      logger.error(`Error en exists: ${error}`);
      throw error;
    }
  }

  /**
   * Obtiene el user_id propietario de una página.
   * @param pageId ID de la página
   * @returns user_id o null
   */
  async getOwner(pageId: number): Promise<string | null> {
    try {
      const [rows]: QueryResult<{ user_id: string }> = await pool.query(
        "SELECT user_id FROM paginas WHERE id = ?",
        [pageId]
      );
      logger.info(`getOwner ejecutado para página ${pageId}`);
      return rows.length > 0 ? (rows[0]?.user_id ?? null) : null;
    } catch (error) {
      logger.error(`Error en getOwner: ${error}`);
      throw error;
    }
  }

  /**
   * Alterna la visibilidad de una página (visible/oculta).
   * @param pageId ID de la página
   * @returns Nuevo estado de visibilidad
   */
  async toggleVisibility(pageId: number): Promise<string> {
    try {
      const [rows]: QueryResult<{ descripcion: string }> = await pool.query(
        "SELECT descripcion FROM paginas WHERE id = ?",
        [pageId]
      );
      if (rows.length === 0) {
        logger.warn(`toggleVisibility: página ${pageId} no encontrada`);
        throw new Error("Página no encontrada");
      }
      const currentVisibility = rows[0]?.descripcion ?? 'visible';
      const newVisibility = currentVisibility === 'visible' ? 'oculta' : 'visible';
      await pool.query(
        "UPDATE paginas SET descripcion = ? WHERE id = ?",
        [newVisibility, pageId]
      );
      logger.info(`toggleVisibility ejecutado para página ${pageId}: ${newVisibility}`);
      return newVisibility;
    } catch (error) {
      logger.error(`Error en toggleVisibility: ${error}`);
      throw error;
    }
  }

  /**
   * Agrega una imagen a una página.
   * @param pageId ID de la página
   * @param imageBuffer Buffer de la imagen
   * @param mimeType Tipo MIME de la imagen
   * @returns ID de la imagen agregada
   */
  async addImage(pageId: number, imageBuffer: Buffer, mimeType: string): Promise<number> {
    try {
      const [result] = await pool.query(
        "INSERT INTO imagenes (pagina_id, imagen_buffer, mime_type) VALUES (?, ?, ?)",
        [pageId, imageBuffer, mimeType]
      );
      logger.info(`Imagen agregada a página ${pageId}`);
      return (result as any).insertId;
    } catch (error) {
      logger.error(`Error en addImage: ${error}`);
      throw error;
    }
  }

  /**
   * Elimina una imagen de una página.
   * @param imageId ID de la imagen
   * @param pageId ID de la página
   */
  async removeImage(imageId: number, pageId: number): Promise<void> {
    try {
      await pool.query(
        "DELETE FROM imagenes WHERE id = ? AND pagina_id = ?",
        [imageId, pageId]
      );
      logger.info(`Imagen ${imageId} eliminada de página ${pageId}`);
    } catch (error) {
      logger.error(`Error en removeImage: ${error}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de una página (comentarios, imágenes, visitas).
   * @param pageId ID de la página
   * @returns Objeto con estadísticas
   */
  async getStats(pageId: number): Promise<{ comentarios: number; imagenes: number; visitas: number }> {
    try {
      const [comentariosRows]: QueryResult<{ count: number }> = await pool.query(
        "SELECT COUNT(*) as count FROM comentarios WHERE pagina_id = ?",
        [pageId]
      );
      const [imagenesRows]: QueryResult<{ count: number }> = await pool.query(
        "SELECT COUNT(*) as count FROM imagenes WHERE pagina_id = ?",
        [pageId]
      );
      logger.info(`getStats ejecutado para página ${pageId}`);
      return {
        comentarios: comentariosRows[0]?.count ?? 0,
        imagenes: imagenesRows[0]?.count ?? 0,
        visitas: 0 // TODO: Implementar contador de visitas
      };
    } catch (error) {
      logger.error(`Error en getStats: ${error}`);
      throw error;
    }
  }

  /**
   * Obtiene el número de página (posición) de una página para un usuario.
   * @param pageId ID de la página
   * @returns Número de página o null
   */
  async getPageNumber(pageId: number): Promise<number | null> {
    try {
      const [pageRows]: QueryResult<{ user_id: string }> = await pool.query(
        "SELECT user_id FROM paginas WHERE id = ?",
        [pageId]
      );
      if (pageRows.length === 0) return null;
      const userId = pageRows[0]?.user_id;
      if (!userId) return null;
      const [countRows]: QueryResult<{ count: number }> = await pool.query(
        `SELECT COUNT(*) as count FROM paginas
         WHERE user_id = ? AND id <= ?
         ORDER BY id ASC`,
        [userId, pageId]
      );
      logger.info(`getPageNumber ejecutado para página ${pageId}`);
      return countRows[0]?.count ?? null;
    } catch (error) {
      logger.error(`Error en getPageNumber: ${error}`);
      throw error;
    }
  }
}
