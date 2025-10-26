
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import jwt from 'jsonwebtoken';
import { getService } from "../utils/servicesConfig";
import { AuthService } from "../services/AuthService";

const authService = getService<AuthService>('AuthService');

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

  logger.debug('Verificando autenticación', {
    hasCookieToken: !!req.cookies.token,
    hasAuthHeader: !!req.headers.authorization,
    authHeader: req.headers.authorization,
    context: 'auth'
  });

  if (!token) {
    logger.warn('No token provided', { context: 'auth' });
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const decoded = authService.verifyToken(token);
    (req as any).userId = decoded.userId;
    logger.debug('Usuario autenticado via JWT', { userId: decoded.userId, context: 'auth' });
    return next();
  } catch (error) {
    logger.warn('Token inválido', { error: (error as Error).message, context: 'auth' });
    return res.status(401).json({ error: "Token inválido" });
  }
}
