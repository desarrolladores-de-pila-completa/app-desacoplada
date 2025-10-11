import { QueryResult } from '../types/interfaces';
import { pool } from "../middlewares/db";

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
  async create(userId: string, data: CreatePublicacionData): Promise<number> {
    const [result] = await pool.query(
      "INSERT INTO publicaciones (user_id, titulo, contenido) VALUES (?, ?, ?)",
      [userId, data.titulo, data.contenido]
    );
    return (result as any).insertId;
  }

  async findById(id: number): Promise<Publicacion | null> {
    const [rows]: QueryResult<Publicacion> = await pool.query(
      "SELECT * FROM publicaciones WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  async findByUser(userId: string, limit: number = 20, offset: number = 0): Promise<Publicacion[]> {
    const [rows]: QueryResult<Publicacion> = await pool.query(
      "SELECT * FROM publicaciones WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [userId, limit, offset]
    );
    return rows;
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<Publicacion[]> {
    const [rows]: QueryResult<Publicacion> = await pool.query(
      "SELECT p.*, u.username FROM publicaciones p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    return rows;
  }

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
    await pool.query(
      `UPDATE publicaciones SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async delete(id: number): Promise<void> {
    await pool.query("DELETE FROM publicaciones WHERE id = ?", [id]);
  }
}