import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';

// Límite para operaciones de autenticación (login, register) - por IP
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por IP en 15 minutos
  message: {
    error: 'Demasiados intentos de autenticación. Inténtalo de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Opcional: saltar para IPs confiables, pero por ahora no
    return false;
  },
});

// Límite para operaciones críticas autenticadas (crear página, comentario, etc.) - por usuario
export const userRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 operaciones por usuario por minuto
  message: {
    error: 'Demasiados intentos. Inténtalo de nuevo en un minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Usar userId si está autenticado, sino IP
    const userId = (req as any).userId;
    return userId ? `user_${userId}` : ipKeyGenerator(req.ip || req.connection.remoteAddress || 'unknown');
  },
  skip: (req: Request) => {
    // Saltar si no está autenticado (para rutas públicas)
    return !(req as any).userId;
  },
});

// Límite general por IP para todas las rutas
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // Máximo 100 solicitudes por IP por minuto
  message: {
    error: 'Demasiadas solicitudes. Inténtalo de nuevo en un minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});