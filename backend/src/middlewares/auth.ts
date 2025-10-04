
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "clave-secreta";

import { pool } from "./db";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  console.log("[AUTH] Cookie token:", token);
  if (!token) {
    console.log("[AUTH] No se recibió token en la cookie");
    console.log("[AUTH] Headers:", req.headers);
    return res.status(401).json({ error: "No autenticado (sin token)" });
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
        (req as any).userId = rows[0].id;
        return next();
      }
      console.log("[AUTH] Usuario no encontrado en la base de datos. userId:", payload.userId);
      return res.status(401).json({ error: "Usuario no encontrado", userId: payload.userId });
    }
    console.log("[AUTH] Token sin userId válido. Payload:", payload);
    return res.status(401).json({ error: "Token inválido", payload });
  } catch (err) {
    console.log("[AUTH] Error al verificar token:", err);
    if (err && typeof err === "object" && "name" in err) {
      const errorObj = err as { name: string; expiredAt?: Date; message?: string };
      if (errorObj.name === "TokenExpiredError") {
        console.log("[AUTH] Token expirado. Exp:", errorObj.expiredAt);
        return res.status(401).json({ error: "Token expirado", expiredAt: errorObj.expiredAt });
      }
      console.log("[AUTH] Headers:", req.headers);
      return res.status(401).json({ error: "Token inválido", details: errorObj.message });
    }
    return res.status(401).json({ error: "Token inválido", details: String(err) });
  }
}
