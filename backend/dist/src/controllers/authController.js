"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.eliminarUsuario = eliminarUsuario;
const interfaces_1 = require("../types/interfaces");
const servicesConfig_1 = require("../utils/servicesConfig");
const cookieConfig_1 = require("../utils/cookieConfig");
const authService = (0, servicesConfig_1.getService)('AuthService');
const userService = (0, servicesConfig_1.getService)('UserService');
async function register(req, res) {
    try {
        const { email, password } = req.validatedData; // Type assertion for now
        const file = req.file;
        const userData = { email: email.getValue(), password: password.getValue(), file };
        const result = await authService.register(userData);
        // Establecer cookie con token
        res.cookie("token", result.token, (0, cookieConfig_1.getAuthCookieOptions)());
        res.json({
            message: "Usuario creado y página personal en línea",
            id: result.user.id,
            username: result.username,
            paginaPersonal: null // TODO: Obtener página personal si es necesario
        });
    }
    catch (error) {
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
// Eliminar usuario y su página
async function eliminarUsuario(req, res) {
    try {
        const userId = req.params.id;
        if (!userId) {
            throw new interfaces_1.AppError(400, "Falta el id de usuario");
        }
        await userService.deleteUserCompletely(userId);
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