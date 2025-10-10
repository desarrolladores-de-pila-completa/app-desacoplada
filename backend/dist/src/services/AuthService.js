"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const UserService_1 = require("./UserService");
const FeedService_1 = require("./FeedService");
const interfaces_1 = require("../types/interfaces");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class AuthService {
    userService;
    feedService;
    constructor() {
        this.userService = new UserService_1.UserService();
        this.feedService = new FeedService_1.FeedService();
    }
    /**
     * Registrar un nuevo usuario
     */
    async register(userData) {
        // Generar username único
        const username = this.generateUniqueUsername();
        // Crear usuario usando UserService
        const fullUserData = { ...userData, username };
        const user = await this.userService.createUser(fullUserData);
        // Crear entrada en el feed
        try {
            await this.feedService.createUserRegistrationEntry(user.id, user.username);
        }
        catch (error) {
            console.error('Error creando entrada en feed:', error);
            // No fallar el registro por esto
        }
        // Generar token JWT
        const token = this.generateToken(user.id);
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
        return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }
    /**
     * Verificar token JWT
     */
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            return decoded;
        }
        catch (error) {
            throw new interfaces_1.AppError(401, 'Token inválido');
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map