"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../middlewares/db");
async function register(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
    }
    try {
        // Verificar si el email ya está registrado
        const [rows] = await db_1.pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (Array.isArray(rows) && rows.length > 0) {
            return res.status(409).json({ message: "Email ya registrado" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const result = await db_1.pool.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword]);
        res.status(201).json({ message: "Usuario registrado", userId: result.insertId });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al registrar usuario" });
    }
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
    }
    try {
        const [rows] = await db_1.pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!rows || (Array.isArray(rows) && rows.length === 0)) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
        const user = Array.isArray(rows) ? rows[0] : rows;
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
        res.json({ message: "Inicio de sesión exitoso" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al iniciar sesión" });
    }
}
//# sourceMappingURL=authController.js.map