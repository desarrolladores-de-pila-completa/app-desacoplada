"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const interfaces_1 = require("../types/interfaces");
const logger_1 = __importDefault(require("../utils/logger"));
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
    /**
     * Crear un nuevo usuario con página personal
     */
    async createUser(userData) {
        logger_1.default.info('UserService.createUser called');
        const { email, password, username, file } = userData;
        // Verificar si el usuario ya existe
        logger_1.default.debug('Checking existing user', { email });
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            logger_1.default.warn('Email ya registrado', { email });
            throw new interfaces_1.AppError(409, "email ya registrado");
        }
        // Verificar username único
        logger_1.default.debug('Checking existing username', { username });
        const existingUsername = await this.userRepository.findByUsername(username);
        if (existingUsername) {
            logger_1.default.warn('Username ya está en uso', { username });
            throw new interfaces_1.AppError(409, "El username ya está en uso");
        }
        // Hash de contraseña
        logger_1.default.debug('Hashing password');
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = randomUUID();
        logger_1.default.debug('UserId generated', { userId });
        // Generar avatar
        let avatarBuffer;
        if (file && file.buffer) {
            avatarBuffer = file.buffer;
        }
        else {
            console.log('Generating avatar');
            avatarBuffer = await generarAvatarBuffer(username);
        }
        console.log('Avatar generated');
        // Usar transacción para asegurar atomicidad
        console.log('Getting connection');
        const conn = await db_1.pool.getConnection();
        try {
            console.log('Beginning transaction');
            await conn.beginTransaction();
            // Insertar usuario
            console.log('Inserting user');
            await conn.query("INSERT INTO users (id, email, password, username, display_name, foto_perfil) VALUES (?, ?, ?, ?, ?, ?)", [userId, email, hashedPassword, username, username, avatarBuffer]);
            console.log('User inserted');
            // Crear página personal
            console.log('Creating user page');
            await this.createUserPage(userId, username, email, conn);
            console.log('User page created');
            console.log('Committing transaction');
            await conn.commit();
            console.log('Transaction committed');
        }
        catch (err) {
            console.log('Rolling back transaction');
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
        // Retornar usuario creado (sin contraseña)
        console.log('Finding user by id');
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new interfaces_1.AppError(500, "Error al crear usuario");
        }
        console.log('User found');
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
     * Obtener todos los usuarios
     */
    async getAllUsers() {
        const cacheKey = `users:all`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const users = await this.userRepository.findAll();
        CacheService_1.cacheService.set(cacheKey, users);
        return users;
    }
    /**
       * Actualizar foto de perfil
       */
    async updateProfilePhoto(userId, photoBuffer) {
        // Obtener información del usuario antes de actualizar para conocer username y email
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new interfaces_1.AppError(404, "Usuario no encontrado");
        }
        await this.userRepository.updateProfilePhoto(userId, photoBuffer);
        // Invalidar todos los patrones de caché relacionados con este usuario
        CacheService_1.cacheService.invalidatePattern(`user:id:${userId}`);
        CacheService_1.cacheService.invalidatePattern(`user:username:${user.username}`);
        CacheService_1.cacheService.invalidatePattern(`user:email:${user.email}`);
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
        const queryConn = conn || db_1.pool;
        await queryConn.query("INSERT INTO paginas (user_id, usuario) VALUES (?, ?)", [userId, username]);
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