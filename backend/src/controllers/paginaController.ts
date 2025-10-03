// Obtener una página por su id
export async function obtenerPagina(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
    console.log("Buscando página con id:", paginaId);
    const [rows]: any = await pool.query("SELECT * FROM paginas WHERE id = ?", [paginaId]);
    console.log("Resultado de la consulta:", rows);
    if (!rows || rows.length === 0) return sendError(res, 404, "Página no encontrada");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    sendError(res, 500, "Error al obtener página");
  }
}

import { Request, Response } from "express";
import { pool } from "../middlewares/db";

function sendError(res: Response, code: number, msg: string) {
  return res.status(code).json({ error: msg });
}


export async function paginasPublicas(req: Request, res: Response) {
  try {
    const userId = req.query.user_id;
    let query = "SELECT p.id, p.titulo, p.contenido, p.user_id, u.username FROM paginas p JOIN users u ON p.user_id = u.id";
    let params: any[] = [];
    if (userId) {
      query += " WHERE p.user_id = ? ORDER BY p.id DESC LIMIT 1";
      params = [userId];
    } else {
      query += " ORDER BY p.id DESC";
    }
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    sendError(res, 500, "Error al obtener páginas");
  }
}


// Eliminado: función de edición de página

// Guardar comentario en la base de datos
export async function guardarComentario(req: Request, res: Response) {
  const paginaId = req.params.id;
  const { comentario } = req.body;
  const userId = (req as any).userId;
  if (!userId) return sendError(res, 401, "Debes estar autenticado para comentar");
  if (!comentario || typeof comentario !== "string" || comentario.trim().length === 0) {
    return sendError(res, 400, "Comentario vacío o inválido");
  }
  try {
    await pool.query(
      "INSERT INTO comentarios (pagina_id, user_id, comentario, creado_en) VALUES (?, ?, ?, NOW())",
      [paginaId, userId, comentario.trim()]
    );
    res.json({ message: "Comentario guardado" });
  } catch (err) {
    console.error(err);
    sendError(res, 500, "Error al guardar comentario");
  }
}
