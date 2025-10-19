import winston from "../utils/logger";
import { pool } from "../middlewares/db";
import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { getService } from '../utils/servicesConfig';

// Obtener página por user_id (UUID sin guiones)
/**
 * @swagger
 * /api/pagina/user/{user_id}:
 *   get:
 *     summary: Obtener página por user_id
 *     tags: [Pagina]
 */
// Obtener página por user_id (UUID sin guiones)
/**
 * @swagger
 * /api/pagina/user/{user_id}:
 *   get:
 *     summary: Obtener página por user_id
 *     tags: [Pagina]
 */
export async function obtenerPaginaPorUserId(req: Request, res: Response) {
  const userId = req.params.user_id;
  try {
    const [pages]: any = await pool.query("SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY id DESC LIMIT 1", [userId]);
    if (!pages || pages.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json(pages[0]);
  } catch (err) {
    winston.error('Error al obtener página por user_id', { error: err });
    res.status(500).json({ error: "Error al obtener página por user_id" });
  }
}

// Función unificada para manejar todas las operaciones de páginas por username
/**
 * @swagger
 * /api/pagina/{username}:
 *   get:
 *     summary: Obtener información de página por username con soporte para diferentes acciones
 *     tags: [Pagina]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [info, publicaciones, galeria, comentarios, lista]
 *         description: Tipo de acción a realizar
 *       - in: query
 *         name: publicacionId
 *         schema:
 *           type: integer
 *         description: ID específico de publicación (para action=publicacion)
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *         description: Número de página específico (para action=lista)
 */
// Función unificada para manejar todas las operaciones de páginas por username
export async function paginaUnificadaPorUsername(req: Request, res: Response) {
  const username = req.params.username;
  const { action = 'info', publicacionId, pageNumber } = req.query;

  console.log('=== UNIFIED PAGE REQUEST DEBUG ===', {
    username,
    action,
    publicacionId,
    pageNumber,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    context: 'unified-page-debug'
  });

  try {
    // Obtener información del usuario primero
    const [users]: any = await pool.query(
      "SELECT id, username, display_name, foto_perfil FROM users WHERE username = ?",
      [username]
    );

    console.log('=== UNIFIED PAGE DB USER LOOKUP ===', {
      username,
      usersFound: users.length,
      context: 'unified-page-debug'
    });

    if (!users || users.length === 0) {
      console.log('=== UNIFIED PAGE USER NOT FOUND ===', {
        username,
        statusCode: 404,
        context: 'unified-page-debug'
      });
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = users[0];
    const userId = user.id;

    switch (action) {
      case 'info':
        // Información completa del usuario y página principal
        return await obtenerInformacionCompletaUsuario(user, res);

      case 'publicaciones':
        // Lista de publicaciones del usuario
        return await obtenerPublicacionesUsuario(userId, res);

      case 'publicacion':
        // Publicación específica
        if (!publicacionId) {
          return res.status(400).json({ error: "Se requiere publicacionId para obtener publicación específica" });
        }
        return await obtenerPublicacionEspecifica(userId, publicacionId as string, res);

      case 'galeria':
        // Galería de imágenes del usuario
        return await obtenerGaleriaUsuario(userId, res);

      case 'comentarios':
        // Comentarios de la página principal del usuario
        return await obtenerComentariosUsuario(userId, res);

      case 'lista':
        // Lista de páginas públicas del usuario (compatible con estructura antigua)
        if (pageNumber) {
          return await obtenerPaginaPorNumero(userId, parseInt(pageNumber as string), res);
        }
        return await obtenerListaPaginasUsuario(userId, res);

      default:
        return res.status(400).json({ error: `Acción no válida: ${action}` });
    }
  } catch (err) {
    winston.error('Error en operación unificada de página', { error: err, username, action });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// Función auxiliar para obtener información completa del usuario
async function obtenerInformacionCompletaUsuario(user: any, res: Response) {
  // Obtener la primera página del usuario (página principal)
  const [pages]: any = await pool.query(
    "SELECT * FROM paginas WHERE user_id = ? ORDER BY id ASC LIMIT 1",
    [user.id]
  );

  let pagina = null;
  if (pages && pages.length > 0) {
    pagina = pages[0];
  }

  // Obtener imágenes de la galería si existe la página
  let imagenes = [];
  if (pagina) {
    const [imagenesRows]: any = await pool.query(
      "SELECT idx, imagen FROM imagenes WHERE pagina_id = ? ORDER BY idx ASC",
      [pagina.id]
    );
    imagenes = imagenesRows.map((row: any) => ({
      idx: row.idx,
      src: `data:image/jpeg;base64,${Buffer.from(row.imagen).toString('base64')}`
    }));
  }

  // Obtener comentarios de la página si existe
  let comentarios = [];
  if (pagina) {
    const [comentariosRows]: any = await pool.query(
      `SELECT c.*, u.username FROM comentarios c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.pagina_id = ? ORDER BY c.creado_en DESC`,
      [pagina.id]
    );
    comentarios = comentariosRows;
  }

  // Construir respuesta completa
  const respuesta = {
    usuario: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      foto_perfil: user.foto_perfil ? `data:image/jpeg;base64,${Buffer.from(user.foto_perfil).toString('base64')}` : null
    },
    pagina: pagina,
    galeria: imagenes,
    comentarios: comentarios
  };

  res.json(respuesta);
}

// Función auxiliar para obtener publicaciones del usuario
async function obtenerPublicacionesUsuario(userId: string, res: Response) {
  const [rows]: any = await pool.query(
    "SELECT id, titulo, contenido, created_at FROM publicaciones WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  res.json({ publicaciones: rows });
}

// Función auxiliar para obtener publicación específica
async function obtenerPublicacionEspecifica(userId: string, publicacionId: string, res: Response) {
  const [rows]: any = await pool.query(
    "SELECT id, titulo, contenido, created_at FROM publicaciones WHERE id = ? AND user_id = ?",
    [publicacionId, userId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }

  res.json({ publicacion: rows[0] });
}

// Función auxiliar para obtener galería del usuario
async function obtenerGaleriaUsuario(userId: string, res: Response) {
  // Obtener primera página para obtener galería
  const [pages]: any = await pool.query(
    "SELECT id FROM paginas WHERE user_id = ? ORDER BY id ASC LIMIT 1",
    [userId]
  );

  if (!pages || pages.length === 0) {
    return res.json({ galeria: [] });
  }

  const [imagenesRows]: any = await pool.query(
    "SELECT idx, imagen FROM imagenes WHERE pagina_id = ? ORDER BY idx ASC",
    [pages[0].id]
  );

  const imagenes = imagenesRows.map((row: any) => ({
    idx: row.idx,
    src: `data:image/jpeg;base64,${Buffer.from(row.imagen).toString('base64')}`
  }));

  res.json({ galeria: imagenes });
}

// Función auxiliar para obtener comentarios del usuario
async function obtenerComentariosUsuario(userId: string, res: Response) {
  // Obtener primera página para obtener comentarios
  const [pages]: any = await pool.query(
    "SELECT id FROM paginas WHERE user_id = ? ORDER BY id ASC LIMIT 1",
    [userId]
  );

  if (!pages || pages.length === 0) {
    return res.json({ comentarios: [] });
  }

  const [comentariosRows]: any = await pool.query(
    `SELECT c.*, u.username FROM comentarios c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.pagina_id = ? ORDER BY c.creado_en DESC`,
    [pages[0].id]
  );

  res.json({ comentarios: comentariosRows });
}

// Función auxiliar para obtener página por número
async function obtenerPaginaPorNumero(userId: string, pageNumber: number, res: Response) {
  const [pages]: any = await pool.query(
    "SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.id ASC LIMIT 1 OFFSET ?",
    [userId, pageNumber - 1]
  );

  if (!pages || pages.length === 0) {
    return res.status(404).json({ error: "Página no encontrada" });
  }

  res.json(pages[0]);
}

// Función auxiliar para obtener lista de páginas del usuario
async function obtenerListaPaginasUsuario(userId: string, res: Response) {
  const [pages]: any = await pool.query(
    "SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.id ASC",
    [userId]
  );
  res.json(pages);
}

// Función legacy mantenida para compatibilidad
export async function obtenerPaginaPorUsername(req: Request, res: Response) {
  return paginaUnificadaPorUsername(req, res);
}

// Obtener página por username y número de página
// Obtener lista de páginas públicas de un usuario
/**
 * @swagger
 * /api/pagina/publicas/{username}:
 *   get:
 *     summary: Obtener páginas públicas de un usuario
 *     tags: [Pagina]
 */
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
    winston.error('Error al obtener páginas públicas del usuario', { error: err });
    res.status(500).json({ error: "Error al obtener páginas públicas del usuario" });
  }
}

/**
 * @swagger
 * /api/pagina/username/{username}/numero/{pageNumber}:
 *   get:
 *     summary: Obtener página por username y número de página
 *     tags: [Pagina]
 */
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
    winston.error('Error al obtener página por usuario y número', { error: err });
    res.status(500).json({ error: "Error al obtener página por usuario y número" });
  }
}
// Función eliminada: consultarPropietario (campo propietario eliminado)

// Función eliminada: consultarDescripcion (campo eliminado)

// Consultar usuario
/**
 * @swagger
 * /api/pagina/usuario/{id}:
 *   get:
 *     summary: Consultar usuario de página
 *     tags: [Pagina]
 */
export async function consultarUsuarioPagina(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
    const [rows]: any = await pool.query("SELECT usuario FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    res.json({ usuario: rows[0].usuario });
  } catch (err) {
    winston.error('Error al consultar usuario de página', { error: err });
    res.status(500).json({ error: "Error al consultar usuario de página" });
  }
}

// Función eliminada: actualizarPropietario (campo propietario eliminado)

// Función eliminada: actualizarDescripcion (campo eliminado)

// Actualizar usuario
/**
 * @swagger
 * /api/pagina/actualizar-usuario/{id}:
 *   put:
 *     summary: Actualizar usuario de página
 *     tags: [Pagina]
 */
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
    winston.error('Error al actualizar usuario de página', { error: err });
    res.status(500).json({ error: "Error al actualizar usuario de página" });
  }
}

