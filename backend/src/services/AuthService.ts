import { UserService } from './UserService';
import { User, UserCreateData, AppError, IEventBus, AuthResponse } from '../types/interfaces';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import winston from '../utils/logger';

export class AuthService {
  private userService: UserService;
  private eventBus: IEventBus;

  constructor(userService: UserService, eventBus: IEventBus) {
    this.userService = userService;
    this.eventBus = eventBus;
  }

  /**
    * Registrar un nuevo usuario
    */
   async register(userData: Omit<UserCreateData, 'username'>): Promise<AuthResponse> {
     winston.info('AuthService.register called');
     // Generar username único
     const username = this.generateUniqueUsername();
     winston.debug('Username generated', { username });

     // Crear usuario usando UserService
     const fullUserData: UserCreateData = { ...userData, username };
     winston.debug('Calling userService.createUser');
     const user = await this.userService.createUser(fullUserData);
     winston.info('User created', { userId: user.id });

     // Generar tokens para el nuevo usuario
     const { accessToken, refreshToken } = this.generateTokens(user.id);
     winston.debug('Tokens generated for new user', { userId: user.id });

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

     return {
       user,
       accessToken,
       refreshToken,
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
    * Autenticar usuario para Passport
    */
   async login(email: string, password: string): Promise<AuthResponse> {
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

     // Generar tokens para el usuario autenticado
     const { accessToken, refreshToken } = this.generateTokens(user.id);
     winston.debug('Tokens generated for login', { userId: user.id });

     return {
       user,
       accessToken,
       refreshToken,
       username: user.username,
     };
   }

  /**
   * Generar tokens JWT (access y refresh)
   */
  private generateTokens(userId: string): { accessToken: string; refreshToken: string } {
    const secret = process.env.JWT_SECRET || "clave-secreta";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh-secret";

    // Token de acceso: duración corta (15 minutos)
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      secret,
      { expiresIn: '15m' }
    );

    // Token de refresh: duración larga (7 días)
    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      refreshSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * @deprecated Usar generateTokens en su lugar
   */
  private generateToken(userId: string): string {
    const { accessToken } = this.generateTokens(userId);
    return accessToken;
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

  /**
   * Refrescar tokens usando refresh token con rotación automática
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh-secret";
      const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string; type: string; rotationCount?: number };

      if (decoded.type !== 'refresh') {
        throw new AppError(401, 'Token de refresh inválido');
      }

      // Verificar que el usuario existe
      const user = await this.userService.getUserById(decoded.userId);
      if (!user) {
        throw new AppError(401, 'Usuario no encontrado');
      }

      // Verificar límite de rotación (máximo 5 rotaciones por refresh token)
      const rotationCount = (decoded.rotationCount || 0) + 1;
      if (rotationCount > 5) {
        throw new AppError(401, 'Refresh token ha excedido el límite de rotación');
      }

      // Generar nuevos tokens con contador de rotación
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokensWithRotation(user.id, rotationCount);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(401, 'Refresh token expirado');
      }
      throw new AppError(401, 'Refresh token inválido');
    }
  }

  /**
   * Generar tokens JWT con rotación de refresh token
   */
  private generateTokensWithRotation(userId: string, rotationCount: number = 0): { accessToken: string; refreshToken: string } {
    const secret = process.env.JWT_SECRET || "clave-secreta";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh-secret";

    // Token de acceso: duración corta (15 minutos)
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      secret,
      { expiresIn: '15m' }
    );

    // Refresh token con rotación: duración larga (7 días) con contador
    const refreshToken = jwt.sign(
      { userId, type: 'refresh', rotationCount },
      refreshSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verificar si un token está próximo a expirar (menos de 5 minutos)
   */
  isTokenNearExpiry(token: string): boolean {
    try {
      const secret = process.env.JWT_SECRET || "clave-secreta";
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

      if (!decoded.exp) return true;

      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60;

      return (decoded.exp - now) < fiveMinutes;
    } catch (error) {
      return true; // Si no se puede verificar, asumir que está próximo a expirar
    }
  }

  /**
   * Obtener información del token sin verificar (para debugging)
   */
  getTokenInfo(token: string): any {
    try {
      const secret = process.env.JWT_SECRET || "clave-secreta";
      return jwt.verify(token, secret) as jwt.JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Invalidar sesión de usuario (logout forzado)
   */
  async invalidateUserSession(userId: string): Promise<void> {
    // En una implementación más avanzada, podrías mantener una lista negra de tokens
    // Por ahora, simplemente registramos el evento
    winston.info('Sesión invalidada para usuario', { userId, context: 'auth' });
  }

  /**
   * Obtener sesiones activas del usuario (para futuras mejoras)
   */
  async getUserSessions(userId: string): Promise<any[]> {
    // Esta es una implementación básica
    // En una versión más avanzada podrías rastrear sesiones múltiples
    return [{
      userId,
      active: true,
      lastActivity: new Date(),
      ip: 'tracked',
      userAgent: 'tracked'
    }];
  }

  /**
   * Verificar si el usuario tiene sesiones múltiples sospechosas
   */
  async checkSuspiciousActivity(userId: string): Promise<boolean> {
    // Implementación básica - en producción querrías rastrear IPs, user agents, etc.
    const sessions = await this.getUserSessions(userId);
    return sessions.length > 3; // Más de 3 sesiones activas podría ser sospechoso
  }

  /**
   * Extender sesión automáticamente (sliding sessions)
   * Se llama cuando hay actividad del usuario para extender la sesión
   */
  async extendSession(userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    extended: boolean;
  }> {
    try {
      // Verificar que el usuario existe
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new AppError(401, 'Usuario no encontrado');
      }

      // Generar nuevos tokens con extensión de sesión
      const { accessToken, refreshToken } = this.generateTokensWithRotation(user.id);

      winston.info('Sesión extendida automáticamente', {
        userId,
        context: 'sliding-session',
        timestamp: new Date().toISOString()
      });

      return {
        accessToken,
        refreshToken,
        extended: true
      };
    } catch (error) {
      winston.error('Error al extender sesión', { error, userId });
      throw new AppError(500, 'Error al extender sesión');
    }
  }

  /**
   * Verificar si la sesión debe extenderse automáticamente
   * Se basa en la actividad reciente del usuario
   */
  shouldExtendSession(lastActivity: Date): boolean {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos

    // Extender si la última actividad fue hace menos de 5 minutos
    return timeSinceLastActivity < fiveMinutes;
  }

  /**
   * Actualizar timestamp de última actividad del usuario
   */
  async updateLastActivity(userId: string): Promise<void> {
    // En una implementación más avanzada, podrías guardar esto en la base de datos
    // Por ahora, solo registramos en los logs
    winston.debug('Última actividad actualizada', {
      userId,
      timestamp: new Date().toISOString(),
      context: 'activity-tracking'
    });
  }
}