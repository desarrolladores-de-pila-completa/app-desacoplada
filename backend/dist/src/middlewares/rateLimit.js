"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Rate limiting eliminado - archivo comentado para referencia futura
/*
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';

// Límite para operaciones de autenticación (login, register) - por IP
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // Máximo 100 intentos en desarrollo, 5 en producción
  message: 'Demasiados intentos de autenticación. Inténtalo de nuevo en 15 minutos.',
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
  message: 'Demasiados intentos. Inténtalo de nuevo en un minuto.',
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
  handler: (req: Request, res: Response) => {
    console.log('=== USER RATE LIMIT TRIGGERED ===', {
      userId: (req as any).userId,
      username: (req as any).user?.username,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      context: 'user-rate-limit',
      timestamp: new Date().toISOString()
    });

    // Usar el RateLimitError personalizado en lugar de respuesta directa
    const { RateLimitError } = require('../errors/AppErrors');
    throw new RateLimitError('Demasiados intentos. Inténtalo de nuevo en un minuto.');
  }
});

// Límite específico para cambios de username - más restrictivo
export const usernameUpdateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: process.env.NODE_ENV === 'development' ? 5 : 2, // Máximo 5 en desarrollo, 2 en producción por hora
  message: 'Demasiados intentos de cambio de username. Solo puedes cambiar tu username 2 veces por hora en producción.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Usar userId para limitar por usuario específico
    const userId = (req as any).userId;
    return userId ? `username_update_${userId}` : ipKeyGenerator(req.ip || req.connection.remoteAddress || 'unknown');
  },
  skip: (req: Request) => {
    // Saltar si no está autenticado
    return !(req as any).userId;
  },
  handler: (req: Request, res: Response) => {
    console.log('=== USERNAME UPDATE RATE LIMIT TRIGGERED ===', {
      userId: (req as any).userId,
      username: (req as any).user?.username,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      context: 'username-update-rate-limit',
      timestamp: new Date().toISOString()
    });

    // Usar el RateLimitError personalizado en lugar de respuesta directa
    const { RateLimitError } = require('../errors/AppErrors');
    throw new RateLimitError('Demasiados intentos de cambio de username. Solo puedes cambiar tu username 2 veces por hora en producción.');
  }
});

// Límite general por IP para todas las rutas
export const generalRateLimit = rateLimit({
  windowMs: 15 * 1000, // 15 segundos
  max: 100, // Máximo 100 solicitudes por IP por 15 segundos
  message: 'Demasiadas solicitudes. Inténtalo de nuevo en 15 segundos.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.log('=== RATE LIMIT TRIGGERED ===', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      context: 'rate-limit',
      timestamp: new Date().toISOString()
    });

    // Log detallado para debugging del error 426
    console.log('🚨 RATE LIMIT DEBUG 426 🚨', {
      url: req.originalUrl,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      context: 'rate-limit-426-debug',
      timestamp: new Date().toISOString()
    });

    // Usar el RateLimitError personalizado en lugar de respuesta directa
    const { RateLimitError } = require('../errors/AppErrors');
    throw new RateLimitError('Demasiadas solicitudes. Inténtalo de nuevo en 15 segundos.');
  }
});
*/ 
//# sourceMappingURL=rateLimit.js.map