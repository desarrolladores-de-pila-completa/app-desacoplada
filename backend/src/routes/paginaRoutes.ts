// Endpoint para obtener todas las páginas públicas
import { Router } from "express";
// import rateLimit from "express-rate-limit";

import { paginasPublicas, guardarComentario, obtenerPagina, actualizarVisibilidad, consultarVisibilidad, actualizarPropietario, actualizarDescripcion, actualizarUsuarioPagina, actualizarComentariosPagina, consultarPropietario, consultarDescripcion, consultarUsuarioPagina, consultarComentariosPagina, eliminarUsuarioTotal } from "../controllers/paginaController";
import { authMiddleware } from "../middlewares/auth";
const multer = require("multer");

import rateLimit from "express-rate-limit";
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });

const router = Router();
// Endpoint para consultar visibilidad general de la página
router.get("/:id/visibilidad", consultarVisibilidad);
// Endpoint para consultar visibilidad de campos de la página
import { consultarVisibilidadCampos } from "../controllers/paginaController";
router.get("/:id/visibilidad-campos", consultarVisibilidadCampos);


const upload = multer();

// Endpoint para obtener comentarios de una página

router.get("/:id/comentarios", async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const [rows]: any = await require("../middlewares/db").pool.query(
      `SELECT c.*, u.username FROM comentarios c LEFT JOIN users u ON c.user_id = u.id WHERE c.pagina_id = ? ORDER BY c.creado_en DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener comentarios" });
  }
});

router.get("/", limiter, paginasPublicas);
router.get("/:id", obtenerPagina);

// Endpoint para obtener la página por username
import { obtenerPaginaPorUsername } from "../controllers/paginaController";
router.get("/pagina/:username", obtenerPaginaPorUsername);

// Endpoint para obtener página por user_id (UUID sin guiones)
import { obtenerPaginaPorUserId } from "../controllers/paginaController";
router.get("/pagina/id/:user_id", obtenerPaginaPorUserId);
// Endpoint para actualizar el nombre de usuario de la página
router.post("/:id/usuario", authMiddleware, actualizarUsuarioPagina);
// Comentarios
router.post("/:id/comentarios", authMiddleware, guardarComentario);

// Endpoint para subir imágenes a una página (BLOB)
router.post("/:id/imagenes", authMiddleware, upload.single("imagen"), async (req: any, res: any) => {
  const paginaId = req.params.id;
  // Usar multer para procesar todos los campos del formulario
  const file = req.file;
  // 'index' puede venir como string, asegúrate de convertirlo a número
  let idx = req.body.index;
  if (Array.isArray(idx)) idx = idx[0];
  idx = Number(idx);
  if (isNaN(idx)) return res.status(400).json({ error: "Índice de imagen inválido" });
  if (!file) return res.status(400).json({ error: "No se recibió imagen" });
  try {
    // Verificar que el usuario autenticado es el dueño de la página
    const [rows]: any = await require("../middlewares/db").pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Página no encontrada" });
    if (String(rows[0].user_id) !== String(req.user.id)) return res.status(403).json({ error: "Solo el dueño puede subir imágenes" });
    // Crear tabla 'imagenes' si no existe
    await require("../middlewares/db").pool.query(`CREATE TABLE IF NOT EXISTS imagenes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pagina_id INT NOT NULL,
      idx INT NOT NULL,
      imagen LONGBLOB,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
    )`);
    // Guardar imagen en la base de datos
    await require("../middlewares/db").pool.query(
      "REPLACE INTO imagenes (pagina_id, idx, imagen) VALUES (?, ?, ?)",
      [paginaId, idx, file.buffer]
    );
    res.json({ message: "Imagen subida" });
  } catch (err) {
    console.error("Error al guardar imagen:", err);
    res.status(500).json({ error: "Error al guardar imagen" });
  }
});

// Endpoint para obtener todas las imágenes de una página
router.get("/:id/imagenes", async (req: any, res: any) => {
  const paginaId = req.params.id;
  try {
    const [rows]: any = await require("../middlewares/db").pool.query(
      "SELECT idx, imagen FROM imagenes WHERE pagina_id = ? ORDER BY idx ASC",
      [paginaId]
    );
    // Convertir BLOB a base64 para frontend
    const images = rows.map((row: any) => ({
      idx: row.idx,
      src: `data:image/jpeg;base64,${Buffer.from(row.imagen).toString('base64')}`
    }));
    res.json(images);
  } catch (err) {
    console.error("Error al obtener imágenes:", err);
    res.status(500).json({ error: "Error al obtener imágenes" });
  }
});

// Endpoint para eliminar usuario y todo su rastro
router.delete("/usuario/:id", authMiddleware, eliminarUsuarioTotal);

export default router;
