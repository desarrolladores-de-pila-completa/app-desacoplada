
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";

const SECRET = process.env.JWT_SECRET || "clave-secreta";

import { pool } from "./db";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  logger.debug('Verificando token de cookie', { token: token ? 'presente' : 'ausente', context: 'auth' });
  if (!token) {
    logger.warn('No se recibió token en la cookie', { headers: req.headers, context: 'auth' });
    return res.status(401).json({ error: "No autenticado (sin token)" });
  }
  try {
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    logger.debug('Payload JWT verificado', { userId: payload?.userId, context: 'auth' });
    if (payload?.userId) {
      // Buscar el usuario en la base de datos
      const [rows]: any = await pool.query("SELECT id, email, username FROM users WHERE id = ?", [payload.userId]);
      logger.debug('Resultado query usuario', { userId: payload.userId, found: rows && rows.length > 0, context: 'auth' });
      if (rows && rows.length > 0) {
        (req as any).user = rows[0];
        (req as any).userId = rows[0].id;
        return next();
      }
      logger.warn('Usuario no encontrado en la base de datos', { userId: payload.userId, context: 'auth' });
      return res.status(401).json({ error: "Usuario no encontrado", userId: payload.userId });
    }
    logger.warn('Token sin userId válido', { payload, context: 'auth' });
    return res.status(401).json({ error: "Token inválido", payload });
  } catch (err) {
    logger.error('Error al verificar token', { error: (err as Error).message, stack: (err as Error).stack, context: 'auth' });
    if (err && typeof err === "object" && "name" in err) {
      const errorObj = err as { name: string; expiredAt?: Date; message?: string };
      if (errorObj.name === "TokenExpiredError") {
        logger.warn('Token expirado', { expiredAt: errorObj.expiredAt, context: 'auth' });
        return res.status(401).json({ error: "Token expirado", expiredAt: errorObj.expiredAt });
      }
      logger.warn('Token inválido', { details: errorObj.message, headers: req.headers, context: 'auth' });
      return res.status(401).json({ error: "Token inválido", details: errorObj.message });
    }
    return res.status(401).json({ error: "Token inválido", details: String(err) });
  }
}
