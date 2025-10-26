import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  obtenerTodasLasPublicaciones
} from "../controllers/publicacionController";

const router = Router();

// Crear publicación
router.post("/", authMiddleware, async (req: any, res: any) => {
  const { titulo, contenido } = req.body;
  const userId = req.userId;

  try {
    // Crear la publicación
    const { pool } = require('../middlewares/db');
    const [result] = await pool.query(
      "INSERT INTO publicaciones (user_id, titulo, contenido) VALUES (?, ?, ?)",
      [userId, titulo, contenido]
    );

    const publicacionId = (result as any).insertId;

    res.json({ message: "Publicación creada", id: publicacionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear publicación" });
  }
});

// Obtener todas las publicaciones
router.get("/", obtenerTodasLasPublicaciones);

export default router;