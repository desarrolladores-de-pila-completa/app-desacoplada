import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "clave-secreta";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token requerido" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, SECRET) as unknown as { userId: number };
    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }
    (req as any).userId = (decoded as { userId: number }).userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
