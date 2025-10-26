"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("../middlewares/db");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { generarAvatarBuffer } = require("../utils/generarAvatarBuffer");
class UserRepository {
    /**
     * Crea un nuevo usuario en la base de datos.
     */
    async create(userData) {
        logger_1.default.info('UserRepository.create', { email: userData.email, username: userData.username });
        const { email, password, username, file } = userData;
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
        await db_1.pool.query("INSERT INTO users (id, email, password, username, foto_perfil) VALUES (?, ?, ?, ?, ?)", [userId, email, hashedPassword, username, avatarBuffer]);
        // Retornar usuario creado (sin contraseña)
        const user = await this.findById(userId);
        if (!user) {
            logger_1.default.error('Error al crear usuario', { userId });
            throw new Error("Error al crear usuario");
        }
        return user;
    }
    async findById(id) {
        const [rows] = await db_1.pool.query("SELECT id, email, username, display_name, foto_perfil, creado_en FROM users WHERE id = ?", [id]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    async findByEmail(email) {
        const [rows] = await db_1.pool.query("SELECT id, email, username, display_name, foto_perfil, creado_en FROM users WHERE email = ?", [email]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    async findByUsername(username) {
        const [rows] = await db_1.pool.query("SELECT id, email, username, display_name, foto_perfil, creado_en FROM users WHERE username = ?", [username]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    async findWithPassword(email) {
        const [rows] = await db_1.pool.query("SELECT * FROM users WHERE email = ?", [email]);
        return rows.length > 0 ? (rows[0] ?? null) : null;
    }
    async findAll() {
        const [rows] = await db_1.pool.query("SELECT id, email, username, display_name, foto_perfil, creado_en FROM users ORDER BY creado_en DESC");
        return rows;
    }
    async updateProfilePhoto(userId, photoBuffer) {
        await db_1.pool.query("UPDATE users SET foto_perfil = ? WHERE id = ?", [photoBuffer, userId]);
    }
    async updateUsername(userId, newUsername) {
        await db_1.pool.query("UPDATE users SET username = ? WHERE id = ?", [newUsername, userId]);
    }
    async delete(userId) {
        const conn = await db_1.pool.getConnection();
        try {
            await conn.beginTransaction();
            // Eliminar en orden para respetar foreign keys
            await conn.query("DELETE FROM comentarios WHERE user_id = ?", [userId]);
            await conn.query("DELETE FROM imagenes WHERE pagina_id IN (SELECT id FROM paginas WHERE user_id = ?)", [userId]);
            await conn.query("DELETE FROM paginas WHERE user_id = ?", [userId]);
            await conn.query("DELETE FROM users WHERE id = ?", [userId]);
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
    async isPageOwner(userId, pageId) {
        const [rows] = await db_1.pool.query("SELECT user_id FROM paginas WHERE id = ?", [pageId]);
        if (rows.length === 0)
            return false;
        return (rows[0]?.user_id ?? '') === userId;
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map