"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const logger_1 = __importDefault(require("../utils/logger"));
async function authMiddleware(req, res, next) {
    if (req.isAuthenticated()) {
        logger_1.default.debug('Usuario autenticado via Passport', { userId: req.user?.id, context: 'auth' });
        return next();
    }
    else {
        logger_1.default.warn('Usuario no autenticado', { context: 'auth' });
        return res.status(401).json({ error: "No autenticado" });
    }
}
//# sourceMappingURL=auth.js.map