import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../middlewares/db";
import { RowDataPacket } from "mysql2";

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }
  try {
    // Verificar si el email ya está registrado
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(409).json({ message: "Email ya registrado" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result: any = await pool.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword]
    );
    res.status(201).json({ message: "Usuario registrado", userId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    const user = Array.isArray(rows) ? rows[0] as { password: string; id: number } : rows as { password: string; id: number };
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );
  res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
    res.json({ message: "Inicio de sesión exitoso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
}
