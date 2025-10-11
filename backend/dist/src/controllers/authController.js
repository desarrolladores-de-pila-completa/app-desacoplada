"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.me = me;
exports.eliminarUsuario = eliminarUsuario;
const interfaces_1 = require("../types/interfaces");
const servicesConfig_1 = require("../utils/servicesConfig");
const cookieConfig_1 = require("../utils/cookieConfig");
const authService = (0, servicesConfig_1.getService)('AuthService');
const userServiceAuth = (0, servicesConfig_1.getService)('UserService');
async function register(req, res) {
    try {
        console.log('Starting register');
        const { email, password } = req.validatedData; // Type assertion for now
        const file = req.file;
        console.log('Validation passed');
        const userData = { email: email.getValue(), password: password.getValue(), file };
        console.log('Calling authService.register');
        const result = await authService.register(userData);
        console.log('Auth service done');
        // Establecer cookie con token
        res.cookie("token", result.token, (0, cookieConfig_1.getAuthCookieOptions)());
        // Crear entrada en el feed
        const { pool } = require('../middlewares/db');
        const mensaje = `Nuevo usuario registrado: <a href="/pagina/${result.username}">${result.username}</a>`;
        await pool.query("INSERT INTO feed (user_id, mensaje) VALUES (?, ?)", [result.user.id, mensaje]);
        console.log('Sending response');
        res.json({
            message: "Usuario creado y página personal en línea",
            id: result.user.id,
            username: result.user.username,
            display_name: result.user.display_name,
            paginaPersonal: null // TODO: Obtener página personal si es necesario
        });
    }
    catch (error) {
        console.error('Error in register:', error);
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al registrar usuario");
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.validatedData;
        const result = await authService.login(email.getValue(), password.getValue());
        // Establecer cookie con token
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
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al iniciar sesión");
    }
}
async function logout(req, res) {
    res.clearCookie("token", (0, cookieConfig_1.getAuthCookieOptions)());
    res.json({ message: "Sesión cerrada y token eliminado" });
}
async function me(req, res) {
    const userId = req.userId;
    if (!userId)
        return res.status(401).json({ error: 'No autenticado' });
    const user = await userServiceAuth.getUserById(userId);
    if (!user)
        return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: user.email
    });
}
// Eliminar usuario y su página
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
        if (error instanceof interfaces_1.AppError) {
            throw error;
        }
        throw new interfaces_1.AppError(500, "Error al eliminar usuario");
    }
}
//# sourceMappingURL=authController.js.map