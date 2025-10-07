"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarUsuario = eliminarUsuario;
exports.logout = logout;
exports.register = register;
exports.login = login;
// Eliminar usuario y su página
async function eliminarUsuario(req, res) {
    const userId = req.params.id;
    if (!userId)
        return sendError(res, 400, "Falta el id de usuario");
    try {
        // Eliminar comentarios del usuario
        await db_1.pool.query("DELETE FROM comentarios WHERE user_id = ?", [userId]);
        // Eliminar imágenes asociadas a sus páginas
        await db_1.pool.query("DELETE FROM imagenes WHERE pagina_id IN (SELECT id FROM paginas WHERE user_id = ?)", [userId]);
        // Eliminar entradas de feed del usuario
        await db_1.pool.query("DELETE FROM feed WHERE user_id = ?", [userId]);
        // Eliminar la página asociada
        await db_1.pool.query("DELETE FROM paginas WHERE user_id = ?", [userId]);
        // Eliminar el usuario
        await db_1.pool.query("DELETE FROM users WHERE id = ?", [userId]);
        res.json({ message: "Usuario, perfil, comentarios e imágenes eliminados correctamente" });
    }
    catch (error) {
        console.error(error);
        sendError(res, 500, "Error al eliminar usuario");
    }
}
async function logout(req, res) {
    res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "lax" });
    res.json({ message: "Sesión cerrada y token eliminado" });
}
const Jimp = require("jimp");
const generarAvatarBuffer_1 = require("../utils/generarAvatarBuffer");
const bcrypt = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../middlewares/db");
// const { RowDataPacket } = require("mysql2");
function sendError(res, code, msg) {
    return res.status(code).json({ error: msg });
}
async function register(req, res) {
    const { email, password } = req.body;
    const file = req.file;
    if (!email || !password)
        return sendError(res, 400, "Faltan datos requeridos");
    try {
        const [rows] = await db_1.pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (Array.isArray(rows) && rows.length > 0)
            return sendError(res, 409, "Email ya registrado");
        const hashedPassword = await bcrypt.hash(password, 10);
        const uuid = require('crypto').randomUUID();
        const username = uuid.replace(/-/g, "");
        let fotoBuffer;
        if (file && file.buffer) {
            fotoBuffer = file.buffer;
        }
        else {
            // Generar avatar por defecto con Canvas
            fotoBuffer = await (0, generarAvatarBuffer_1.generarAvatarBuffer)(username);
        }
        await db_1.pool.query("INSERT INTO users (id, email, password, username, foto_perfil) VALUES (?, ?, ?, ?, ?)", [uuid, email, hashedPassword, username, fotoBuffer]);
        // Crear página personal para el usuario con el mismo UUID
        const titulo = "Página personal";
        const contenido = `Bienvenido ${email} a tu página personal.`;
        await db_1.pool.query("INSERT INTO paginas (user_id, titulo, contenido) VALUES (?, ?, ?)", [uuid, titulo, contenido]);
        // Obtener la página recién creada
        const [pages] = await db_1.pool.query("SELECT id, user_id, titulo, contenido FROM paginas WHERE user_id = ? ORDER BY id DESC LIMIT 1", [uuid]);
        const paginaPersonal = Array.isArray(pages) && pages.length > 0 ? pages[0] : null;
        // Crear entrada en el feed con enlace a la página del usuario
        try {
            const { crearEntradaFeed } = require('./feedController');
            await crearEntradaFeed(uuid, username);
        }
        catch (err) {
            console.error('No se pudo crear la entrada en el feed:', err);
        }
        // Generar token JWT y establecer cookie
        const token = jsonwebtoken_1.default.sign({ userId: uuid }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
        res.json({ message: "Usuario creado y página personal en línea", id: uuid, username, paginaPersonal });
    }
    catch (error) {
        console.error(error);
        sendError(res, 500, "Error al registrar usuario");
    }
}
async function login(req, res) {
    const { email, password } = req.body;
    console.log('[LOGIN] Email recibido:', email);
    console.log('[LOGIN] Contraseña recibida:', password);
    if (!email || !password)
        return sendError(res, 400, "Faltan datos requeridos");
    try {
        const [rows] = await db_1.pool.query("SELECT * FROM users WHERE email = ?", [email]);
        console.log('[LOGIN] Resultado búsqueda usuario:', rows);
        if (!rows || rows.length === 0) {
            console.log('[LOGIN] Usuario no encontrado para email:', email);
            return sendError(res, 401, "Credenciales inválidas");
        }
        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('[LOGIN] Contraseña válida:', isPasswordValid);
        if (!isPasswordValid) {
            console.log('[LOGIN] Contraseña incorrecta para email:', email);
            return sendError(res, 401, "Credenciales inválidas");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
        res.json({ message: "Login exitoso", id: user.id, username: user.username, token });
    }
    catch (error) {
        console.error(error);
        sendError(res, 500, "Error al iniciar sesión");
    }
}
//# sourceMappingURL=authController.js.map