import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login } from "../controllers/authController";
import { pool } from "../middlewares/db";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const router = Router();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // máximo 20 peticiones por IP por minuto
  message: { error: "Demasiadas peticiones, intenta más tarde." }
});

router.use(limiter);
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
router.post("/login", login);

router.get("/user/:value", async (req, res) => {
  const { value } = req.params;
  try {
    const [rows] = await pool.execute(
      "SELECT id, email, username FROM users WHERE id = ? OR email = ?",
      [value, value]
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json((rows as any[])[0]);
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
