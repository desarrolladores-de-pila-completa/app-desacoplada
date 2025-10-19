"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRateLimit = exports.usernameUpdateRateLimit = exports.userRateLimit = exports.authRateLimit = void 0;
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
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
        return userId ? `user_${userId}` : (0, express_rate_limit_1.ipKeyGenerator)(req.ip || req.connection.remoteAddress || 'unknown');
    },
    skip: (req) => {
        // Saltar si no está autenticado (para rutas públicas)
        return !req.userId;
    },
});
// Límite específico para cambios de username - más restrictivo
exports.usernameUpdateRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: process.env.NODE_ENV === 'development' ? 5 : 2, // Máximo 5 en desarrollo, 2 en producción por hora
    message: 'Demasiados intentos de cambio de username. Solo puedes cambiar tu username 2 veces por hora en producción.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Usar userId para limitar por usuario específico
        const userId = req.userId;
        return userId ? `username_update_${userId}` : (0, express_rate_limit_1.ipKeyGenerator)(req.ip || req.connection.remoteAddress || 'unknown');
    },
    skip: (req) => {
        // Saltar si no está autenticado
        return !req.userId;
    },
    handler: (req, res) => {
        console.log('=== USERNAME UPDATE RATE LIMIT TRIGGERED ===', {
            userId: req.userId,
            username: req.user?.username,
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
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 1000, // 15 segundos
    max: 100, // Máximo 100 solicitudes por IP por 15 segundos
    message: 'Demasiadas solicitudes. Inténtalo de nuevo en 15 segundos.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
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
//# sourceMappingURL=rateLimit.js.map