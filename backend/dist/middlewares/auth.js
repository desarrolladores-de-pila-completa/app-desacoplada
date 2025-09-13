"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || "clave-secreta";
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header)
        return res.status(401).json({ error: "Token requerido" });
    const token = header.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "Token requerido" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
            return res.status(401).json({ error: "Token inválido o expirado" });
        }
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Token inválido o expirado" });
    }
}
//# sourceMappingURL=auth.js.map