"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.me = me;
exports.eliminarUsuario = eliminarUsuario;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
const interfaces_1 = require("../types/interfaces");
const servicesConfig_1 = require("../utils/servicesConfig");
const cookieConfig_1 = require("../utils/cookieConfig");
const authService = (0, servicesConfig_1.getService)('AuthService');
const userServiceAuth = (0, servicesConfig_1.getService)('UserService');
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 */
async function register(req, res) {
    const schema = zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
    });
    try {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            logger_1.default.warn('Validación fallida en registro', { issues: parsed.error.issues });
            throw new interfaces_1.AppError(400, 'Datos inválidos');
        }
        const { email, password } = parsed.data;
        const file = req.file;
        const userData = { email, password, file };
        const result = await authService.register(userData);
        res.cookie("token", result.token, (0, cookieConfig_1.getAuthCookieOptions)());
        const { pool } = require('../middlewares/db');
        const mensaje = `Nuevo usuario registrado: <a href="/pagina/${result.username}">${result.username}</a>`;
        await pool.query("INSERT INTO feed (user_id, mensaje) VALUES (?, ?)", [result.user.id, mensaje]);
        res.json({
            message: "Usuario creado y página personal en línea",
            id: result.user.id,
            username: result.user.username,
            display_name: result.user.display_name,
            paginaPersonal: null
        });
    }
    catch (error) {
        logger_1.default.error('Error en register', { error });
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al registrar usuario");
    }
}
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 */
async function login(req, res) {
    const schema = zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
    });
    try {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            logger_1.default.warn('Validación fallida en login', { issues: parsed.error.issues });
            throw new interfaces_1.AppError(400, 'Datos inválidos');
        }
        const { email, password } = parsed.data;
        const result = await authService.login(email, password);
        res.cookie("token", result.token, (0, cookieConfig_1.getAuthCookieOptions)());
        res.json({
            message: "Login exitoso",
            id: result.user.id,
            username: result.user.username,
            display_name: result.user.display_name,
            token: result.token
        });
    }
    catch (error) {
        logger_1.default.error('Error en login', { error });
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al iniciar sesión");
    }
}
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 */
async function logout(req, res) {
    res.clearCookie("token", (0, cookieConfig_1.getAuthCookieOptions)());
    res.json({ message: "Sesión cerrada y token eliminado" });
}
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener datos del usuario autenticado
 *     tags: [Auth]
 */
async function me(req, res) {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }
    const user = await userServiceAuth.getUserById(userId);
    if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
    }
    res.json({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: user.email
    });
}
/**
 * @swagger
 * /api/auth/eliminar:
 *   delete:
 *     summary: Eliminar usuario y su página
 *     tags: [Auth]
 */
async function eliminarUsuario(req, res) {
    try {
        const userId = req.params.id;
        if (!userId) {
            throw new interfaces_1.AppError(400, "Falta el id de usuario");
        }
        await userServiceAuth.deleteUserCompletely(userId);
        res.json({ message: "Usuario, perfil, comentarios e imágenes eliminados correctamente" });
    }
    catch (error) {
        logger_1.default.error('Error al eliminar usuario', { error });
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al eliminar usuario");
    }
}
//# sourceMappingURL=authController.js.map