import { Router } from "express";
import rateLimit from "express-rate-limit";
import { paginasPublicas, guardarComentario, obtenerPagina } from "../controllers/paginaController";
import { authMiddleware } from "../middlewares/auth";
import multer from "multer";

const router = Router();
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Demasiadas peticiones, intenta más tarde." }
});

const upload = multer();

// Endpoint para obtener comentarios de una página
router.get("/:id/comentarios", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await require("../middlewares/db").pool.query(
      "SELECT * FROM comentarios WHERE pagina_id = ? ORDER BY creado_en ASC",
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("[GET /api/paginas/:id/comentarios] Error:", err);
    res.status(500).json({ error: "Error al obtener comentarios" });
  }
});

router.get("/", limiter, paginasPublicas);
router.get("/:id", obtenerPagina);
// Eliminado: ruta de edición de página
router.post("/:id/comentarios", authMiddleware, guardarComentario);

// Endpoint para subir imágenes a una página (BLOB)
router.post("/:id/imagenes", upload.single("imagen"), async (req: any, res) => {
  const paginaId = req.params.id;
  const { index } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No se recibió imagen" });
  try {
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
      [paginaId, index, file.buffer]
    );
    res.json({ message: "Imagen subida" });
  } catch (err) {
    console.error("Error al guardar imagen:", err);
    res.status(500).json({ error: "Error al guardar imagen" });
  }
});

// Endpoint para obtener todas las imágenes de una página
router.get("/:id/imagenes", async (req, res) => {
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

export default router;
