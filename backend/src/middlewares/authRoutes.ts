import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto, { randomUUID } from "crypto";

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
  message: "Demasiadas peticiones, intenta más tarde."
});

router.use(limiter);
const SECRET = process.env.JWT_SECRET || "clave-secreta";
const ENC_SECRET = process.env.ENC_SECRET || "0123456789abcdef0123456789abcdef"; // 32 chars para AES-256

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENC_SECRET, "utf8"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
    if ((rows as any[]).length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const id = randomUUID(); // Genera el UUID único
    const username = randomUUID().replace(/-/g, "");
    await pool.execute(
      "INSERT INTO users (id, email, password, username) VALUES (?, ?, ?, ?)",
      [id, email, hashed, username]
    );
    res.json({ message: "Usuario creado", id, username });
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
  const encryptedToken = encrypt(token);
  res.cookie("token", encryptedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Solo true en producción
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 3600000, // 1 hora
    path: "/"
  });
  res.json({ message: "Login exitoso", username: user.username });
});

export default router;
