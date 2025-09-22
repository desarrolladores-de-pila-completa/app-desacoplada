import { Request, Response } from "express";
import { pool } from "../middlewares/db";

export async function crearPagina(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { titulo, contenido, elementos } = req.body;
  if (!titulo || !contenido) {
    return res.status(400).json({ message: "Faltan datos" });
  }
  try {
    await pool.execute(
      "INSERT INTO paginas (user_id, titulo, contenido, elementos) VALUES (?, ?, ?, ?)",
      [userId, titulo, contenido, JSON.stringify(elementos ?? [])]
    );
    res.json({ message: "Página creada" });
  } catch (err) {
    console.error("Error al crear página:", err);
    res.status(500).json({ message: "Error al crear página" });
  }
}

export async function verPagina(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.execute(
      "SELECT p.id, p.titulo, p.contenido, p.elementos, u.username FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.id = ?",
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Página no encontrada" });
    }
    const pagina = rows[0];
    if (pagina.elementos && typeof pagina.elementos === "string") {
      try {
        pagina.elementos = JSON.parse(pagina.elementos);
      } catch {}
    }
    res.json(pagina);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener página" });
  }
}

export async function paginasPorAutor(req: Request, res: Response) {
  const { username } = req.params;
  try {
    const [rows] = await pool.execute(
      "SELECT p.id, p.titulo, p.contenido, u.username FROM paginas p JOIN users u ON p.user_id = u.id WHERE u.username = ? ORDER BY p.id DESC",
      [username]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al buscar páginas por autor" });
  }
}

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
