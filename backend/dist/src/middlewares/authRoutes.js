"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_1 = require("./db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
const crypto_1 = require("crypto");
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
    res.cookie("token", token, {
        httpOnly: true,
        secure: true, // false -> Para desarrollo local
        sameSite: "none", // Permite envío entre puertos locales
        maxAge: 3600000, // 1 hora
        path: "/" // Asegura que la cookie se envía en todas las rutas
    });
    res.json({ message: "Login exitoso", username: user.username });
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map