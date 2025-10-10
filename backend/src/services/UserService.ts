import { User, UserCreateData, AppError } from '../types/interfaces';
import { IUserRepository, IPageRepository } from '../repositories';
import { cacheService } from './CacheService';
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
import { pool } from "../middlewares/db";
const { generarAvatarBuffer } = require("../utils/generarAvatarBuffer");

export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private pageRepository: IPageRepository
  ) {}
  /**
   * Crear un nuevo usuario con página personal
   */
  async createUser(userData: UserCreateData): Promise<User> {
    const { email, password, username, file } = userData;

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError(409, "email ya registrado");
    }

    // Verificar username único
    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new AppError(409, "El username ya está en uso");
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    // Generar avatar
    let avatarBuffer: Buffer;
    if (file && file.buffer) {
      avatarBuffer = file.buffer;
    } else {
      avatarBuffer = await generarAvatarBuffer(username);
    }

    // Usar transacción para asegurar atomicidad
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Insertar usuario
      await conn.query(
        "INSERT INTO users (id, email, password, username, foto_perfil) VALUES (?, ?, ?, ?, ?)",
        [userId, email, hashedPassword, username, avatarBuffer]
      );

      // Crear página personal
      await this.createUserPage(userId, username, email, conn);

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    // Retornar usuario creado (sin contraseña)
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(500, "Error al crear usuario");
    }
    return user;
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const cacheKey = `user:id:${userId}`;
    const cached = cacheService.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findById(userId);
    if (user) {
      cacheService.set(cacheKey, user);
    }
    return user;
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email}`;
    const cached = cacheService.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findByEmail(email);
    if (user) {
      cacheService.set(cacheKey, user);
    }
    return user;
  }

  /**
   * Obtener usuario por username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const cacheKey = `user:username:${username}`;
    const cached = cacheService.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findByUsername(username);
    if (user) {
      cacheService.set(cacheKey, user);
    }
    return user;
  }

  /**
   * Obtener usuario con contraseña para login
   */
  async getUserWithPassword(email: string): Promise<(User & { password: string }) | null> {
    return await this.userRepository.findWithPassword(email);
  }

  /**
   * Actualizar foto de perfil
   */
  async updateProfilePhoto(userId: string, photoBuffer: Buffer): Promise<void> {
    await this.userRepository.updateProfilePhoto(userId, photoBuffer);
    // Invalidar caché del usuario
    cacheService.invalidatePattern(`user:id:${userId}`);
  }

  /**
   * Actualizar username
   */
  async updateUsername(userId: string, newUsername: string): Promise<void> {
    // Verificar que el username no esté en uso
    const existing = await this.userRepository.findByUsername(newUsername);
    if (existing && existing.id !== userId) {
      throw new AppError(409, "El username ya está en uso");
    }

    await this.userRepository.updateUsername(userId, newUsername);
    // Invalidar caché del usuario
    cacheService.invalidatePattern(`user:id:${userId}`);
  }

  /**
   * Eliminar usuario completamente (cascada)
   */
  async deleteUserCompletely(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
    // Invalidar caché del usuario
    cacheService.invalidatePattern(`user:id:${userId}`);
  }

  /**
   * Crear página personal para usuario nuevo
   */
  private async createUserPage(userId: string, username: string, email: string, conn?: any): Promise<void> {
    const titulo = `Página de ${username}`;
    const contenido = `¡Hola! Esta es la página de ${username}.`;

    const queryConn = conn || pool;
    await queryConn.query(
      "INSERT INTO paginas (user_id, propietario, titulo, contenido, descripcion, usuario, comentarios) VALUES (?, 1, ?, ?, 'visible', ?, '')",
      [userId, titulo, contenido, username]
    );
  }

  /**
   * Verificar si un usuario es propietario de una página
   */
  async isPageOwner(userId: string, pageId: number): Promise<boolean> {
    return await this.userRepository.isPageOwner(userId, pageId);
  }
}