"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { getPool } = require("../middlewares/db");
const generarAvatarBuffer = require("../utils/generarAvatarBuffer");
class UserService {
    /**
     * Crear un nuevo usuario con página personal
     */
    async createUser(userData) {
        const { email, password, username, file } = userData;
        // Verificar si el usuario ya existe
        const existingUser = await this.getUserByEmail(email);
        if (existingUser) {
            throw new Error("El email ya está registrado");
        }
        // Verificar username único
        const existingUsername = await this.getUserByUsername(username);
        if (existingUsername) {
            throw new Error("El username ya está en uso");
        }
        // Hash de contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = randomUUID();
        // Generar avatar
        let avatarBuffer;
        if (file && file.buffer) {
            avatarBuffer = file.buffer;
        }
        else {
            avatarBuffer = await generarAvatarBuffer(username);
        }
        // Insertar usuario
        await getPool().query("INSERT INTO users (id, email, password, username, foto_perfil) VALUES (?, ?, ?, ?, ?)", [userId, email, hashedPassword, username, avatarBuffer]);
        // Crear página personal
        await this.createUserPage(userId, username, email);
        // Retornar usuario creado (sin contraseña)
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error("Error al crear usuario");
        }
        return user;
    }
    /**
     * Obtener usuario por ID
     */
    async getUserById(userId) {
        const [rows] = await getPool().query("SELECT id, email, username, foto_perfil, creado_en FROM users WHERE id = ?", [userId]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    /**
     * Obtener usuario por email
     */
    async getUserByEmail(email) {
        const [rows] = await getPool().query("SELECT id, email, username, foto_perfil, creado_en FROM users WHERE email = ?", [email]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    /**
     * Obtener usuario por username
     */
    async getUserByUsername(username) {
        const [rows] = await getPool().query("SELECT id, email, username, foto_perfil, creado_en FROM users WHERE username = ?", [username]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    /**
     * Obtener usuario con contraseña para login
     */
    async getUserWithPassword(email) {
        const [rows] = await getPool().query("SELECT * FROM users WHERE email = ?", [email]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    /**
     * Actualizar foto de perfil
     */
    async updateProfilePhoto(userId, photoBuffer) {
        await getPool().query("UPDATE users SET foto_perfil = ? WHERE id = ?", [photoBuffer, userId]);
    }
    /**
     * Actualizar username
     */
    async updateUsername(userId, newUsername) {
        // Verificar que el username no esté en uso
        const existing = await this.getUserByUsername(newUsername);
        if (existing && existing.id !== userId) {
            throw new Error("El username ya está en uso");
        }
        await getPool().query("UPDATE users SET username = ? WHERE id = ?", [newUsername, userId]);
    }
    /**
     * Eliminar usuario completamente (cascada)
     */
    async deleteUserCompletely(userId) {
        // Eliminar en orden para respetar foreign keys
        await getPool().query("DELETE FROM comentarios WHERE user_id = ?", [userId]);
        await getPool().query("DELETE FROM imagenes WHERE pagina_id IN (SELECT id FROM paginas WHERE user_id = ?)", [userId]);
        await getPool().query("DELETE FROM feed WHERE user_id = ?", [userId]);
        await getPool().query("DELETE FROM paginas WHERE user_id = ?", [userId]);
        await getPool().query("DELETE FROM users WHERE id = ?", [userId]);
    }
    /**
     * Crear página personal para usuario nuevo
     */
    async createUserPage(userId, username, email) {
        const titulo = `Página de ${username}`;
        const contenido = `¡Hola! Esta es la página de ${username}.`;
        await getPool().query("INSERT INTO paginas (user_id, propietario, titulo, contenido, descripcion, usuario, comentarios) VALUES (?, 1, ?, ?, 'visible', ?, '')", [userId, titulo, contenido, username]);
    }
    /**
     * Verificar si un usuario es propietario de una página
     */
    async isPageOwner(userId, pageId) {
        const [rows] = await getPool().query("SELECT user_id FROM paginas WHERE id = ?", [pageId]);
        if (rows.length === 0)
            return false;
        return (rows[0]?.user_id ?? '') === userId;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map