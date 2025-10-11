import { QueryResult, User, UserCreateData } from '../types/interfaces';
import { pool } from "../middlewares/db";
import { IUserRepository } from './IUserRepository';
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { generarAvatarBuffer } = require("../utils/generarAvatarBuffer");

export class UserRepository implements IUserRepository {
  async create(userData: UserCreateData): Promise<User> {
    const { email, password, username, file } = userData;

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

    // Retornar usuario creado (sin contraseña)
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("Error al crear usuario");
    }
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [rows]: QueryResult<User & { display_name: string }> = await pool.query(
      "SELECT id, email, username, display_name, foto_perfil, creado_en FROM users WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows]: QueryResult<User & { display_name: string }> = await pool.query(
      "SELECT id, email, username, display_name, foto_perfil, creado_en FROM users WHERE email = ?",
      [email]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const [rows]: QueryResult<User & { display_name: string }> = await pool.query(
      "SELECT id, email, username, display_name, foto_perfil, creado_en FROM users WHERE username = ?",
      [username]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  async findWithPassword(email: string): Promise<(User & { password: string }) | null> {
    const [rows]: QueryResult<User & { password: string }> = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return rows.length > 0 ? (rows[0] ?? null) : null;
  }

  async updateProfilePhoto(userId: string, photoBuffer: Buffer): Promise<void> {
    await pool.query(
      "UPDATE users SET foto_perfil = ? WHERE id = ?",
      [photoBuffer, userId]
    );
  }

  async updateUsername(userId: string, newUsername: string): Promise<void> {
    await pool.query(
      "UPDATE users SET username = ? WHERE id = ?",
      [newUsername, userId]
    );
  }

  async delete(userId: string): Promise<void> {
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

  async isPageOwner(userId: string, pageId: number): Promise<boolean> {
    const [rows]: QueryResult<{ user_id: string }> = await pool.query(
      "SELECT user_id FROM paginas WHERE id = ?",
      [pageId]
    );

    if (rows.length === 0) return false;
    return (rows[0]?.user_id ?? '') === userId;
  }
}