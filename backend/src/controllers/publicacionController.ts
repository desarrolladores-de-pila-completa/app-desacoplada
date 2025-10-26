import { Request, Response } from "express";
import { PublicacionService } from "../services/PublicacionService";
import { getService } from '../utils/servicesConfig';

const publicacionService = getService<PublicacionService>('PublicacionService');

export async function crearPublicacion(req: any, res: Response) {
  const { titulo, contenido } = req.body;
  const userId = req.userId;

  try {
    const publicacionId = await publicacionService.createPublicacion(userId, { titulo, contenido });
    res.json({ message: "Publicación creada", id: publicacionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear publicación" });
  }
}

export async function obtenerPublicacion(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "ID requerido" });

  try {
    const publicacion = await publicacionService.getPublicacionById(parseInt(id));
    if (!publicacion) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }
    res.json(publicacion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener publicación" });
  }
}

export async function obtenerPublicacionesPorUsuario(req: Request, res: Response) {
  const { username } = req.params;

  try {
    // Obtener user_id del username
    const { pool } = require('../middlewares/db');
    const [users]: any = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const publicaciones = await publicacionService.getPublicacionesByUser(users[0].id);
    res.json(publicaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener publicaciones" });
  }
}

export async function obtenerTodasLasPublicaciones(req: Request, res: Response) {
  try {
    const publicaciones = await publicacionService.getAllPublicaciones();
    res.json(publicaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener publicaciones" });
  }
}