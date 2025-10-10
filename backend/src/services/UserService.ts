import { QueryResult, User, UserCreateData, CreateUserDTO, AppError } from '../types/interfaces';
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
import { pool } from "../middlewares/db";
const generarAvatarBuffer = require("../utils/generarAvatarBuffer");

export class UserService {
  /**
   * Crear un nuevo usuario con página personal
   */
  async createUser(userData: UserCreateData): Promise<User> {
    const { email, password, username, file } = userData;

    // Verificar si el usuario ya existe
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new AppError(409, "email ya registrado");
    }

    // Verificar username único
    const existingUsername = await this.getUserByUsername(username);
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

    // Insertar usuario
    await pool.query(
      "INSERT INTO users (id, email, password, username, foto_perfil) VALUES (?, ?, ?, ?, ?)",
      [userId, email, hashedPassword, username, avatarBuffer]
    );

    // Crear página personal
    await this.createUserPage(userId, username, email);

    // Retornar usuario creado (sin contraseña)
    const user = await this.getUserById(userId);
    if (!user) {
      throw new AppError(500, "Error al crear usuario");
    }
    return user;
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const [rows]: QueryResult<User> = await pool.query(
      "SELECT id, email, username, foto_perfil, creado_en FROM users WHERE id = ?",
      [userId]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const [rows]: QueryResult<User> = await pool.query(
      "SELECT id, email, username, foto_perfil, creado_en FROM users WHERE email = ?",
      [email]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  /**
   * Obtener usuario por username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const [rows]: QueryResult<User> = await pool.query(
      "SELECT id, email, username, foto_perfil, creado_en FROM users WHERE username = ?",
      [username]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  /**
   * Obtener usuario con contraseña para login
   */
  async getUserWithPassword(email: string): Promise<(User & { password: string }) | null> {
    const [rows]: QueryResult<User & { password: string }> = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  /**
   * Actualizar foto de perfil
   */
  async updateProfilePhoto(userId: string, photoBuffer: Buffer): Promise<void> {
    await pool.query(
      "UPDATE users SET foto_perfil = ? WHERE id = ?",
      [photoBuffer, userId]
    );
  }

  /**
   * Actualizar username
   */
  async updateUsername(userId: string, newUsername: string): Promise<void> {
    // Verificar que el username no esté en uso
    const existing = await this.getUserByUsername(newUsername);
    if (existing && existing.id !== userId) {
      throw new AppError(409, "El username ya está en uso");
    }

    await pool.query(
      "UPDATE users SET username = ? WHERE id = ?",
      [newUsername, userId]
    );
  }

  /**
   * Eliminar usuario completamente (cascada)
   */
  async deleteUserCompletely(userId: string): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Eliminar en orden para respetar foreign keys
      await conn.query("DELETE FROM comentarios WHERE user_id = ?", [userId]);
      await conn.query(
        "DELETE FROM imagenes WHERE pagina_id IN (SELECT id FROM paginas WHERE user_id = ?)",
        [userId]
      );
      await conn.query("DELETE FROM feed WHERE user_id = ?", [userId]);
      await conn.query("DELETE FROM paginas WHERE user_id = ?", [userId]);
      await conn.query("DELETE FROM users WHERE id = ?", [userId]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Crear página personal para usuario nuevo
   */
  private async createUserPage(userId: string, username: string, email: string): Promise<void> {
    const titulo = `Página de ${username}`;
    const contenido = `¡Hola! Esta es la página de ${username}.`;
    
    await pool.query(
      "INSERT INTO paginas (user_id, propietario, titulo, contenido, descripcion, usuario, comentarios) VALUES (?, 1, ?, ?, 'visible', ?, '')",
      [userId, titulo, contenido, username]
    );
  }

  /**
   * Verificar si un usuario es propietario de una página
   */
  async isPageOwner(userId: string, pageId: number): Promise<boolean> {
    const [rows]: QueryResult<{ user_id: string }> = await pool.query(
      "SELECT user_id FROM paginas WHERE id = ?",
      [pageId]
    );
    
    if (rows.length === 0) return false;
    return (rows[0]?.user_id ?? '') === userId;
  }
}