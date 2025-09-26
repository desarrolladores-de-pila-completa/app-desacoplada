import { Request, Response } from "express";
import { pool } from "../middlewares/db";

export async function paginasPublicas(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute(
      "SELECT p.id, p.titulo, p.contenido, u.username FROM paginas p JOIN users u ON p.user_id = u.id ORDER BY p.id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener páginas" });
  }
}
