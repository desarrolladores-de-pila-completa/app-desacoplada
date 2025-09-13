import { Router } from "express";
import { pool } from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Función para guardar el token en la base de datos
async function saveToken(user: any, token: string) {
  await pool.execute(
    "INSERT INTO tokens (user_id, token, created_at) VALUES (?, ?, NOW())",
    [user.id, token]
  );
}

const router = Router();
const SECRET = process.env.JWT_SECRET || "clave-secreta";

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashed]
    );
    res.json({ message: "Usuario creado" });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
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
  // Guardar el token en la base de datos
  await saveToken(user, token);

  res.json({ token });
});

export default router;
