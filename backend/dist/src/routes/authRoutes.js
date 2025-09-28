"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const db_1 = require("../middlewares/db");
const crypto_1 = require("crypto");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 20, // máximo 20 peticiones por IP por minuto
    message: { error: "Demasiadas peticiones, intenta más tarde." }
});
router.use(limiter);
router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db_1.pool.execute("SELECT id FROM users WHERE email = ?", [email]);
        if (rows.length > 0) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const id = (0, crypto_1.randomUUID)(); // Genera el UUID único
        const username = (0, crypto_1.randomUUID)().replace(/-/g, "");
        await db_1.pool.execute("INSERT INTO users (id, email, password, username) VALUES (?, ?, ?, ?)", [id, email, hashed, username]);
        res.json({ message: "Usuario creado", id, username });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});
router.post("/login", authController_1.login);
router.get("/user/:value", async (req, res) => {
    const { value } = req.params;
    try {
        const [rows] = await db_1.pool.execute("SELECT id, email, username FROM users WHERE id = ? OR email = ?", [value, value]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map