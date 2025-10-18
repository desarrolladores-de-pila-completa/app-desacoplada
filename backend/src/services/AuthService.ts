import { UserService } from './UserService';
import { FeedService } from './FeedService';
import { User, UserCreateData, AppError, IEventBus } from '../types/interfaces';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import winston from '../utils/logger';

export class AuthService {
  private userService: UserService;
  private feedService: FeedService;
  private eventBus: IEventBus;

  constructor(userService: UserService, feedService: FeedService, eventBus: IEventBus) {
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
  async register(userData: Omit<UserCreateData, 'username'>): Promise<{
    user: User;
    token: string;
    username: string;
  }> {
    winston.info('AuthService.register called');
    // Generar username único
    const username = this.generateUniqueUsername();
    winston.debug('Username generated', { username });

    // Crear usuario usando UserService
    const fullUserData: UserCreateData = { ...userData, username };
    winston.debug('Calling userService.createUser');
    const user = await this.userService.createUser(fullUserData);
    winston.info('User created', { userId: user.id });

    // Emitir evento de usuario registrado
    try {
      await this.eventBus.emit('user.registered', {
        userId: user.id,
        username: user.username,
        email: userData.email,
      });
      winston.info('Event emitted user.registered');
    } catch (error) {
      winston.error('Error emitiendo evento user.registered', { error });
      // No fallar el registro por esto
    }

    // Generar token JWT
    winston.debug('Generating token');
    const token = this.generateToken(user.id);
    winston.debug('Token generated');

    return {
      user,
      token,
      username: user.username,
    };
  }

  /**
   * Generar username único
   */
  private generateUniqueUsername(): string {
    const { randomUUID } = require('crypto');
    return randomUUID().replace(/-/g, '');
  }

  /**
   * Autenticar usuario
   */
  async login(email: string, password: string): Promise<{
    user: User;
    token: string;
  }> {
    // Obtener usuario con contraseña
    const userWithPassword = await this.userService.getUserWithPassword(email);
    if (!userWithPassword) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Credenciales inválidas');
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
  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || "clave-secreta";
    return jwt.sign(
      { userId },
      secret,
      { expiresIn: '1h' }
    );
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token: string): { userId: string } {
    try {
      const secret = process.env.JWT_SECRET || "clave-secreta";
      const decoded = jwt.verify(token, secret) as { userId: string };
      return decoded;
    } catch (error) {
      throw new AppError(401, 'Token inválido');
    }
  }
}