// Endpoint para obtener todas las páginas públicas
import { Router } from "express";
// import rateLimit from "express-rate-limit";

import { paginasPublicas, guardarComentario, obtenerPagina, actualizarVisibilidad, consultarVisibilidad, actualizarPropietario, actualizarDescripcion, actualizarUsuarioPagina, actualizarComentariosPagina, consultarPropietario, consultarDescripcion, consultarUsuarioPagina, consultarComentariosPagina } from "../controllers/paginaController";
import { authMiddleware } from "../middlewares/auth";




const router = Router();
import { consultarVisibilidadCampos, actualizarVisibilidadCampos } from "../controllers/paginaController";
// Endpoint para obtener todas las páginas públicas (visible=1 y oculto=0)
router.get('/', async (req, res) => {
  try {
    const [rows]: any = await require("../middlewares/db").pool.query(
      "SELECT * FROM paginas WHERE oculto = 0 ORDER BY creado_en DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener páginas públicas" });
  }
});

// Endpoint para obtener la página por user_id
router.get('/usuario/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows]: any = await require("../middlewares/db").pool.query(
      "SELECT * FROM paginas WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [userId]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Página no encontrada" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener página por usuario" });
  }
});

// Endpoint para obtener todas las páginas públicas

// Endpoint para obtener todas las páginas públicas

// Endpoints GET para consultar los nuevos campos
// Visibilidad por campo
router.get('/:id/visibilidad-campos', consultarVisibilidadCampos);
router.post('/:id/visibilidad-campos', authMiddleware, actualizarVisibilidadCampos);
router.get('/:id/propietario', consultarPropietario);
router.get('/:id/descripcion', consultarDescripcion);
router.get('/:id/usuario', consultarUsuarioPagina);
router.get('/:id/comentarios-resumen', consultarComentariosPagina);

router.post("/:id/propietario", authMiddleware, actualizarPropietario);
router.post("/:id/descripcion", authMiddleware, actualizarDescripcion);
router.post("/:id/usuario", authMiddleware, actualizarUsuarioPagina);
// Eliminado el limitador de peticiones
router.post("/:id/comentarios-resumen", authMiddleware, actualizarComentariosPagina);

router.get("/:id/visibilidad", consultarVisibilidad);
router.post("/:id/visibilidad", authMiddleware, actualizarVisibilidad);


router.get("/:id/comentarios", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await require("../middlewares/db").pool.query(
      "SELECT * FROM comentarios WHERE pagina_id = ? ORDER BY creado_en ASC",
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener comentarios" });
  }
});

export default router;
