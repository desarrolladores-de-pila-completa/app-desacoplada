import { Request, Response } from "express";
import { MulterFile, AppError } from '../types/interfaces';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { getService } from '../utils/servicesConfig';
import { getAuthCookieOptions } from '../utils/cookieConfig';

const authService = getService<AuthService>('AuthService');
const userService = getService<UserService>('UserService');

interface RequestWithFile extends Request {
  file?: MulterFile;
  validatedData?: any;
}

export async function register(req: RequestWithFile, res: Response) {
  try {
    const { email, password } = req.validatedData as any; // Type assertion for now
    const file = req.file;

    const userData = { email: email.getValue(), password: password.getValue(), file };
    const result = await authService.register(userData);

    // Establecer cookie con token
    res.cookie("token", result.token, getAuthCookieOptions());

    res.json({
      message: "Usuario creado y página personal en línea",
      id: result.user.id,
      username: result.username,
      paginaPersonal: null // TODO: Obtener página personal si es necesario
    });
  } catch (error) {
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

// Eliminar usuario y su página
export async function eliminarUsuario(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new AppError(400, "Falta el id de usuario");
    }

    await userService.deleteUserCompletely(userId);
    res.json({ message: "Usuario, perfil, comentarios e imágenes eliminados correctamente" });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Error al eliminar usuario");
  }
}
