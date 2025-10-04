// Obtener página por username

export async function obtenerPaginaPorUsername(req: Request, res: Response) {
  const username = req.params.username;
  try {
    const [users]: any = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (!users || users.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    const userId = users[0].id;
    const [pages]: any = await pool.query("SELECT * FROM paginas WHERE user_id = ? ORDER BY id DESC LIMIT 1", [userId]);
    if (!pages || pages.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json(pages[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener página por usuario" });
  }
}
// Consultar visibilidad de cada campo
export async function consultarVisibilidadCampos(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
    const [rows]: any = await pool.query(
      `SELECT visible_titulo, visible_contenido, visible_descripcion, visible_usuario, visible_comentarios FROM paginas WHERE id = ?`,
      [paginaId]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar visibilidad de campos" });
  }
}

// Actualizar visibilidad de cada campo
export async function actualizarVisibilidadCampos(req: Request, res: Response) {
  const paginaId = req.params.id;
  const userId = (req as any).userId;
  const {
    visible_titulo,
    visible_contenido,
    visible_descripcion,
    visible_usuario,
    visible_comentarios
  } = req.body;
  try {
    const [rows]: any = await pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    if (String(rows[0].user_id) !== String(userId)) return res.status(403).json({ error: "No autorizado" });
    await pool.query(
      `UPDATE paginas SET visible_titulo = ?, visible_contenido = ?, visible_descripcion = ?, visible_usuario = ?, visible_comentarios = ? WHERE id = ?`,
      [visible_titulo ? 1 : 0, visible_contenido ? 1 : 0, visible_descripcion ? 1 : 0, visible_usuario ? 1 : 0, visible_comentarios ? 1 : 0, paginaId]
    );
    res.json({ message: "Visibilidad de campos actualizada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar visibilidad de campos" });
  }
}
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

// Consultar descripcion
export async function consultarDescripcion(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
    const [rows]: any = await pool.query("SELECT descripcion FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json({ descripcion: rows[0].descripcion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar descripción" });
  }
}

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

// Consultar comentarios resumen
export async function consultarComentariosPagina(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
    const [rows]: any = await pool.query("SELECT comentarios FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json({ comentarios: rows[0].comentarios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar comentarios de página" });
  }
}
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

// Actualizar descripcion
export async function actualizarDescripcion(req: Request, res: Response) {
  const paginaId = req.params.id;
  const { descripcion } = req.body;
  const userId = (req as any).userId;
  try {
    const [rows]: any = await pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    if (String(rows[0].user_id) !== String(userId)) return res.status(403).json({ error: "No autorizado" });
    await pool.query("UPDATE paginas SET descripcion = ? WHERE id = ?", [descripcion, paginaId]);
    res.json({ message: "Descripción actualizada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar descripción" });
  }
}

// Actualizar usuario
export async function actualizarUsuarioPagina(req: Request, res: Response) {
  const paginaId = req.params.id;
  const { usuario } = req.body;
  const userId = (req as any).userId;
  try {
    const [rows]: any = await pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    if (String(rows[0].user_id) !== String(userId)) return res.status(403).json({ error: "No autorizado" });
    await pool.query("UPDATE paginas SET usuario = ? WHERE id = ?", [usuario, paginaId]);
    // Actualizar el feed para ese usuario
    if (usuario && usuario.trim()) {
      // Sanitizar para el enlace (reemplazar espacios por guiones)
      const enlaceUsuario = usuario.replace(/\s+/g, '-');
      const mensaje = `Nuevo usuario registrado: <a href='/pagina/${enlaceUsuario}'>${usuario}</a>`;
      const enlace = `/pagina/${enlaceUsuario}`;
      await pool.query(
        "UPDATE feed SET mensaje = ?, enlace = ? WHERE user_id = ?",
        [mensaje, enlace, rows[0].user_id]
      );
    }
    res.json({ message: "Usuario de página actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar usuario de página" });
  }
}

// Actualizar comentarios resumen
export async function actualizarComentariosPagina(req: Request, res: Response) {
  const paginaId = req.params.id;
  let { comentarios } = req.body;
  const userId = (req as any).userId;
  // Validar que comentarios no sea undefined, null ni tipo incorrecto
  if (typeof comentarios !== "string") {
    comentarios = '';
  }
  try {
    const [rows]: any = await pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    if (String(rows[0].user_id) !== String(userId)) return res.status(403).json({ error: "No autorizado" });
    await pool.query("UPDATE paginas SET comentarios = ? WHERE id = ?", [comentarios, paginaId]);
    res.json({ message: "Comentarios de página actualizados" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar comentarios de página" });
  }
}
// Actualizar visibilidad y oculto de una página
import { pool } from "../middlewares/db";
import { Request, Response } from "express";

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

// ...existing code...

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
  const userId = (req as any).user?.id;
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
