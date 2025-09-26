import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Función para guardar el token en la base de datos
async function saveToken(user: any, token: string) {
  await pool.execute(
    "INSERT INTO tokens (user_id, token, created_at) VALUES (?, ?, NOW())",
    [user.id, token]
  );
}

const router = Router();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // máximo 20 peticiones por IP por minuto
  message: { error: "Demasiadas peticiones, intenta más tarde." }
});

router.use(limiter);
const SECRET = process.env.JWT_SECRET || "clave-secreta";

import { randomUUID } from "crypto";

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Verificar si el email ya existe
    const [rows] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
    if ((rows as any[]).length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    const hashed = await bcrypt.hash(password, 10);
  // Generar username único usando solo uuid4
  const username = randomUUID().replace(/-/g, "");
    await pool.execute(
      "INSERT INTO users (email, password, username) VALUES (?, ?, ?)",
      [email, hashed, username]
    );
    res.json({ message: "Usuario creado", username });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
  const users = rows as any[];

  if (users.length === 0) return res.status(400).json({ error: "Credenciales inválidas" });

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Credenciales inválidas" });

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Solo true en producción
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 3600000, // 1 hora
    path: "/"
  });
  res.json({ message: "Login exitoso", username: user.username });
});

export default router;
