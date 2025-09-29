import { Router } from "express";
import rateLimit from "express-rate-limit";
import { paginasPublicas, guardarComentario, obtenerPagina } from "../controllers/paginaController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Demasiadas peticiones, intenta más tarde." }
});

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
// Nuevo endpoint para obtener página por user_id (UUID)
router.get("/usuario/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("[GET /api/paginas/usuario/:userId] userId:", userId);
  try {
    const [rows]: any = await require("../middlewares/db").pool.query(
      "SELECT * FROM paginas WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [userId]
    );
    console.log("[GET /api/paginas/usuario/:userId] Resultado:", rows);
    if (!rows || rows.length === 0) {
      console.log("[GET /api/paginas/usuario/:userId] Página no encontrada para userId:", userId);
      return res.status(404).json({ error: "Página no encontrada" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("[GET /api/paginas/usuario/:userId] Error:", err);
    res.status(500).json({ error: "Error al obtener página por usuario" });
  }
});
// Eliminado: ruta de edición de página
router.post("/:id/comentarios", authMiddleware, guardarComentario);

export default router;
