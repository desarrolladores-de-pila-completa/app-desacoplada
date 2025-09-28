import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../middlewares/db";
import { RowDataPacket } from "mysql2";

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  try {
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(409).json({ error: "Email ya registrado" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result: any = await pool.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword]
    );
    const userId = result.insertId;
    res.json({ message: "Usuario creado", id: userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const user = Array.isArray(rows) ? rows[0] as { password: string; id: number; email: string } : rows as { password: string; id: number; email: string };
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );
    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
    res.json({ message: "Inicio de sesión exitoso", id: user.id, email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
}
