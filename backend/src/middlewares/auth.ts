import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "clave-secreta";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No autenticado" });
  try {
    const payload = jwt.verify(token, SECRET);
    if (typeof payload === "object" && payload !== null && "userId" in payload) {
      (req as any).userId = (payload as jwt.JwtPayload).userId;
    } else {
      return res.status(401).json({ error: "Token inválido" });
    }
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}
