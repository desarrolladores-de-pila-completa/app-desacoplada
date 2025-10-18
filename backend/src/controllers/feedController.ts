// Modelo y funciones para el feed de usuarios
// Se asume que existe una tabla 'feed' en la base de datos
import { pool } from '../middlewares/db';
import winston from '../utils/logger';
import { z } from 'zod';

/**
 * @swagger
 * /api/feed/crear:
 *   post:
 *     summary: Crear entrada en el feed
 *     tags: [Feed]
 */
export async function crearEntradaFeed(userId: string, username: string): Promise<void> {
  try {
    // Validación básica de parámetros
    if (!userId || !username) {
      winston.warn('Datos inválidos en crearEntradaFeed', { userId, username });
      throw new Error('Datos inválidos');
    }
    const fotoUrl = `/api/auth/user/${userId}/foto`;
    const mensaje = `Nuevo usuario registrado: <img src='${fotoUrl}' alt='foto' style='width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;' /><a href='/pagina/${username}'>${username}</a>`;
    await pool.query(
      'INSERT INTO feed (user_id, mensaje) VALUES (?, ?)',
      [userId, mensaje]
    );
  } catch (error) {
    winston.error('Error en crearEntradaFeed', { error });
    throw error;
  }
}

/**
 * @swagger
 * /api/feed:
 *   get:
 *     summary: Obtener feed completo
 *     tags: [Feed]
 */
export async function obtenerFeed(): Promise<any[]> {
  try {
    const [rows]: any = await pool.query('SELECT * FROM feed ORDER BY creado_en DESC');
    return rows;
  } catch (error) {
    winston.error('Error en obtenerFeed', { error });
    throw error;
  }
}
