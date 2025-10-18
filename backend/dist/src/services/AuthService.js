"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const interfaces_1 = require("../types/interfaces");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = __importDefault(require("../utils/logger"));
class AuthService {
    userService;
    feedService;
    eventBus;
    constructor(userService, feedService, eventBus) {
        this.userService = userService;
        this.feedService = feedService;
        this.eventBus = eventBus;
    }
    /**
     * Registrar un nuevo usuario
     */
    /**
     * Registra un nuevo usuario y retorna el usuario, token y username.
     */
    async register(userData) {
        logger_1.default.info('AuthService.register called');
        // Generar username único
        const username = this.generateUniqueUsername();
        logger_1.default.debug('Username generated', { username });
        // Crear usuario usando UserService
        const fullUserData = { ...userData, username };
        logger_1.default.debug('Calling userService.createUser');
        const user = await this.userService.createUser(fullUserData);
        logger_1.default.info('User created', { userId: user.id });
        // Emitir evento de usuario registrado
        try {
            await this.eventBus.emit('user.registered', {
                userId: user.id,
                username: user.username,
                email: userData.email,
            });
            logger_1.default.info('Event emitted user.registered');
        }
        catch (error) {
            logger_1.default.error('Error emitiendo evento user.registered', { error });
            // No fallar el registro por esto
        }
        // Generar token JWT
        logger_1.default.debug('Generating token');
        const token = this.generateToken(user.id);
        logger_1.default.debug('Token generated');
        return {
            user,
            token,
            username: user.username,
        };
    }
    /**
     * Generar username único
     */
    generateUniqueUsername() {
        const { randomUUID } = require('crypto');
        return randomUUID().replace(/-/g, '');
    }
    /**
     * Autenticar usuario
     */
    async login(email, password) {
        // Obtener usuario con contraseña
        const userWithPassword = await this.userService.getUserWithPassword(email);
        if (!userWithPassword) {
            throw new interfaces_1.AppError(401, 'Credenciales inválidas');
        }
        // Verificar contraseña
        const isPasswordValid = await bcryptjs_1.default.compare(password, userWithPassword.password);
        if (!isPasswordValid) {
            throw new interfaces_1.AppError(401, 'Credenciales inválidas');
        }
        // Retornar usuario sin contraseña
        const { password: _, ...user } = userWithPassword;
        // Generar token
        const token = this.generateToken(user.id);
        return {
            user,
            token,
        };
    }
    /**
     * Generar token JWT
     */
    generateToken(userId) {
        const secret = process.env.JWT_SECRET || "clave-secreta";
        return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn: '1h' });
    }
    /**
     * Verificar token JWT
     */
    verifyToken(token) {
        try {
            const secret = process.env.JWT_SECRET || "clave-secreta";
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded;
        }
        catch (error) {
            throw new interfaces_1.AppError(401, 'Token inválido');
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map