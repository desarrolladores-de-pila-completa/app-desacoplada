import { UserService } from './UserService';
import { FeedService } from './FeedService';
import { User, UserCreateData, AppError } from '../types/interfaces';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export class AuthService {
  private userService: UserService;
  private feedService: FeedService;

  constructor() {
    this.userService = new UserService();
    this.feedService = new FeedService();
  }

  /**
   * Registrar un nuevo usuario
   */
  async register(userData: Omit<UserCreateData, 'username'>): Promise<{
    user: User;
    token: string;
    username: string;
  }> {
    // Generar username único
    const username = this.generateUniqueUsername();

    // Crear usuario usando UserService
    const fullUserData: UserCreateData = { ...userData, username };
    const user = await this.userService.createUser(fullUserData);

    // Crear entrada en el feed
    try {
      await this.feedService.createUserRegistrationEntry(user.id, user.username);
    } catch (error) {
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
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      return decoded;
    } catch (error) {
      throw new AppError(401, 'Token inválido');
    }
  }
}