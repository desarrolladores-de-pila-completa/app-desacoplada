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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_1 = require("./db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importStar(require("crypto"));
// Función para guardar el token en la base de datos
async function saveToken(user, token) {
    await db_1.pool.execute("INSERT INTO tokens (user_id, token, created_at) VALUES (?, ?, NOW())", [user.id, token]);
}
const router = (0, express_1.Router)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 20, // máximo 20 peticiones por IP por minuto
    message: { error: "Demasiadas peticiones, intenta más tarde." }
});
router.use(limiter);
const SECRET = process.env.JWT_SECRET || "clave-secreta";
const ENC_SECRET = process.env.ENC_SECRET || "0123456789abcdef0123456789abcdef"; // 32 chars para AES-256
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", Buffer.from(ENC_SECRET, "utf8"), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
}
router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        // Verificar si el email ya existe
        const [rows] = await db_1.pool.execute("SELECT id FROM users WHERE email = ?", [email]);
        if (rows.length > 0) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        // Generar username único usando solo uuid4
        const username = (0, crypto_1.randomUUID)().replace(/-/g, "");
        await db_1.pool.execute("INSERT INTO users (email, password, username) VALUES (?, ?, ?)", [email, hashed, username]);
        res.json({ message: "Usuario creado", username });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await db_1.pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    const users = rows;
    if (users.length === 0)
        return res.status(400).json({ error: "Credenciales inválidas" });
    const user = users[0];
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid)
        return res.status(400).json({ error: "Credenciales inválidas" });
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });
    const encryptedToken = encrypt(token);
    res.cookie("token", encryptedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Solo true en producción
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 3600000, // 1 hora
        path: "/"
    });
    res.json({ message: "Login exitoso", username: user.username });
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map