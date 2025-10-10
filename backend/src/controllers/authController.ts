import { Request, Response } from "express";
import { MulterFile, AppError } from '../types/interfaces';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { RegisterSchema, LoginSchema, validateRequest } from '../validation/schemas';

const authService = new AuthService();
const userService = new UserService();

interface RequestWithFile extends Request {
  file?: MulterFile;
}

export async function register(req: RequestWithFile, res: Response) {
  try {
    const { email, password } = req.body;
    const file = req.file;

    const userData = { email, password, file };
    const result = await authService.register(userData);

    // Establecer cookie con token
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

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

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    // Establecer cookie con token
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

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
  res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "lax" });
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
