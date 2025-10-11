// Modelo y funciones para el feed de usuarios
// Se asume que existe una tabla 'feed' en la base de datos
import { pool } from '../middlewares/db';

export async function crearEntradaFeed(userId: string, username: string) {
  // Vista previa de la foto de perfil (usar endpoint por id)
  const fotoUrl = `/api/auth/user/${userId}/foto`;
  const mensaje = `Nuevo usuario registrado: <img src='${fotoUrl}' alt='foto' style='width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;' /><a href='/pagina/${username}'>${username}</a>`;
  await pool.query(
    'INSERT INTO feed (user_id, mensaje) VALUES (?, ?)',
    [userId, mensaje]
  );
}

export async function obtenerFeed() {
  const [rows]: any = await pool.query('SELECT * FROM feed ORDER BY creado_en DESC');
  return rows;
}
