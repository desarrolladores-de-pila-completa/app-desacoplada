
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "clave-secreta";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No autenticado" });
  try {
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    if (payload?.userId) {
      (req as any).userId = payload.userId;
      return next();
    }
    return res.status(401).json({ error: "Token inválido" });
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}
