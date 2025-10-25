
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    logger.debug('Usuario autenticado via Passport', { userId: (req as any).user?.id, context: 'auth' });
    return next();
  } else {
    logger.warn('Usuario no autenticado', { context: 'auth' });
    return res.status(401).json({ error: "No autenticado" });
  }
}
