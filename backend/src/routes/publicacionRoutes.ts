import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { userRateLimit } from '../middlewares/rateLimit';
import {
  obtenerTodasLasPublicaciones
} from "../controllers/publicacionController";

const router = Router();

// Crear publicación
router.post("/", authMiddleware, userRateLimit, async (req: any, res: any) => {
  const { titulo, contenido } = req.body;
  const userId = req.user.id;

  try {
    // Crear la publicación
    const { pool } = require('../middlewares/db');
    const [result] = await pool.query(
      "INSERT INTO publicaciones (user_id, titulo, contenido) VALUES (?, ?, ?)",
      [userId, titulo, contenido]
    );

    const publicacionId = (result as any).insertId;

    // Crear entrada en el feed
    const { getService } = require('../utils/servicesConfig');
    const userService = getService('UserService');
    const user = await userService.getUserById(userId);
    const mensaje = `Nueva publicación: <strong>${titulo}</strong>`;

    await pool.query(
      "INSERT INTO feed (user_id, mensaje) VALUES (?, ?)",
      [userId, mensaje]
    );

    res.json({ message: "Publicación creada", id: publicacionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear publicación" });
  }
});

// ❌ ELIMINADAS: Rutas para obtener publicaciones específicas
// Estas funcionalidades pueden ser manejadas por la ruta general o por páginas

// Obtener todas las publicaciones
router.get("/", obtenerTodasLasPublicaciones);

export default router;