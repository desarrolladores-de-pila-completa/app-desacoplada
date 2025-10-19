import { User, UserCreateData, AppError } from '../types/interfaces';
import winston from '../utils/logger';
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
  /**
   * Crear un nuevo usuario con página personal
   */
  async createUser(userData: UserCreateData): Promise<User> {
    winston.info('UserService.createUser called');
    const { email, password, username, file } = userData;

    // Verificar si el usuario ya existe
    winston.debug('Checking existing user', { email });
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      winston.warn('Email ya registrado', { email });
      throw new AppError(409, "email ya registrado");
    }

    // Verificar username único
    winston.debug('Checking existing username', { username });
    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      winston.warn('Username ya está en uso', { username });
      throw new AppError(409, "El username ya está en uso");
    }

    // Hash de contraseña
    winston.debug('Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    winston.debug('UserId generated', { userId });

    // Generar avatar
    let avatarBuffer: Buffer;
    if (file && file.buffer) {
      avatarBuffer = file.buffer;
    } else {
      console.log('Generating avatar');
      avatarBuffer = await generarAvatarBuffer(username);
    }
    console.log('Avatar generated');

    // Usar transacción para asegurar atomicidad
    console.log('Getting connection');
    const conn = await pool.getConnection();
    try {
      console.log('Beginning transaction');
      await conn.beginTransaction();

      // Insertar usuario
      console.log('Inserting user');
      await conn.query(
        "INSERT INTO users (id, email, password, username, display_name, foto_perfil) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, email, hashedPassword, username, username, avatarBuffer]
      );
      console.log('User inserted');

      // Crear página personal
      console.log('Creating user page');
      await this.createUserPage(userId, username, email, conn);
      console.log('User page created');

      console.log('Committing transaction');
      await conn.commit();
      console.log('Transaction committed');
    } catch (err) {
      console.log('Rolling back transaction');
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    // Retornar usuario creado (sin contraseña)
    console.log('Finding user by id');
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(500, "Error al crear usuario");
    }
    console.log('User found');
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
     // Obtener información del usuario antes de actualizar para conocer username y email
     const user = await this.userRepository.findById(userId);
     if (!user) {
       throw new AppError(404, "Usuario no encontrado");
     }

     await this.userRepository.updateProfilePhoto(userId, photoBuffer);

     // Invalidar todos los patrones de caché relacionados con este usuario
     cacheService.invalidatePattern(`user:id:${userId}`);
     cacheService.invalidatePattern(`user:username:${user.username}`);
     cacheService.invalidatePattern(`user:email:${user.email}`);
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
    const queryConn = conn || pool;
    await queryConn.query(
      "INSERT INTO paginas (user_id, usuario) VALUES (?, ?)",
      [userId, username]
    );
  }

  /**
   * Verificar si un usuario es propietario de una página
   */
  async isPageOwner(userId: string, pageId: number): Promise<boolean> {
    return await this.userRepository.isPageOwner(userId, pageId);
  }
}