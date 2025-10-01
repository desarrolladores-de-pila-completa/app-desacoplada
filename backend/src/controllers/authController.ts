// Eliminar usuario y su página
export async function eliminarUsuario(req: Request, res: Response) {
  const userId = req.params.id;
  if (!userId) return sendError(res, 400, "Falta el id de usuario");
  try {
    // Eliminar la página asociada
    await pool.query("DELETE FROM paginas WHERE user_id = ?", [userId]);
    // Eliminar el usuario
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "Usuario y página eliminados correctamente" });
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Error al eliminar usuario");
  }
}
export async function logout(req: Request, res: Response) {
  res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "lax" });
  res.json({ message: "Sesión cerrada y token eliminado" });
}
export async function cambiarEmail(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { email } = req.body;
  if (!userId) return sendError(res, 401, "No autenticado");
  if (!email || typeof email !== "string" || !/^.+@.+\..+$/.test(email)) {
    return sendError(res, 400, "Correo electrónico inválido");
  }
  try {
    // Verificar si el correo ya está en uso
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (Array.isArray(rows) && rows.length > 0) {
      return sendError(res, 409, "El correo ya está en uso");
    }
    // Actualizar el correo
    await pool.query("UPDATE users SET email = ? WHERE id = ?", [email, userId]);
    res.json({ message: "Correo actualizado correctamente" });
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Error al actualizar el correo");
  }
}
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../middlewares/db";
import { RowDataPacket } from "mysql2";

function sendError(res: Response, code: number, msg: string) {
  return res.status(code).json({ error: msg });
}

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 400, "Faltan datos requeridos");
  try {
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (Array.isArray(rows) && rows.length > 0) return sendError(res, 409, "Email ya registrado");
    const hashedPassword = await bcrypt.hash(password, 10);
    const uuid = require('crypto').randomUUID();
    const username = uuid.replace(/-/g, "");
    await pool.query(
      "INSERT INTO users (id, email, password, username) VALUES (?, ?, ?, ?)",
      [uuid, email, hashedPassword, username]
    );

    // Crear página personal para el usuario con el mismo UUID
    const titulo = "Página personal";
    const contenido = `Bienvenido ${email} a tu página personal.`;
    await pool.query(
      "INSERT INTO paginas (user_id, titulo, contenido) VALUES (?, ?, ?)",
      [uuid, titulo, contenido]
    );

    // Obtener la página recién creada
    const [pages]: any = await pool.query(
      "SELECT id, user_id, titulo, contenido FROM paginas WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [uuid]
    );
    const paginaPersonal = Array.isArray(pages) && pages.length > 0 ? pages[0] : null;

    // Generar token JWT y establecer cookie
    const token = jwt.sign(
      { userId: uuid },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );
    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
    res.json({ message: "Usuario creado y página personal en línea", id: uuid, paginaPersonal });
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Error al registrar usuario");
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 400, "Faltan datos requeridos");
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows || rows.length === 0) return sendError(res, 401, "Credenciales inválidas");
    const user = rows[0] as { password: string; id: number; email: string };
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return sendError(res, 401, "Credenciales inválidas");
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );
  res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
  res.json({ message: "Login exitoso", id: user.id });
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Error al iniciar sesión");
  }
}

export async function cambiarUsername(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { username } = req.body;
  if (!userId) return sendError(res, 401, "No autenticado");
  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return sendError(res, 400, "Nombre de usuario inválido");
  }
  try {
    // Verificar si el username ya está en uso
    const [rows] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (Array.isArray(rows) && rows.length > 0) {
      return sendError(res, 409, "El nombre de usuario ya está en uso");
    }
    // Actualizar el username
    await pool.query("UPDATE users SET username = ? WHERE id = ?", [username, userId]);
    res.json({ message: "Nombre de usuario actualizado" });
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Error al actualizar nombre de usuario");
  }
}
