import { Request, Response } from "express";
import { MulterFile, AppError } from '../types/interfaces';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { getService } from '../utils/servicesConfig';
import { getAuthCookieOptions } from '../utils/cookieConfig';

const authService = getService<AuthService>('AuthService');
const userServiceAuth = getService<UserService>('UserService');

interface RequestWithFile extends Request {
  file?: MulterFile;
  validatedData?: any;
}

export async function register(req: RequestWithFile, res: Response) {
  try {
    console.log('Starting register');
    const { email, password } = req.validatedData as any; // Type assertion for now
    const file = req.file;
    console.log('Validation passed');

    const userData = { email: email.getValue(), password: password.getValue(), file };
    console.log('Calling authService.register');
    const result = await authService.register(userData);
    console.log('Auth service done');

    // Establecer cookie con token
    res.cookie("token", result.token, getAuthCookieOptions());

    // Crear entrada en el feed
    const { pool } = require('../middlewares/db');
    const mensaje = `Nuevo usuario registrado: <a href="/pagina/${result.username}">${result.username}</a>`;
    await pool.query(
      "INSERT INTO feed (user_id, mensaje) VALUES (?, ?)",
      [result.user.id, mensaje]
    );

    console.log('Sending response');
    res.json({
      message: "Usuario creado y página personal en línea",
      id: result.user.id,
      username: result.user.username,
      display_name: result.user.display_name,
      paginaPersonal: null // TODO: Obtener página personal si es necesario
    });
  } catch (error) {
    console.error('Error in register:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Error al registrar usuario");
  }
}

export async function login(req: RequestWithFile, res: Response) {
  try {
    const { email, password } = req.validatedData as any;

    const result = await authService.login(email.getValue(), password.getValue());

    // Establecer cookie con token
    res.cookie("token", result.token, getAuthCookieOptions());

    res.json({
      message: "Login exitoso",
      id: result.user.id,
      username: result.user.username,
      display_name: result.user.display_name,
      token: result.token
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Error al iniciar sesión");
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie("token", getAuthCookieOptions());
  res.json({ message: "Sesión cerrada y token eliminado" });
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  const user = await userServiceAuth.getUserById(userId);

  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.json({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    email: user.email
  });
}

// Eliminar usuario y su página
export async function eliminarUsuario(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new AppError(400, "Falta el id de usuario");
    }

    await userServiceAuth.deleteUserCompletely(userId);
    res.json({ message: "Usuario, perfil, comentarios e imágenes eliminados correctamente" });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Error al eliminar usuario");
  }
}
