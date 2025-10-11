"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const interfaces_1 = require("../types/interfaces");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
    async register(userData) {
        console.log('AuthService.register called');
        // Generar username único
        const username = this.generateUniqueUsername();
        console.log('Username generated:', username);
        // Crear usuario usando UserService
        const fullUserData = { ...userData, username };
        console.log('Calling userService.createUser');
        const user = await this.userService.createUser(fullUserData);
        console.log('User created:', user.id);
        // Emitir evento de usuario registrado
        try {
            await this.eventBus.emit('user.registered', {
                userId: user.id,
                username: user.username,
                email: userData.email,
            });
            console.log('Event emitted');
        }
        catch (error) {
            console.error('Error emitiendo evento user.registered:', error);
            // No fallar el registro por esto
        }
        // Generar token JWT
        console.log('Generating token');
        const token = this.generateToken(user.id);
        console.log('Token generated');
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