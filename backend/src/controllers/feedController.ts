// Modelo y funciones para el feed de usuarios
// Se asume que existe una tabla 'feed' en la base de datos
import { pool } from '../middlewares/db';

export async function crearEntradaFeed(userId: string, username: string) {
  const enlace = `/pagina/${username}`;
  const mensaje = `Nuevo usuario registrado: <a href='${enlace}'>${username}</a>`;
  await pool.query(
    'INSERT INTO feed (user_id, mensaje, enlace) VALUES (?, ?, ?)',
    [userId, mensaje, enlace]
  );
}

export async function obtenerFeed() {
  const [rows]: any = await pool.query('SELECT * FROM feed ORDER BY creado_en DESC');
  return rows;
}
