
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "clave-secreta";

import { pool } from "./db";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  console.log("[AUTH] Cookie token:", token);
  if (!token) {
    console.log("[AUTH] No se recibió token en la cookie");
    return res.status(401).json({ error: "No autenticado" });
  }
  try {
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    console.log("[AUTH] Payload JWT:", payload);
    if (payload?.userId) {
      // Buscar el usuario en la base de datos
      const [rows]: any = await pool.query("SELECT id, email, username FROM users WHERE id = ?", [payload.userId]);
      console.log("[AUTH] Resultado query usuario:", rows);
      if (rows && rows.length > 0) {
        (req as any).user = rows[0];
        return next();
      }
      console.log("[AUTH] Usuario no encontrado en la base de datos");
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    console.log("[AUTH] Token sin userId válido");
    return res.status(401).json({ error: "Token inválido" });
  } catch (err) {
    console.log("[AUTH] Error al verificar token:", err);
    return res.status(401).json({ error: "Token inválido" });
  }
}
