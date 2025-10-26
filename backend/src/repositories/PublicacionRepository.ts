import { QueryResult } from '../types/interfaces';
import { pool } from "../middlewares/db";
import logger from '../utils/logger';

export interface Publicacion {
  id: number;
  user_id: string;
  titulo: string;
  contenido: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePublicacionData {
  titulo: string;
  contenido: string;
}

export class PublicacionRepository {
  /**
   * Crea una nueva publicación para el usuario especificado.
   * @param userId ID del usuario
   * @param data Datos de la publicación
   * @returns ID de la nueva publicación
   */
  async create(userId: string, data: CreatePublicacionData): Promise<number> {
    try {
      const [result] = await pool.query(
        "INSERT INTO publicaciones (user_id, titulo, contenido) VALUES (?, ?, ?)",
        [userId, data.titulo, data.contenido]
      );
      logger.info(`Publicación creada para usuario ${userId}`);
      return (result as any).insertId;
    } catch (error) {
      logger.error(`Error al crear publicación: ${error}`);
      throw error;
    }
  }

  /**
   * Busca una publicación por su ID.
   * @param id ID de la publicación
   * @returns Publicación encontrada o null
   */
  async findById(id: number): Promise<Publicacion | null> {
    try {
      const [rows]: QueryResult<Publicacion> = await pool.query(
        "SELECT * FROM publicaciones WHERE id = ?",
        [id]
      );
      logger.info(`findById ejecutado para publicación ${id}`);
      return rows.length > 0 ? (rows[0] ?? null) : null;
    } catch (error) {
      logger.error(`Error en findById: ${error}`);
      throw error;
    }
  }

  /**
   * Busca publicaciones de un usuario con paginación.
   * @param userId ID del usuario
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de publicaciones
   */
  async findByUser(userId: string, limit: number = 20, offset: number = 0): Promise<Publicacion[]> {
    try {
      const [rows]: QueryResult<Publicacion> = await pool.query(
        "SELECT * FROM publicaciones WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [userId, limit, offset]
      );
      logger.info(`findByUser ejecutado para usuario ${userId}`);
      return rows;
    } catch (error) {
      logger.error(`Error en findByUser: ${error}`);
      throw error;
    }
  }

  /**
   * Busca todas las publicaciones con paginación.
   * @param limit Límite de resultados
   * @param offset Offset de paginación
   * @returns Array de publicaciones
   */
  async findAll(limit: number = 20, offset: number = 0): Promise<Publicacion[]> {
    try {
      const [rows]: QueryResult<Publicacion> = await pool.query(
        "SELECT p.*, u.username FROM publicaciones p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?",
        [limit, offset]
      );
      logger.info(`findAll ejecutado con limit ${limit} y offset ${offset}`);
      return rows;
    } catch (error) {
      logger.error(`Error en findAll: ${error}`);
      throw error;
    }
  }

  /**
   * Actualiza una publicación por su ID.
   * @param id ID de la publicación
   * @param data Datos a actualizar
   */
  async update(id: number, data: Partial<CreatePublicacionData>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.titulo !== undefined) {
      fields.push('titulo = ?');
      values.push(data.titulo);
    }
    if (data.contenido !== undefined) {
      fields.push('contenido = ?');
      values.push(data.contenido);
    }
    if (fields.length === 0) return;
    values.push(id);
    try {
      await pool.query(
        `UPDATE publicaciones SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      logger.info(`Publicación ${id} actualizada`);
    } catch (error) {
      logger.error(`Error al actualizar publicación: ${error}`);
      throw error;
    }
  }

  /**
   * Elimina una publicación por su ID.
   * @param id ID de la publicación
   */
  async delete(id: number): Promise<void> {
    try {
      await pool.query("DELETE FROM publicaciones WHERE id = ?", [id]);
      logger.info(`Publicación ${id} eliminada`);
    } catch (error) {
      logger.error(`Error al eliminar publicación: ${error}`);
      throw error;
    }
  }
}