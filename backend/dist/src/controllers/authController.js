"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.eliminarUsuario = eliminarUsuario;
const interfaces_1 = require("../types/interfaces");
const AuthService_1 = require("../services/AuthService");
const UserService_1 = require("../services/UserService");
const authService = new AuthService_1.AuthService();
const userService = new UserService_1.UserService();
async function register(req, res) {
    try {
        const { email, password } = req.body;
        const file = req.file;
        const userData = { email, password, file };
        const result = await authService.register(userData);
        // Establecer cookie con token
        res.cookie("token", result.token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });
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
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        // Establecer cookie con token
        res.cookie("token", result.token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });
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
    res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "lax" });
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