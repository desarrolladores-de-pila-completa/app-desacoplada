import logger from "../utils/logger";

// Obtener página por user_id (UUID sin guiones)
export async function obtenerPaginaPorUserId(req: Request, res: Response) {
  const userId = req.params.user_id;
  try {
    const [pages]: any = await pool.query("SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY id DESC LIMIT 1", [userId]);
    if (!pages || pages.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json(pages[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener página por user_id" });
  }
}
// Obtener página por username

export async function obtenerPaginaPorUsername(req: Request, res: Response) {
  const username = req.params.username;
  try {
    const [users]: any = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (!users || users.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    const userId = users[0].id;
    const [pages]: any = await pool.query("SELECT * FROM paginas WHERE user_id = ? ORDER BY id ASC LIMIT 1", [userId]);
    if (!pages || pages.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json(pages[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener página por usuario" });
  }
}

// Obtener página por username y número de página
// Obtener lista de páginas públicas de un usuario
export async function obtenerPaginasPublicasPorUsuario(req: Request, res: Response) {
  const username = req.params.username;
  try {
    const [users]: any = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (!users || users.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    const userId = users[0].id;
    const [pages]: any = await pool.query(
      "SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.id ASC",
      [userId]
    );
    res.json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener páginas públicas del usuario" });
  }
}

export async function obtenerPaginaPorUsernameYNumero(req: Request, res: Response) {
  const { username, pageNumber } = req.params;
  if (!pageNumber) return res.status(400).json({ error: "Número de página requerido" });
  const pageNum = parseInt(pageNumber, 10);
  if (isNaN(pageNum) || pageNum < 1) return res.status(400).json({ error: "Número de página inválido" });

  try {
    const [users]: any = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (!users || users.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    const userId = users[0].id;
    const [pages]: any = await pool.query(
      "SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.id ASC LIMIT 1 OFFSET ?",
      [userId, pageNum - 1]
    );
    if (!pages || pages.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json(pages[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener página por usuario y número" });
  }
}
// Funciones eliminadas: consultarVisibilidadCampos, actualizarVisibilidadCampos (campos eliminados)
// Consultar propietario
export async function consultarPropietario(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
    const [rows]: any = await pool.query("SELECT propietario FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json({ propietario: rows[0].propietario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar propietario" });
  }
}

// Función eliminada: consultarDescripcion (campo eliminado)

// Consultar usuario
export async function consultarUsuarioPagina(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
    const [rows]: any = await pool.query("SELECT usuario FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json({ usuario: rows[0].usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar usuario de página" });
  }
}

// Función eliminada: consultarComentariosPagina (campo eliminado)
// Actualizar propietario
export async function actualizarPropietario(req: Request, res: Response) {
  const paginaId = req.params.id;
  const { propietario } = req.body;
  const userId = (req as any).userId;
  try {
    const [rows]: any = await pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    if (String(rows[0].user_id) !== String(userId)) return res.status(403).json({ error: "No autorizado" });
    await pool.query("UPDATE paginas SET propietario = ? WHERE id = ?", [propietario ? 1 : 0, paginaId]);
    res.json({ message: "Propietario actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar propietario" });
  }
}

// Función eliminada: actualizarDescripcion (campo eliminado)

// Actualizar usuario
export async function actualizarUsuarioPagina(req: RequestWithValidatedData, res: Response) {
  const paginaId = req.params.id;
  const { username } = req.validatedData as any;
  const userId = (req as any).userId;
  try {
    const [rows]: any = await pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    if (String(rows[0].user_id) !== String(userId)) return res.status(403).json({ error: "No autorizado" });
  const usuario = username.getValue();
  // Sanitizar username para la URL (sin espacios, solo guiones)
  const usernameSanitizado = usuario.replace(/\s+/g, '-');
  await pool.query("UPDATE paginas SET usuario = ? WHERE id = ?", [usernameSanitizado, paginaId]);
  await pool.query("UPDATE users SET username = ?, display_name = ? WHERE id = ?", [usernameSanitizado, usuario, rows[0].user_id]);
    // Actualizar el feed para ese usuario
    if (usuario && usuario.trim()) {
      const mensaje = `Usuario actualizado: <a href="/pagina/${usernameSanitizado}">${usuario}</a>`;
      await pool.query(
        "UPDATE feed SET mensaje = ? WHERE user_id = ?",
        [mensaje, rows[0].user_id]
      );
    }
    res.json({ message: "Usuario de página actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar usuario de página" });
  }
}

// Función eliminada: actualizarComentariosPagina (campo eliminado)
// Actualizar visibilidad y oculto de una página
import { pool } from "../middlewares/db";
import { Request, Response } from "express";

interface RequestWithValidatedData extends Request {
  validatedData?: any;
}

export async function actualizarVisibilidad(req: Request, res: Response) {
  const paginaId = req.params.id;
  const { oculto } = req.body;
  const userId = (req as any).userId;
  try {
    // Solo el propietario puede modificar
    const [rows]: any = await pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    if (String(rows[0].user_id) !== String(userId)) return res.status(403).json({ error: "No autorizado" });
    await pool.query("UPDATE paginas SET oculto = ? WHERE id = ?", [oculto ? 1 : 0, paginaId]);
    res.json({ message: "Visibilidad actualizada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar visibilidad" });
  }
}
// Consultar visibilidad y oculto de una página
export async function consultarVisibilidad(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
    const [rows]: any = await pool.query("SELECT oculto FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json({ oculto: rows[0].oculto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar visibilidad" });
  }
}
// Obtener una página por su id
export async function obtenerPagina(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
    logger.debug('Buscando página por ID', { paginaId, context: 'pagina' });
    const [rows]: any = await pool.query("SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.id = ?", [paginaId]);
    logger.debug('Resultado de consulta de página', { paginaId, found: rows && rows.length > 0, context: 'pagina' });
    if (!rows || rows.length === 0) return sendError(res, 404, "Página no encontrada");
    res.json(rows[0]);
  } catch (err) {
    logger.error('Error al obtener página', { paginaId, error: (err as Error).message, stack: (err as Error).stack, context: 'pagina' });
    sendError(res, 500, "Error al obtener página");
  }
}

import { UserService } from "../services/UserService";
import { getService } from '../utils/servicesConfig';

const userService = getService<UserService>('UserService');

// Eliminar usuario y todo su rastro (perfil, comentarios, imágenes, feed)
export async function eliminarUsuarioTotal(req: Request, res: Response) {
  const userId = req.params.id;
  if (!userId) return res.status(400).json({ error: "Falta el id de usuario" });
  const authUserId = (req as any).userId;
  // Solo el propio usuario puede borrar su cuenta
  if (String(userId) !== String(authUserId)) {
    return res.status(403).json({ error: "No autorizado" });
  }
  try {
    await userService.deleteUserCompletely(userId);
    res.json({ message: "Usuario y todos sus datos eliminados" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar usuario y sus datos" });
  }
}

function sendError(res: Response, code: number, msg: string) {
  return res.status(code).json({ error: msg });
}


export async function paginasPublicas(req: Request, res: Response) {
  try {
    const userId = req.query.user_id;
    let query = "SELECT p.id, p.user_id, u.username, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id";
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
export async function guardarComentario(req: RequestWithValidatedData, res: Response) {
  const { comentario, pageId } = req.validatedData as any;
  const userId = (req as any).user?.id;
  if (!userId) return sendError(res, 401, "Debes estar autenticado para comentar");

  try {
    const [result] = await pool.query(
      "INSERT INTO comentarios (pagina_id, user_id, comentario, creado_en) VALUES (?, ?, ?, NOW())",
      [pageId, userId, comentario.getValue()]
    );
    const commentId = (result as any).insertId;

    // Asociar imágenes subidas con el comentario
    const imageRegex = /\/api\/paginas\/comment-images\/(\d+)/g;
    let match;
    while ((match = imageRegex.exec(comentario.getValue())) !== null) {
      const imageId = match[1];
      await pool.query("UPDATE imagenes_comentarios SET comentario_id = ? WHERE id = ?", [commentId, imageId]);
    }

    res.json({ message: "Comentario guardado" });
  } catch (err) {
    console.error(err);
    sendError(res, 500, "Error al guardar comentario");
  }
}

// Eliminar comentario
export async function eliminarComentario(req: Request, res: Response) {
  const { id: pageId, commentId } = req.params;
  const userId = (req as any).user?.id;
  if (!userId) return sendError(res, 401, "Debes estar autenticado");

  try {
    // Verificar que el comentario existe y pertenece al usuario
    const [rows]: any = await pool.query(
      "SELECT user_id FROM comentarios WHERE id = ? AND pagina_id = ?",
      [commentId, pageId]
    );
    if (!rows || rows.length === 0) return sendError(res, 404, "Comentario no encontrado");
    if (String(rows[0].user_id) !== String(userId)) return sendError(res, 403, "No autorizado para eliminar este comentario");

    // Eliminar las imágenes asociadas al comentario primero
    await pool.query("DELETE FROM imagenes_comentarios WHERE comentario_id = ?", [commentId]);

    // Eliminar el comentario
    await pool.query("DELETE FROM comentarios WHERE id = ?", [commentId]);

    res.json({ message: "Comentario eliminado" });
  } catch (err) {
    console.error(err);
    sendError(res, 500, "Error al eliminar comentario");
  }
}