// Funciones eliminadas: actualizarVisibilidad, consultarVisibilidad (campo oculto eliminado)

interface RequestWithValidatedData extends Request {
  validatedData?: any;
}
// Obtener una página por su id
export async function obtenerPagina(req: Request, res: Response) {
  const paginaId = req.params.id;
  try {
  winston.debug('Buscando página por ID', { paginaId, context: 'pagina' });
    const [rows]: any = await pool.query("SELECT p.*, u.display_name FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.id = ?", [paginaId]);
  winston.debug('Resultado de consulta de página', { paginaId, found: rows && rows.length > 0, context: 'pagina' });
    if (!rows || rows.length === 0) return sendError(res, 404, "Página no encontrada");

    // Logs detallados para debugging
    console.log('📄 [BACKEND DEBUG] Página recuperada:', {
       id: rows[0].id,
       usuario: rows[0].usuario,
       user_id: rows[0].user_id,
       creado_en: rows[0].creado_en
    });

    res.json(rows[0]);
  } catch (err) {
  winston.error('Error al obtener página', { paginaId, error: (err as Error).message, stack: (err as Error).stack, context: 'pagina' });
    sendError(res, 500, "Error al obtener página");
  }
}

const userService = getService<UserService>('UserService');

// Eliminar usuario y todo su rastro (perfil, comentarios, imágenes, feed)
/**
 * @swagger
 * /api/pagina/eliminar-usuario/{id}:
 *   delete:
 *     summary: Eliminar usuario y todos sus datos
 *     tags: [Pagina]
 */
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
    winston.error('Error al eliminar usuario y sus datos', { error: err });
    res.status(500).json({ error: "Error al eliminar usuario y sus datos" });
  }
}

/**
 * Envía una respuesta de error con código y mensaje, y loguea el error.
 */
function sendError(res: Response, code: number, msg: string) {
  winston.error('API error', { code, msg });
  return res.status(code).json({ error: msg });
}


/**
 * @swagger
 * /api/pagina/publicas:
 *   get:
 *     summary: Obtener páginas públicas
 *     tags: [Pagina]
 */
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
    winston.error('Error al obtener páginas públicas', { error: err });
    sendError(res, 500, "Error al obtener páginas");
  }
}


// Eliminado: función de edición de página

// Guardar comentario en la base de datos
/**
 * @swagger
 * /api/pagina/comentario:
 *   post:
 *     summary: Guardar comentario en la página
 *     tags: [Pagina]
 */
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
    winston.error('Error al guardar comentario', { error: err });
    sendError(res, 500, "Error al guardar comentario");
  }
}

// Eliminar comentario
/**
 * @swagger
 * /api/pagina/comentario/{id}/{commentId}:
 *   delete:
 *     summary: Eliminar comentario de la página
 *     tags: [Pagina]
 */
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
    winston.error('Error al eliminar comentario', { error: err });
    sendError(res, 500, "Error al eliminar comentario");
  }
}

