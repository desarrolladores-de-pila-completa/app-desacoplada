"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("./db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Función para guardar el token en la base de datos
async function saveToken(user, token) {
    await db_1.pool.execute("INSERT INTO tokens (user_id, token, created_at) VALUES (?, ?, NOW())", [user.id, token]);
}
const router = (0, express_1.Router)();
const SECRET = process.env.JWT_SECRET || "clave-secreta";
router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashed = await bcrypt_1.default.hash(password, 10);
        await db_1.pool.execute("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashed]);
        res.json({ message: "Usuario creado" });
    }
    catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "El email ya está registrado" });
        }
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
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid)
        return res.status(400).json({ error: "Credenciales inválidas" });
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });
    // Guardar el token en la base de datos
    await saveToken(user, token);
    res.json({ token });
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map