"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("./db");
const SECRET = process.env.JWT_SECRET || "clave-secreta";
async function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    logger_1.default.debug('Verificando token de cookie', { token: token ? 'presente' : 'ausente', context: 'auth' });
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
                req.user = rows[0];
                req.userId = rows[0].id;
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
        if (err && typeof err === "object" && "name" in err) {
            const errorObj = err;
            if (errorObj.name === "TokenExpiredError") {
                logger_1.default.warn('Token expirado', { expiredAt: errorObj.expiredAt, context: 'auth' });
                return res.status(401).json({ error: "Token expirado", expiredAt: errorObj.expiredAt });
            }
            logger_1.default.warn('Token inválido', { details: errorObj.message, headers: req.headers, context: 'auth' });
            return res.status(401).json({ error: "Token inválido", details: errorObj.message });
        }
        return res.status(401).json({ error: "Token inválido", details: String(err) });
    }
}
//# sourceMappingURL=auth.js.map