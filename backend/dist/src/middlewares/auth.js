"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("./db");
const servicesConfig_1 = require("../utils/servicesConfig");
const cookieConfig_1 = require("../utils/cookieConfig");
const SECRET = process.env.JWT_SECRET || "clave-secreta";
const authService = (0, servicesConfig_1.getService)('AuthService');
async function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    const refreshToken = req.cookies.refreshToken;
    logger_1.default.debug('Verificando token de cookie', {
        token: token ? 'presente' : 'ausente',
        refreshToken: refreshToken ? 'presente' : 'ausente',
        context: 'auth'
    });
    if (!token) {
        logger_1.default.warn('No se recibió token en la cookie', { headers: req.headers, context: 'auth' });
        return res.status(401).json({ error: "No autenticado (sin token)" });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, SECRET);
        logger_1.default.debug('Payload JWT verificado', { userId: payload?.userId, context: 'auth' });
        if (payload?.userId) {
            // Buscar el usuario en la base de datos
            const [rows] = await db_1.pool.query("SELECT id, email, username FROM users WHERE id = ?", [payload.userId]);
            logger_1.default.debug('Resultado query usuario', { userId: payload.userId, found: rows && rows.length > 0, context: 'auth' });
            if (rows && rows.length > 0) {
                const user = rows[0];
                // Actualizar última actividad del usuario
                await authService.updateLastActivity(user.id);
                // Verificar si el token está próximo a expirar y extender sesión automáticamente
                if (authService.isTokenNearExpiry(token) && refreshToken) {
                    try {
                        logger_1.default.info('Token próximo a expirar, extendiendo sesión automáticamente', { userId: user.id, context: 'auth' });
                        const extendedSession = await authService.extendSession(user.id);
                        // Establecer nuevas cookies
                        res.cookie("token", extendedSession.accessToken, (0, cookieConfig_1.getAuthCookieOptions)());
                        res.cookie("refreshToken", extendedSession.refreshToken, (0, cookieConfig_1.getRefreshTokenCookieOptions)());
                        // Marcar extensión en header para el cliente
                        res.setHeader('X-Session-Extended', 'true');
                    }
                    catch (extendError) {
                        logger_1.default.warn('Error al extender sesión automáticamente', { error: extendError, userId: user.id, context: 'auth' });
                        // Continuar con el token actual si no se puede extender
                    }
                }
                req.user = user;
                req.userId = user.id;
                return next();
            }
            logger_1.default.warn('Usuario no encontrado en la base de datos', { userId: payload.userId, context: 'auth' });
            return res.status(401).json({ error: "Usuario no encontrado", userId: payload.userId });
        }
        logger_1.default.warn('Token sin userId válido', { payload, context: 'auth' });
        return res.status(401).json({ error: "Token inválido", payload });
    }
    catch (err) {
        logger_1.default.error('Error al verificar token', { error: err.message, stack: err.stack, context: 'auth' });
        // Si el token está expirado pero tenemos refresh token, intentar refresh automático
        if (err && typeof err === "object" && "name" in err && refreshToken) {
            const errorObj = err;
            if (errorObj.name === "TokenExpiredError") {
                logger_1.default.info('Token expirado, intentando refresh automático', { context: 'auth' });
                try {
                    const refreshResult = await authService.refreshTokens(refreshToken);
                    // Establecer nuevas cookies
                    res.cookie("token", refreshResult.accessToken, (0, cookieConfig_1.getAuthCookieOptions)());
                    res.cookie("refreshToken", refreshResult.refreshToken, (0, cookieConfig_1.getRefreshTokenCookieOptions)());
                    // Buscar usuario con el nuevo token
                    const newPayload = jsonwebtoken_1.default.verify(refreshResult.accessToken, SECRET);
                    if (newPayload?.userId) {
                        const [rows] = await db_1.pool.query("SELECT id, email, username FROM users WHERE id = ?", [newPayload.userId]);
                        if (rows && rows.length > 0) {
                            const user = rows[0];
                            req.user = user;
                            req.userId = user.id;
                            // Marcar refresh automático en header
                            res.setHeader('X-Token-Refreshed', 'true');
                            logger_1.default.info('Token refrescado automáticamente', { userId: user.id, context: 'auth' });
                            return next();
                        }
                    }
                }
                catch (refreshError) {
                    logger_1.default.warn('Error en refresh automático de token', { error: refreshError, context: 'auth' });
                }
                return res.status(401).json({ error: "Token expirado y no se pudo refrescar", expiredAt: errorObj.expiredAt });
            }
        }
        return res.status(401).json({ error: "Token inválido", details: String(err) });
    }
}
//# sourceMappingURL=auth.js.map