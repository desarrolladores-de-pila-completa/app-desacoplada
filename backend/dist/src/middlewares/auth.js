"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const logger_1 = __importDefault(require("../utils/logger"));
const servicesConfig_1 = require("../utils/servicesConfig");
const authService = (0, servicesConfig_1.getService)('AuthService');
async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    logger_1.default.debug('Verificando autenticación', {
        hasCookieToken: !!req.cookies.token,
        hasAuthHeader: !!req.headers.authorization,
        authHeader: req.headers.authorization,
        context: 'auth'
    });
    if (!token) {
        logger_1.default.warn('No token provided', { context: 'auth' });
        return res.status(401).json({ error: "No autenticado" });
    }
    try {
        const decoded = authService.verifyToken(token);
        req.userId = decoded.userId;
        logger_1.default.debug('Usuario autenticado via JWT', { userId: decoded.userId, context: 'auth' });
        return next();
    }
    catch (error) {
        logger_1.default.warn('Token inválido', { error: error.message, context: 'auth' });
        return res.status(401).json({ error: "Token inválido" });
    }
}
//# sourceMappingURL=auth.js.map