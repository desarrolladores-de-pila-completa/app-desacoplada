"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const interfaces_1 = require("../types/interfaces");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = __importDefault(require("../utils/logger"));
class AuthService {
    userService;
    eventBus;
    constructor(userService, eventBus) {
        this.userService = userService;
        this.eventBus = eventBus;
    }
    /**
      * Registrar un nuevo usuario
      */
    async register(userData) {
        logger_1.default.info('AuthService.register called');
        // Generar username único
        const username = this.generateUniqueUsername();
        logger_1.default.debug('Username generated', { username });
        // Crear usuario usando UserService
        const fullUserData = { ...userData, username };
        logger_1.default.debug('Calling userService.createUser');
        const user = await this.userService.createUser(fullUserData);
        logger_1.default.info('User created', { userId: user.id });
        // Generar tokens para el nuevo usuario
        const { accessToken, refreshToken } = this.generateTokens(user.id);
        logger_1.default.debug('Tokens generated for new user', { userId: user.id });
        // Emitir evento de usuario registrado
        try {
            await this.eventBus.emit('user.registered', {
                userId: user.id,
                username: user.username,
                email: userData.email,
            });
            logger_1.default.info('Event emitted user.registered');
        }
        catch (error) {
            logger_1.default.error('Error emitiendo evento user.registered', { error });
            // No fallar el registro por esto
        }
        return {
            user,
            accessToken,
            refreshToken,
            username: user.username,
        };
    }
    /**
     * Generar username único
     */
    generateUniqueUsername() {
        const { randomUUID } = require('crypto');
        return randomUUID().replace(/-/g, '');
    }
    /**
      * Autenticar usuario para Passport
      */
    async login(email, password) {
        // Obtener usuario con contraseña
        const userWithPassword = await this.userService.getUserWithPassword(email);
        if (!userWithPassword) {
            throw new interfaces_1.AppError(401, 'Credenciales inválidas');
        }
        // Verificar contraseña
        const isPasswordValid = await bcryptjs_1.default.compare(password, userWithPassword.password);
        if (!isPasswordValid) {
            throw new interfaces_1.AppError(401, 'Credenciales inválidas');
        }
        // Retornar usuario sin contraseña
        const { password: _, ...user } = userWithPassword;
        // Generar tokens para el usuario autenticado
        const { accessToken, refreshToken } = this.generateTokens(user.id);
        logger_1.default.debug('Tokens generated for login', { userId: user.id });
        return {
            user,
            accessToken,
            refreshToken,
            username: user.username,
        };
    }
    /**
     * Generar tokens JWT (access y refresh)
     */
    generateTokens(userId) {
        const secret = process.env.JWT_SECRET || "clave-secreta";
        const refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh-secret";
        // Token de acceso: duración corta (15 minutos)
        const accessToken = jsonwebtoken_1.default.sign({ userId, type: 'access' }, secret, { expiresIn: '15m' });
        // Token de refresh: duración larga (7 días)
        const refreshToken = jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, refreshSecret, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    /**
     * @deprecated Usar generateTokens en su lugar
     */
    generateToken(userId) {
        const { accessToken } = this.generateTokens(userId);
        return accessToken;
    }
    /**
     * Verificar token JWT
     */
    verifyToken(token) {
        try {
            const secret = process.env.JWT_SECRET || "clave-secreta";
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded;
        }
        catch (error) {
            throw new interfaces_1.AppError(401, 'Token inválido');
        }
    }
    /**
     * Refrescar tokens usando refresh token con rotación automática
     */
    async refreshTokens(refreshToken) {
        try {
            const refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh-secret";
            const decoded = jsonwebtoken_1.default.verify(refreshToken, refreshSecret);
            if (decoded.type !== 'refresh') {
                throw new interfaces_1.AppError(401, 'Token de refresh inválido');
            }
            // Verificar que el usuario existe
            const user = await this.userService.getUserById(decoded.userId);
            if (!user) {
                throw new interfaces_1.AppError(401, 'Usuario no encontrado');
            }
            // Verificar límite de rotación (máximo 5 rotaciones por refresh token)
            const rotationCount = (decoded.rotationCount || 0) + 1;
            if (rotationCount > 5) {
                throw new interfaces_1.AppError(401, 'Refresh token ha excedido el límite de rotación');
            }
            // Generar nuevos tokens con contador de rotación
            const { accessToken, refreshToken: newRefreshToken } = this.generateTokensWithRotation(user.id, rotationCount);
            return {
                accessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new interfaces_1.AppError(401, 'Refresh token expirado');
            }
            throw new interfaces_1.AppError(401, 'Refresh token inválido');
        }
    }
    /**
     * Generar tokens JWT con rotación de refresh token
     */
    generateTokensWithRotation(userId, rotationCount = 0) {
        const secret = process.env.JWT_SECRET || "clave-secreta";
        const refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh-secret";
        // Token de acceso: duración corta (15 minutos)
        const accessToken = jsonwebtoken_1.default.sign({ userId, type: 'access' }, secret, { expiresIn: '15m' });
        // Refresh token con rotación: duración larga (7 días) con contador
        const refreshToken = jsonwebtoken_1.default.sign({ userId, type: 'refresh', rotationCount }, refreshSecret, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    /**
     * Verificar si un token está próximo a expirar (menos de 5 minutos)
     */
    isTokenNearExpiry(token) {
        try {
            const secret = process.env.JWT_SECRET || "clave-secreta";
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (!decoded.exp)
                return true;
            const now = Math.floor(Date.now() / 1000);
            const fiveMinutes = 5 * 60;
            return (decoded.exp - now) < fiveMinutes;
        }
        catch (error) {
            return true; // Si no se puede verificar, asumir que está próximo a expirar
        }
    }
    /**
     * Obtener información del token sin verificar (para debugging)
     */
    getTokenInfo(token) {
        try {
            const secret = process.env.JWT_SECRET || "clave-secreta";
            return jsonwebtoken_1.default.verify(token, secret);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Invalidar sesión de usuario (logout forzado)
     */
    async invalidateUserSession(userId) {
        // En una implementación más avanzada, podrías mantener una lista negra de tokens
        // Por ahora, simplemente registramos el evento
        logger_1.default.info('Sesión invalidada para usuario', { userId, context: 'auth' });
    }
    /**
     * Obtener sesiones activas del usuario (para futuras mejoras)
     */
    async getUserSessions(userId) {
        // Esta es una implementación básica
        // En una versión más avanzada podrías rastrear sesiones múltiples
        return [{
                userId,
                active: true,
                lastActivity: new Date(),
                ip: 'tracked',
                userAgent: 'tracked'
            }];
    }
    /**
     * Verificar si el usuario tiene sesiones múltiples sospechosas
     */
    async checkSuspiciousActivity(userId) {
        // Implementación básica - en producción querrías rastrear IPs, user agents, etc.
        const sessions = await this.getUserSessions(userId);
        return sessions.length > 3; // Más de 3 sesiones activas podría ser sospechoso
    }
    /**
     * Extender sesión automáticamente (sliding sessions)
     * Se llama cuando hay actividad del usuario para extender la sesión
     */
    async extendSession(userId) {
        try {
            // Verificar que el usuario existe
            const user = await this.userService.getUserById(userId);
            if (!user) {
                throw new interfaces_1.AppError(401, 'Usuario no encontrado');
            }
            // Generar nuevos tokens con extensión de sesión
            const { accessToken, refreshToken } = this.generateTokensWithRotation(user.id);
            logger_1.default.info('Sesión extendida automáticamente', {
                userId,
                context: 'sliding-session',
                timestamp: new Date().toISOString()
            });
            return {
                accessToken,
                refreshToken,
                extended: true
            };
        }
        catch (error) {
            logger_1.default.error('Error al extender sesión', { error, userId });
            throw new interfaces_1.AppError(500, 'Error al extender sesión');
        }
    }
    /**
     * Verificar si la sesión debe extenderse automáticamente
     * Se basa en la actividad reciente del usuario
     */
    shouldExtendSession(lastActivity) {
        const now = new Date();
        const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutos
        // Extender si la última actividad fue hace menos de 5 minutos
        return timeSinceLastActivity < fiveMinutes;
    }
    /**
     * Actualizar timestamp de última actividad del usuario
     */
    async updateLastActivity(userId) {
        // En una implementación más avanzada, podrías guardar esto en la base de datos
        // Por ahora, solo registramos en los logs
        logger_1.default.debug('Última actividad actualizada', {
            userId,
            timestamp: new Date().toISOString(),
            context: 'activity-tracking'
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map