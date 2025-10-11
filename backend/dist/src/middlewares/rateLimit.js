"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRateLimit = exports.userRateLimit = exports.authRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Límite para operaciones de autenticación (login, register) - por IP
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'development' ? 100 : 5, // Máximo 100 intentos en desarrollo, 5 en producción
    message: 'Demasiados intentos de autenticación. Inténtalo de nuevo en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Opcional: saltar para IPs confiables, pero por ahora no
        return false;
    },
});
// Límite para operaciones críticas autenticadas (crear página, comentario, etc.) - por usuario
exports.userRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // Máximo 10 operaciones por usuario por minuto
    message: 'Demasiados intentos. Inténtalo de nuevo en un minuto.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Usar userId si está autenticado, sino IP
        const userId = req.userId;
        return userId ? `user_${userId}` : (req.ip || req.connection.remoteAddress || 'unknown');
    },
    skip: (req) => {
        // Saltar si no está autenticado (para rutas públicas)
        return !req.userId;
    },
});
// Límite general por IP para todas las rutas
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 1000, // 15 segundos
    max: 100, // Máximo 100 solicitudes por IP por 15 segundos
    message: 'Demasiadas solicitudes. Inténtalo de nuevo en 15 segundos.',
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=rateLimit.js.map