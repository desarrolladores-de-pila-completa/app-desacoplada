"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const interfaces_1 = require("../types/interfaces");
const CacheService_1 = require("./CacheService");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const db_1 = require("../middlewares/db");
const { generarAvatarBuffer } = require("../utils/generarAvatarBuffer");
class UserService {
    userRepository;
    pageRepository;
    constructor(userRepository, pageRepository) {
        this.userRepository = userRepository;
        this.pageRepository = pageRepository;
    }
    /**
     * Crear un nuevo usuario con página personal
     */
    async createUser(userData) {
        const { email, password, username, file } = userData;
        // Verificar si el usuario ya existe
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new interfaces_1.AppError(409, "email ya registrado");
        }
        // Verificar username único
        const existingUsername = await this.userRepository.findByUsername(username);
        if (existingUsername) {
            throw new interfaces_1.AppError(409, "El username ya está en uso");
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
        // Usar transacción para asegurar atomicidad
        const conn = await db_1.pool.getConnection();
        try {
            await conn.beginTransaction();
            // Insertar usuario
            await conn.query("INSERT INTO users (id, email, password, username, foto_perfil) VALUES (?, ?, ?, ?, ?)", [userId, email, hashedPassword, username, avatarBuffer]);
            // Crear página personal
            await this.createUserPage(userId, username, email, conn);
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
        // Retornar usuario creado (sin contraseña)
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new interfaces_1.AppError(500, "Error al crear usuario");
        }
        return user;
    }
    /**
     * Obtener usuario por ID
     */
    async getUserById(userId) {
        const cacheKey = `user:id:${userId}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const user = await this.userRepository.findById(userId);
        if (user) {
            CacheService_1.cacheService.set(cacheKey, user);
        }
        return user;
    }
    /**
     * Obtener usuario por email
     */
    async getUserByEmail(email) {
        const cacheKey = `user:email:${email}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const user = await this.userRepository.findByEmail(email);
        if (user) {
            CacheService_1.cacheService.set(cacheKey, user);
        }
        return user;
    }
    /**
     * Obtener usuario por username
     */
    async getUserByUsername(username) {
        const cacheKey = `user:username:${username}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const user = await this.userRepository.findByUsername(username);
        if (user) {
            CacheService_1.cacheService.set(cacheKey, user);
        }
        return user;
    }
    /**
     * Obtener usuario con contraseña para login
     */
    async getUserWithPassword(email) {
        return await this.userRepository.findWithPassword(email);
    }
    /**
     * Actualizar foto de perfil
     */
    async updateProfilePhoto(userId, photoBuffer) {
        await this.userRepository.updateProfilePhoto(userId, photoBuffer);
        // Invalidar caché del usuario
        CacheService_1.cacheService.invalidatePattern(`user:id:${userId}`);
    }
    /**
     * Actualizar username
     */
    async updateUsername(userId, newUsername) {
        // Verificar que el username no esté en uso
        const existing = await this.userRepository.findByUsername(newUsername);
        if (existing && existing.id !== userId) {
            throw new interfaces_1.AppError(409, "El username ya está en uso");
        }
        await this.userRepository.updateUsername(userId, newUsername);
        // Invalidar caché del usuario
        CacheService_1.cacheService.invalidatePattern(`user:id:${userId}`);
    }
    /**
     * Eliminar usuario completamente (cascada)
     */
    async deleteUserCompletely(userId) {
        await this.userRepository.delete(userId);
        // Invalidar caché del usuario
        CacheService_1.cacheService.invalidatePattern(`user:id:${userId}`);
    }
    /**
     * Crear página personal para usuario nuevo
     */
    async createUserPage(userId, username, email, conn) {
        const titulo = `Página de ${username}`;
        const contenido = `¡Hola! Esta es la página de ${username}.`;
        const queryConn = conn || db_1.pool;
        await queryConn.query("INSERT INTO paginas (user_id, propietario, titulo, contenido, descripcion, usuario, comentarios) VALUES (?, 1, ?, ?, 'visible', ?, '')", [userId, titulo, contenido, username]);
    }
    /**
     * Verificar si un usuario es propietario de una página
     */
    async isPageOwner(userId, pageId) {
        return await this.userRepository.isPageOwner(userId, pageId);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map