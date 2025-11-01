import { Router } from "express";
import { crearPublicacion, obtenerPublicacionesPorUsuario } from "../controllers/publicacionController";
import { authMiddleware } from "../middlewares/auth";
import { getService } from '../utils/servicesConfig';
import { PublicacionService } from '../services/PublicacionService';

const router = Router();

// Endpoint para crear una nueva publicación
router.post("/api/publicar/:username/crearPublicacion", authMiddleware, crearPublicacion);

// Endpoint para obtener publicaciones de un usuario (API JSON)
router.get("/api/publicar/:username/publicaciones", obtenerPublicacionesPorUsuario);

// Endpoint para obtener una publicación específica (API JSON)
router.get("/api/publicar/:username/publicaciones/:id", async (req, res) => {
  const { username, id } = req.params;
  const publicacionService = getService<PublicacionService>('PublicacionService');

  console.log('=== DEBUG: obtenerPublicacionEspecifica called ===', {
    username,
    id,
    timestamp: new Date().toISOString(),
    context: 'publicacion-get-specific-debug'
  });

  try {
    // Verificar que el usuario existe
    const { pool } = require('../middlewares/db');
    const [users]: any = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (!users || users.length === 0) {
      console.log('=== DEBUG: User not found ===', { username, context: 'publicacion-get-specific-debug' });
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const publicacion = await publicacionService.getPublicacionById(parseInt(id));
    if (!publicacion) {
      console.log('=== DEBUG: Publicacion not found ===', { id, context: 'publicacion-get-specific-debug' });
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    // Verificar que la publicación pertenece al usuario correcto
    if (publicacion.user_id !== users[0].id) {
      console.log('=== DEBUG: Publicacion does not belong to user ===', {
        publicacionUserId: publicacion.user_id,
        requestedUserId: users[0].id,
        context: 'publicacion-get-specific-debug'
      });
      return res.status(403).json({ error: "Esta publicación no pertenece al usuario especificado" });
    }

    console.log('=== DEBUG: obtenerPublicacionEspecifica result ===', {
      username,
      id,
      titulo: publicacion.titulo,
      context: 'publicacion-get-specific-debug'
    });

    // Forzar respuesta JSON
    res.setHeader('Content-Type', 'application/json');
    res.json(publicacion);
  } catch (err) {
    console.error('=== DEBUG: Error in obtenerPublicacionEspecifica ===', {
      error: err,
      username,
      id,
      context: 'publicacion-get-specific-debug'
    });
    res.status(500).json({ error: "Error al obtener publicación" });
  }
});


export default router;