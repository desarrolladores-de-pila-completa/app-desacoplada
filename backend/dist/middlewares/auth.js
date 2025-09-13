"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || "clave-secreta";
function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token)
        return res.status(401).json({ error: "No autenticado" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, SECRET);
        if (typeof payload === "object" && payload !== null && "userId" in payload) {
            req.userId = payload.userId;
        }
        else {
            return res.status(401).json({ error: "Token inválido" });
        }
        next();
    }
    catch {
        res.status(401).json({ error: "Token inválido" });
    }
}
//# sourceMappingURL=auth.js.map